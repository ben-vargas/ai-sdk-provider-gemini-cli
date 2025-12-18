import { randomUUID } from 'node:crypto';
import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2FinishReason,
  LanguageModelV2FunctionTool,
  LanguageModelV2StreamPart,
  LanguageModelV2Content,
  LanguageModelV2Usage,
} from '@ai-sdk/provider';
import type {
  ContentGenerator,
  ContentGeneratorConfig,
} from '@google/gemini-cli-core';
import type {
  GenerateContentParameters,
  GenerateContentConfig,
} from '@google/genai';

/**
 * ThinkingLevel enum for Gemini 3 models.
 * Note: This is defined locally as @google/genai v1.30.0 doesn't export it yet.
 * Values match the official @google/genai v1.34.0 ThinkingLevel enum format.
 * Will be replaced with the official enum when gemini-cli-core upgrades.
 */
export enum ThinkingLevel {
  /** Minimizes latency and cost. Best for simple tasks. */
  LOW = 'LOW',
  /** Balanced thinking for most tasks. (Gemini 3 Flash only) */
  MEDIUM = 'MEDIUM',
  /** Maximizes reasoning depth. May take longer for first token. */
  HIGH = 'HIGH',
  /** Matches "no thinking" for most queries. (Gemini 3 Flash only) */
  MINIMAL = 'MINIMAL',
}
import { initializeGeminiClient } from './client';
import { mapPromptToGeminiFormat } from './message-mapper';
import { mapGeminiToolConfig, mapToolsToGeminiFormat } from './tool-mapper';
import { mapGeminiError } from './error';
import type { GeminiProviderOptions, Logger } from './types';
import { getLogger, createVerboseLogger } from './logger';

export interface GeminiLanguageModelOptions {
  modelId: string;
  providerOptions: GeminiProviderOptions;
  settings?: Record<string, unknown> & {
    logger?: Logger | false;
    verbose?: boolean;
  };
}

/**
 * Input interface for thinkingConfig settings.
 * Supports both Gemini 3 (thinkingLevel) and Gemini 2.5 (thinkingBudget) models.
 */
export interface ThinkingConfigInput {
  /**
   * Thinking level for Gemini 3 models (gemini-3-pro-preview, gemini-3-flash-preview).
   * Accepts case-insensitive strings ('high', 'HIGH', 'High') or ThinkingLevel enum.
   * Valid values: 'low', 'medium', 'high', 'minimal'
   */
  thinkingLevel?: string | ThinkingLevel;
  /**
   * Token budget for thinking in Gemini 2.5 models.
   * Common values: 0 (disabled), 512, 8192 (default), -1 (unlimited)
   */
  thinkingBudget?: number;
  /**
   * Whether to include thinking/reasoning in the response.
   */
  includeThoughts?: boolean;
}

/**
 * Normalize thinkingLevel string to ThinkingLevel enum (case-insensitive).
 * Returns undefined for invalid values, allowing the API to handle validation.
 */
function normalizeThinkingLevel(level: string): ThinkingLevel | undefined {
  const normalized = level.toUpperCase();
  switch (normalized) {
    case 'LOW':
      return ThinkingLevel.LOW;
    case 'MEDIUM':
      return ThinkingLevel.MEDIUM;
    case 'HIGH':
      return ThinkingLevel.HIGH;
    case 'MINIMAL':
      return ThinkingLevel.MINIMAL;
    default:
      return undefined;
  }
}

/**
 * Map Gemini finish reasons to Vercel AI SDK finish reasons
 */
function mapGeminiFinishReason(
  geminiReason?: string
): LanguageModelV2FinishReason {
  switch (geminiReason) {
    case 'STOP':
      return 'stop';
    case 'MAX_TOKENS':
      return 'length';
    case 'SAFETY':
    case 'RECITATION':
      return 'content-filter';
    case 'OTHER':
      return 'other';
    default:
      return 'unknown';
  }
}

/**
 * Extended ThinkingConfig type that includes thinkingLevel (not yet in @google/genai v1.30.0 types).
 * This is a temporary workaround until the official types are updated.
 * Using Omit to remove any existing thinkingLevel type and replace with our enum.
 */
type ExtendedThinkingConfig = Omit<
  NonNullable<GenerateContentConfig['thinkingConfig']>,
  'thinkingLevel'
> & {
  thinkingLevel?: ThinkingLevel;
};

/**
 * Build thinkingConfig from user input, normalizing string thinkingLevel to enum.
 */
