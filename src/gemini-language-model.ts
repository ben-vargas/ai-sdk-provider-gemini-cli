import { randomUUID } from 'node:crypto';
import type {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1CallWarning,
  LanguageModelV1FinishReason,
  LanguageModelV1FunctionTool,
  LanguageModelV1FunctionToolCall,
  LanguageModelV1StreamPart,
} from '@ai-sdk/provider';
import type {
  ContentGenerator,
  ContentGeneratorConfig,
} from '@google/gemini-cli-core';
import type {
  GenerateContentParameters,
  GenerateContentConfig,
  Part,
  Content,
} from '@google/genai';
import { initializeGeminiClient } from './client';
import { mapPromptToGeminiFormat } from './message-mapper';
import { mapToolsToGeminiFormat } from './tool-mapper';
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
): LanguageModelV1FinishReason {
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

export class GeminiLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = 'v1' as const;
  readonly provider = 'gemini-cli-core';
  readonly defaultObjectGenerationMode = 'json' as const;
  readonly supportsImageUrls = false; // CLI Core uses base64 data, not URLs
  readonly supportsStructuredOutputs = true;

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
  async doGenerate(options: LanguageModelV1CallOptions): Promise<{
    text?: string;
    toolCalls?: LanguageModelV1FunctionToolCall[];
    finishReason: LanguageModelV1FinishReason;
    usage: {
      promptTokens: number;
      completionTokens: number;
    };
    rawCall: {
      rawPrompt: unknown;
      rawSettings: Record<string, unknown>;
    };
    rawResponse?: {
      headers?: Record<string, string>;
      body?: unknown;
    };
    request?: {
      body?: string;
    };
    response?: {
      id?: string;
      timestamp?: Date;
      modelId?: string;
    };
    warnings?: LanguageModelV1CallWarning[];
  }> {
    try {
      const { contentGenerator } = await this.ensureInitialized();

      // Map the prompt to Gemini format
      const { contents, systemInstruction } = mapPromptToGeminiFormat(options);

      // Prepare generation config
      const generationConfig: GenerateContentConfig = {
        temperature: options.temperature,
        topP: options.topP,
        topK: options.topK,
        maxOutputTokens: options.maxTokens || 65536, // Default to 65536 (64K) - max supported by Gemini 2.5 models
        stopSequences: options.stopSequences,
        responseMimeType:
          options.mode.type === 'object-json'
            ? 'application/json'
            : 'text/plain',
      };

      // Map tools if provided in regular mode
      let tools;
      if (options.mode.type === 'regular' && options.mode.tools) {
        // Filter to only function tools (not provider-defined tools)
        const functionTools = options.mode.tools.filter(
          (tool): tool is LanguageModelV1FunctionTool =>
            tool.type === 'function'
        );
        if (functionTools.length > 0) {
          tools = mapToolsToGeminiFormat(functionTools);
        }
      }

      // Create the request parameters
      const request: GenerateContentParameters & {
        systemInstruction?: Content;
        tools?: unknown;
      } = {
        model: this.modelId,
        contents,
        config: generationConfig,
      };

      // Add system instruction if present - Gemini supports this as a separate field
      if (systemInstruction) {
        request.systemInstruction = systemInstruction;
      }

      // Add tools if present
      if (tools) {
        request.tools = tools;
      }

      // Generate content
      const response = await contentGenerator.generateContent(request);

      // Extract the result
      const candidate = response.candidates?.[0];
      const responseContent = candidate?.content;
      let text = responseContent?.parts?.[0]?.text || '';

      // Extract JSON if in object-json mode
      if (options.mode.type === 'object-json' && text) {
        text = extractJson(text);
      }

      // Parse tool calls if present
      let toolCalls: LanguageModelV1FunctionToolCall[] | undefined;
      if (responseContent?.parts) {
        toolCalls = responseContent.parts
          .filter((part): part is Part => !!part.functionCall)
          .map((part) => ({
            toolCallType: 'function' as const,
            toolCallId: randomUUID(),
            toolName: part.functionCall!.name || '',
            args: JSON.stringify(part.functionCall!.args || {}),
          }));
      }

      return {
        text,
        toolCalls: toolCalls?.length ? toolCalls : undefined,
        finishReason: mapGeminiFinishReason(candidate?.finishReason),
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        },
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
      };
    } catch (error) {
      throw mapGeminiError(error);
    }
  }

  /**
   * Streaming generation method
   */
  async doStream(options: LanguageModelV1CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV1StreamPart>;
    rawCall: {
      rawPrompt: unknown;
      rawSettings: Record<string, unknown>;
    };
    rawResponse?: {
      headers?: Record<string, string>;
    };
    warnings?: LanguageModelV1CallWarning[];
  }> {
    try {
      const { contentGenerator } = await this.ensureInitialized();

      // Map the prompt to Gemini format
      const { contents, systemInstruction } = mapPromptToGeminiFormat(options);

      // Prepare generation config
      const generationConfig: GenerateContentConfig = {
        temperature: options.temperature,
        topP: options.topP,
        topK: options.topK,
        maxOutputTokens: options.maxTokens || 65536, // Default to 65536 (64K) - max supported by Gemini 2.5 models
        stopSequences: options.stopSequences,
        responseMimeType:
          options.mode.type === 'object-json'
            ? 'application/json'
            : 'text/plain',
      };

      // Map tools if provided in regular mode
      let tools;
      if (options.mode.type === 'regular' && options.mode.tools) {
        // Filter to only function tools (not provider-defined tools)
        const functionTools = options.mode.tools.filter(
          (tool): tool is LanguageModelV1FunctionTool =>
            tool.type === 'function'
        );
        if (functionTools.length > 0) {
          tools = mapToolsToGeminiFormat(functionTools);
        }
      }

      // Create the request parameters
      const request: GenerateContentParameters & {
        systemInstruction?: Content;
        tools?: unknown;
      } = {
        model: this.modelId,
        contents,
        config: generationConfig,
      };

      // Add system instruction if present - Gemini supports this as a separate field
      if (systemInstruction) {
        request.systemInstruction = systemInstruction;
      }

      // Add tools if present
      if (tools) {
        request.tools = tools;
      }

      // Create streaming response
      const streamResponse =
        await contentGenerator.generateContentStream(request);

      // Transform the stream to AI SDK format
      const stream = new ReadableStream<LanguageModelV1StreamPart>({
        async start(controller) {
          try {
            let accumulatedText = '';
            const isObjectJsonMode = options.mode.type === 'object-json';

            for await (const chunk of streamResponse) {
              const candidate = chunk.candidates?.[0];
              const content = candidate?.content;

              if (content?.parts) {
                for (const part of content.parts) {
                  if (part.text) {
                    if (isObjectJsonMode) {
                      // In object-json mode, accumulate text
                      accumulatedText += part.text;
                    } else {
                      // In regular mode, stream immediately
                      controller.enqueue({
                        type: 'text-delta',
                        textDelta: part.text,
                      });
                    }
                  } else if (part.functionCall) {
                    controller.enqueue({
                      type: 'tool-call',
                      toolCallType: 'function',
                      toolCallId: randomUUID(),
                      toolName: part.functionCall.name || '',
                      args: JSON.stringify(part.functionCall.args || {}),
                    });
                  }
                }
              }

              if (candidate?.finishReason) {
                // If in object-json mode, extract and emit the JSON before finishing
                if (isObjectJsonMode && accumulatedText) {
                  const extractedJson = extractJson(accumulatedText);
                  controller.enqueue({
                    type: 'text-delta',
                    textDelta: extractedJson,
                  });
                }

                controller.enqueue({
                  type: 'finish',
                  finishReason: mapGeminiFinishReason(candidate.finishReason),
                  usage: {
                    promptTokens: chunk.usageMetadata?.promptTokenCount || 0,
                    completionTokens:
                      chunk.usageMetadata?.candidatesTokenCount || 0,
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
                textDelta: extractedJson,
              });
            }

            controller.close();
          } catch (error) {
            controller.error(mapGeminiError(error));
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
