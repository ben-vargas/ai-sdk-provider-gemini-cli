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
import {
  type GenerateContentParameters,
  type GenerateContentConfig,
} from '@google/genai';
import { initializeGeminiClient } from './client';
import { mapPromptToGeminiFormat } from './message-mapper';
import { mapGeminiToolConfig, mapToolsToGeminiFormat } from './tool-mapper';
import { mapGeminiError } from './error';
import { extractJson } from './extract-json';
import type { GeminiProviderOptions } from './types';

export interface GeminiLanguageModelOptions {
  modelId: string;
  providerOptions: GeminiProviderOptions;
  settings?: Record<string, unknown>;
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

export class GeminiLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = 'v2' as const;
  readonly provider = 'gemini-cli-core';
  readonly defaultObjectGenerationMode = 'json' as const;
  readonly supportsImageUrls = false; // CLI Core uses base64 data, not URLs
  readonly supportedUrls = {}; // No native URL support
  readonly supportsStructuredOutputs = false; // V2 structured outputs not supported yet

  private contentGenerator?: ContentGenerator;
  private config?: ContentGeneratorConfig;
  private initPromise?: Promise<void>;

  readonly modelId: string;
  readonly settings?: Record<string, unknown>;
  private providerOptions: GeminiProviderOptions;

  constructor(options: GeminiLanguageModelOptions) {
    this.modelId = options.modelId;
    this.providerOptions = options.providerOptions;
    this.settings = options.settings;
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
    try {
      const { contentGenerator } = await this.ensureInitialized();

      // Map the prompt to Gemini format
      const { contents, systemInstruction } = mapPromptToGeminiFormat(options);

      // Prepare generation config
      const generationConfig: GenerateContentConfig = {
        temperature:
          options.temperature ??
          (this.settings?.temperature as number | undefined),
        topP: options.topP ?? (this.settings?.topP as number | undefined),
        topK: options.topK ?? (this.settings?.topK as number | undefined),
        maxOutputTokens:
          options.maxOutputTokens ??
          (this.settings?.maxOutputTokens as number | undefined),
        stopSequences: options.stopSequences,
        responseMimeType:
          options.responseFormat?.type === 'json'
            ? 'application/json'
            : 'text/plain',
        toolConfig: mapGeminiToolConfig(options),
      };

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
      try {
        response = await contentGenerator.generateContent(
          request,
          randomUUID()
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
            let text = part.text;
            // Extract JSON if in object-json mode
            if (options.responseFormat?.type === 'json') {
              text = extractJson(text);
            }
            content.push({
              type: 'text',
              text: text,
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

      return {
        content,
        finishReason: mapGeminiFinishReason(candidate?.finishReason),
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
        warnings: [],
      };
    } catch (error) {
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
    try {
      const { contentGenerator } = await this.ensureInitialized();

      // Map the prompt to Gemini format
      const { contents, systemInstruction } = mapPromptToGeminiFormat(options);

      // Prepare generation config
      const generationConfig: GenerateContentConfig = {
        temperature:
          options.temperature ??
          (this.settings?.temperature as number | undefined),
        topP: options.topP ?? (this.settings?.topP as number | undefined),
        topK: options.topK ?? (this.settings?.topK as number | undefined),
        maxOutputTokens:
          options.maxOutputTokens ??
          (this.settings?.maxOutputTokens as number | undefined),
        stopSequences: options.stopSequences,
        responseMimeType:
          options.responseFormat?.type === 'json'
            ? 'application/json'
            : 'text/plain',
      };

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

      // Capture modelId for use in stream
      const modelId = this.modelId;

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
            let accumulatedText = '';
            const isObjectJsonMode = options.responseFormat?.type === 'json';
            let currentToolCallId: string | undefined;
            let totalInputTokens = 0;
            let totalOutputTokens = 0;

            // Emit stream-start event
            controller.enqueue({
              type: 'stream-start',
              warnings: [],
            });

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
                    if (isObjectJsonMode) {
                      // In object-json mode, accumulate text
                      accumulatedText += part.text;
                    } else {
                      // In regular mode, stream text directly
                      controller.enqueue({
                        type: 'text-delta',
                        id: randomUUID(),
                        delta: part.text,
                      });
                    }
                  } else if (part.functionCall) {
                    // Emit tool call as a single event
                    currentToolCallId = randomUUID();
                    controller.enqueue({
                      type: 'tool-call',
                      toolCallId: currentToolCallId,
                      toolName: part.functionCall.name || '',
                      input: JSON.stringify(part.functionCall.args || {}),
                    });
                    currentToolCallId = undefined;
                  }
                }
              }

              if (candidate?.finishReason) {
                // If in object-json mode, extract and emit the JSON before finishing
                if (isObjectJsonMode && accumulatedText) {
                  const extractedJson = extractJson(accumulatedText);
                  controller.enqueue({
                    type: 'text-delta',
                    id: randomUUID(),
                    delta: extractedJson,
                  });
                }

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
                  finishReason: mapGeminiFinishReason(candidate.finishReason),
                  usage: {
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens,
                    totalTokens: totalInputTokens + totalOutputTokens,
                  },
                });
              }
            }

            // Final check for object-json mode if we didn't get a finish reason
            if (
              isObjectJsonMode &&
              accumulatedText &&
              !controller.desiredSize
            ) {
              const extractedJson = extractJson(accumulatedText);
              controller.enqueue({
                type: 'text-delta',
                id: randomUUID(),
                delta: extractedJson,
              });

              // Emit response metadata and finish
              controller.enqueue({
                type: 'response-metadata',
                id: randomUUID(),
                timestamp: new Date(),
                modelId: modelId,
              });
              controller.enqueue({
                type: 'finish',
                finishReason: 'stop',
                usage: {
                  inputTokens: totalInputTokens,
                  outputTokens: totalOutputTokens,
                  totalTokens: totalInputTokens + totalOutputTokens,
                },
              });
            }

            controller.close();
          } catch (error) {
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
      throw mapGeminiError(error);
    }
  }
}