function buildThinkingConfig(input: ThinkingConfigInput): ExtendedThinkingConfig {
  const config = {} as ExtendedThinkingConfig;

  // Handle thinkingLevel (string or enum)
  if (input.thinkingLevel !== undefined) {
    if (typeof input.thinkingLevel === 'string') {
      const normalized = normalizeThinkingLevel(input.thinkingLevel);
      if (normalized !== undefined) {
        config.thinkingLevel = normalized;
      }
      // If normalization fails, we skip setting thinkingLevel
      // and let the API handle any validation errors
    } else {
      // Already a ThinkingLevel enum value
      config.thinkingLevel = input.thinkingLevel;
    }
  }

  // Handle thinkingBudget (number)
  if (input.thinkingBudget !== undefined) {
    config.thinkingBudget = input.thinkingBudget;
  }

  // Handle includeThoughts (boolean)
  if (input.includeThoughts !== undefined) {
    config.includeThoughts = input.includeThoughts;
  }

  return config;
}

/**
 * Prepare generation config with proper handling for JSON mode and thinkingConfig.
 *
 * When JSON response format is requested WITHOUT a schema, we downgrade to
 * text/plain and emit a warning. This aligns with Claude-code provider behavior
 * and prevents raw fenced JSON from leaking to clients.
 *
 * When a schema IS provided, we use native responseJsonSchema for structured output.
 *
 * ThinkingConfig supports both Gemini 3 (thinkingLevel) and Gemini 2.5 (thinkingBudget).
 */
function prepareGenerationConfig(
  options: LanguageModelV2CallOptions,
  settings?: Record<string, unknown>
): {
  generationConfig: GenerateContentConfig;
  warnings: LanguageModelV2CallWarning[];
} {
  const warnings: LanguageModelV2CallWarning[] = [];

  // Extract schema if JSON mode with schema is requested
  const responseFormat = options.responseFormat;
  const isJsonMode = responseFormat?.type === 'json';
  const schema = isJsonMode ? responseFormat.schema : undefined;
  const hasSchema = isJsonMode && schema !== undefined;

  // JSON without schema: downgrade to text/plain with warning
  if (isJsonMode && !hasSchema) {
    warnings.push({
      type: 'unsupported-setting',
      setting: 'responseFormat',
      details:
        'JSON response format without a schema is not supported. Treating as plain text. Provide a schema for structured output.',
    });
  }

  // Handle thinkingConfig from options (call-time) or settings (model-level)
  // Call-time options take precedence over settings
  const userThinkingConfig =
    ((options as Record<string, unknown>)
      .thinkingConfig as ThinkingConfigInput) ??
    (settings?.thinkingConfig as ThinkingConfigInput | undefined);

  const thinkingConfig = userThinkingConfig
    ? buildThinkingConfig(userThinkingConfig)
    : undefined;

  const generationConfig: GenerateContentConfig = {
    temperature:
      options.temperature ?? (settings?.temperature as number | undefined),
    topP: options.topP ?? (settings?.topP as number | undefined),
    topK: options.topK ?? (settings?.topK as number | undefined),
    maxOutputTokens:
      options.maxOutputTokens ??
      (settings?.maxOutputTokens as number | undefined),
    stopSequences: options.stopSequences,
    // Only use application/json when we have a schema to enforce it
    responseMimeType: hasSchema ? 'application/json' : 'text/plain',
    // Pass schema directly to Gemini API for native structured output
    responseJsonSchema: hasSchema ? schema : undefined,
    toolConfig: mapGeminiToolConfig(options),
    // Pass thinkingConfig for Gemini 3 (thinkingLevel) or Gemini 2.5 (thinkingBudget)
    // Cast needed because our ThinkingLevel enum isn't recognized by @google/genai v1.30.0 types
    thinkingConfig: thinkingConfig as GenerateContentConfig['thinkingConfig'],
  };

  return { generationConfig, warnings };
}

export class GeminiLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = 'v2' as const;
  readonly provider = 'gemini-cli-core';
  readonly defaultObjectGenerationMode = 'json' as const;
  readonly supportsImageUrls = false; // CLI Core uses base64 data, not URLs
  readonly supportedUrls = {}; // No native URL support
  readonly supportsStructuredOutputs = true; // Native Gemini responseJsonSchema support

  private contentGenerator?: ContentGenerator;
  private config?: ContentGeneratorConfig;
  private initPromise?: Promise<void>;

  readonly modelId: string;
  readonly settings?: Record<string, unknown>;
  private providerOptions: GeminiProviderOptions;
  private logger: Logger;

  constructor(options: GeminiLanguageModelOptions) {
    this.modelId = options.modelId;
    this.providerOptions = options.providerOptions;
    this.settings = options.settings;

    // Create logger that respects verbose setting
    const baseLogger = getLogger(options.settings?.logger);
    this.logger = createVerboseLogger(
      baseLogger,
      options.settings?.verbose ?? false
    );
  }

  private async ensureInitialized(): Promise<{
    contentGenerator: ContentGenerator;
    config: ContentGeneratorConfig;
  }> {
    if (this.contentGenerator && this.config) {
      return { contentGenerator: this.contentGenerator, config: this.config };
    }

    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }

    await this.initPromise;
    return { contentGenerator: this.contentGenerator!, config: this.config! };
  }

  private async initialize(): Promise<void> {
    try {
      const { client, config } = await initializeGeminiClient(
        this.providerOptions,
        this.modelId
      );
      this.contentGenerator = client;
      this.config = config;
    } catch (error) {
      throw new Error(`Failed to initialize Gemini model: ${String(error)}`);
    }
  }

  /**
   * Non-streaming generation method
   */
  async doGenerate(options: LanguageModelV2CallOptions): Promise<{
    content: LanguageModelV2Content[];
    finishReason: LanguageModelV2FinishReason;
    usage: LanguageModelV2Usage;
    rawCall: {
      rawPrompt: unknown;
      rawSettings: Record<string, unknown>;
    };
    rawResponse?: {
      body?: unknown;
    };
    response?: {
      id?: string;
      timestamp?: Date;
      modelId?: string;
    };
    warnings: LanguageModelV2CallWarning[];
  }> {
    this.logger.debug(
      `[gemini-cli] Starting doGenerate request with model: ${this.modelId}`
    );

    try {
      const { contentGenerator } = await this.ensureInitialized();

      // Map the prompt to Gemini format
      const { contents, systemInstruction } = mapPromptToGeminiFormat(options);

      this.logger.debug(
        `[gemini-cli] Request mode: ${options.responseFormat?.type === 'json' ? 'object-json' : 'regular'}, response format: ${options.responseFormat?.type ?? 'none'}`
      );

      this.logger.debug(
        `[gemini-cli] Converted ${options.prompt.length} messages`
      );

      // Prepare generation config with proper JSON mode handling
      // (downgrades to text/plain with warning if JSON requested without schema)
      const { generationConfig, warnings } = prepareGenerationConfig(
        options,
        this.settings
      );

      // Map tools if provided in regular mode
      let tools;
      if (options.tools) {
        // Filter to only function tools (not provider-defined tools)
        const functionTools = options.tools.filter(
          (tool): tool is LanguageModelV2FunctionTool =>
            tool.type === 'function'
        );
        if (functionTools.length > 0) {
          tools = mapToolsToGeminiFormat(functionTools);
        }
      }

      // Create the request parameters
      const request: GenerateContentParameters = {
        model: this.modelId,
        contents,
        config: {
          ...generationConfig,
          systemInstruction: systemInstruction,
          tools: tools,
        },
      };

      // Set up abort handling
      let abortListener: (() => void) | undefined;
      if (options.abortSignal) {
        // Check if already aborted
        if (options.abortSignal.aborted) {
          const abortError = new Error('Request aborted');
          abortError.name = 'AbortError';
          throw abortError;
        }

        // Set up listener for abort signal
        // LIMITATION: The gemini-cli-core library doesn't expose request cancellation
        // We can only check abort status before/after the request, not cancel in-flight
        abortListener = () => {
          // Track abort state - actual cancellation happens via status checks
        };
        options.abortSignal.addEventListener('abort', abortListener, {
          once: true,
        });
      }

      // Generate content (new signature requires userPromptId)
      let response;
      const startTime = Date.now();
      try {
        this.logger.debug('[gemini-cli] Executing generateContent request');

        response = await contentGenerator.generateContent(
          request,
          randomUUID()
        );

        const duration = Date.now() - startTime;
        this.logger.info(
          `[gemini-cli] Request completed - Duration: ${duration}ms`
        );

        // Check if aborted during generation
        if (options.abortSignal?.aborted) {
          const abortError = new Error('Request aborted');
          abortError.name = 'AbortError';
          throw abortError;
        }
      } finally {
        // Clean up abort listener
        if (options.abortSignal && abortListener) {
          options.abortSignal.removeEventListener('abort', abortListener);
        }
      }

      // Extract the result
      const candidate = response.candidates?.[0];
      const responseContent = candidate?.content;

      // Build content array for v2 format
      const content: LanguageModelV2Content[] = [];

      if (responseContent?.parts) {
        for (const part of responseContent.parts) {
          if (part.text) {
            // With native responseJsonSchema, the output is already clean JSON
            content.push({
              type: 'text',
              text: part.text,
            });
          } else if (part.functionCall) {
            content.push({
              type: 'tool-call',
              toolCallId: randomUUID(),
              toolName: part.functionCall.name || '',
              input: JSON.stringify(part.functionCall.args || {}),
            } as LanguageModelV2Content);
          }
        }
      }

      // Calculate token usage
      const inputTokens = response.usageMetadata?.promptTokenCount || 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = inputTokens + outputTokens;

      const usage: LanguageModelV2Usage = {
        inputTokens,
        outputTokens,
        totalTokens,
      };

      this.logger.debug(
        `[gemini-cli] Token usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`
      );

      const finishReason = mapGeminiFinishReason(candidate?.finishReason);
      this.logger.debug(`[gemini-cli] Finish reason: ${finishReason}`);

      return {
        content,
        finishReason,
        usage,
        rawCall: {
          rawPrompt: { contents, systemInstruction, generationConfig, tools },
          rawSettings: generationConfig as Record<string, unknown>,
        },
        rawResponse: {
          body: response,
        },
        response: {
          id: randomUUID(),
          timestamp: new Date(),
          modelId: this.modelId,
        },
        warnings,
      };
    } catch (error) {
      this.logger.debug(
        `[gemini-cli] Error during doGenerate: ${error instanceof Error ? error.message : String(error)}`
      );
      throw mapGeminiError(error);
    }
  }

  /**
   * Streaming generation method
   */
  async doStream(options: LanguageModelV2CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV2StreamPart>;
    rawCall: {
      rawPrompt: unknown;
      rawSettings: Record<string, unknown>;
    };
  }> {
    this.logger.debug(
      `[gemini-cli] Starting doStream request with model: ${this.modelId}`
    );

    try {
      const { contentGenerator } = await this.ensureInitialized();

      // Map the prompt to Gemini format
      const { contents, systemInstruction } = mapPromptToGeminiFormat(options);

      this.logger.debug(
        `[gemini-cli] Stream mode: ${options.responseFormat?.type === 'json' ? 'object-json' : 'regular'}, response format: ${options.responseFormat?.type ?? 'none'}`
      );

      this.logger.debug(
        `[gemini-cli] Converted ${options.prompt.length} messages for streaming`
      );

      // Prepare generation config with proper JSON mode handling
      // (downgrades to text/plain with warning if JSON requested without schema)
      const { generationConfig, warnings } = prepareGenerationConfig(
        options,
        this.settings
      );

      // Map tools if provided in regular mode
      let tools;
      if (options.tools) {
        // Filter to only function tools (not provider-defined tools)
        const functionTools = options.tools.filter(
          (tool): tool is LanguageModelV2FunctionTool =>
            tool.type === 'function'
        );
        if (functionTools.length > 0) {
          tools = mapToolsToGeminiFormat(functionTools);
        }
      }

      // Create the request parameters
      const request: GenerateContentParameters = {
        model: this.modelId,
        contents,
        config: {
          ...generationConfig,
          systemInstruction: systemInstruction,
          tools: tools,
        },
      };

      // Set up abort handling
      let abortListener: (() => void) | undefined;
      if (options.abortSignal) {
        // Check if already aborted
        if (options.abortSignal.aborted) {
          const abortError = new Error('Request aborted');
          abortError.name = 'AbortError';
          throw abortError;
        }

        // Set up listener for abort signal
        // LIMITATION: The gemini-cli-core library doesn't expose stream cancellation
        // We can only check abort status during iteration, not cancel the underlying stream
        abortListener = () => {
          // Track abort state - actual cancellation happens via status checks
        };
        options.abortSignal.addEventListener('abort', abortListener, {
          once: true,
        });
      }

      // Create streaming response (new signature requires userPromptId)
      let streamResponse;
      try {
        this.logger.debug(
          '[gemini-cli] Starting generateContentStream request'
        );

        streamResponse = await contentGenerator.generateContentStream(
          request,
          randomUUID()
        );

        // Check if aborted during stream creation
        if (options.abortSignal?.aborted) {
          const abortError = new Error('Request aborted');
          abortError.name = 'AbortError';
          throw abortError;
        }
      } catch (error) {
        // Clean up abort listener on error
        if (options.abortSignal && abortListener) {
          options.abortSignal.removeEventListener('abort', abortListener);
        }
        throw error;
      }

      // Capture modelId, logger, and warnings for use in stream
      const modelId = this.modelId;
      const logger = this.logger;
      const streamWarnings = warnings;

      // Transform the stream to AI SDK v5 format
      const stream = new ReadableStream<LanguageModelV2StreamPart>({
        async start(controller) {
          try {
            // Check for abort signal in stream
            if (options.abortSignal?.aborted) {
              const abortError = new Error('Request aborted');
              abortError.name = 'AbortError';
              controller.error(abortError);
              return;
            }
            let totalInputTokens = 0;
            let totalOutputTokens = 0;

            // Emit stream-start event with any warnings
            controller.enqueue({
              type: 'stream-start',
              warnings: streamWarnings,
            });

            const streamStartTime = Date.now();
            logger.debug('[gemini-cli] Stream started, processing chunks');

            for await (const chunk of streamResponse) {
              // Check if aborted during streaming
              if (options.abortSignal?.aborted) {
                const abortError = new Error('Request aborted');
                abortError.name = 'AbortError';
                controller.error(abortError);
                break;
              }

              const candidate = chunk.candidates?.[0];
              const content = candidate?.content;

              // Update token counts if available
              if (chunk.usageMetadata) {
                totalInputTokens = chunk.usageMetadata.promptTokenCount || 0;
                totalOutputTokens =
                  chunk.usageMetadata.candidatesTokenCount || 0;
              }

              if (content?.parts) {
                for (const part of content.parts) {
                  if (part.text) {
                    // With native responseJsonSchema, stream text directly
                    // (output is already clean JSON when schema is provided)
                    controller.enqueue({
                      type: 'text-delta',
                      id: randomUUID(),
                      delta: part.text,
                    });
                  } else if (part.functionCall) {
                    // Emit tool call as a single event
                    controller.enqueue({
                      type: 'tool-call',
                      toolCallId: randomUUID(),
                      toolName: part.functionCall.name || '',
                      input: JSON.stringify(part.functionCall.args || {}),
                    });
                  }
                }
              }

              if (candidate?.finishReason) {
                const duration = Date.now() - streamStartTime;
                logger.info(
                  `[gemini-cli] Stream completed - Duration: ${duration}ms`
                );

                logger.debug(
                  `[gemini-cli] Stream token usage - Input: ${totalInputTokens}, Output: ${totalOutputTokens}, Total: ${totalInputTokens + totalOutputTokens}`
                );

                const finishReason = mapGeminiFinishReason(
                  candidate.finishReason
                );
                logger.debug(
                  `[gemini-cli] Stream finish reason: ${finishReason}`
                );

                // Emit response metadata
                controller.enqueue({
                  type: 'response-metadata',
                  id: randomUUID(),
                  timestamp: new Date(),
                  modelId: modelId,
                });

                // Emit finish event
                controller.enqueue({
                  type: 'finish',
                  finishReason,
                  usage: {
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens,
                    totalTokens: totalInputTokens + totalOutputTokens,
                  },
                });
              }
            }

            logger.debug('[gemini-cli] Stream finalized, closing stream');
            controller.close();
          } catch (error) {
            logger.debug(
              `[gemini-cli] Error during doStream: ${error instanceof Error ? error.message : String(error)}`
            );
            controller.error(mapGeminiError(error));
          } finally {
            // Clean up abort listener
            if (options.abortSignal && abortListener) {
              options.abortSignal.removeEventListener('abort', abortListener);
            }
          }
        },
        cancel: () => {
          // Clean up abort listener on cancel
          if (options.abortSignal && abortListener) {
            options.abortSignal.removeEventListener('abort', abortListener);
          }
        },
      });

      return {
        stream,
        rawCall: {
          rawPrompt: { contents, systemInstruction, generationConfig, tools },
          rawSettings: generationConfig as Record<string, unknown>,
        },
      };
    } catch (error) {
      this.logger.debug(
        `[gemini-cli] Error creating stream: ${error instanceof Error ? error.message : String(error)}`
      );
      throw mapGeminiError(error);
    }
  }
}
