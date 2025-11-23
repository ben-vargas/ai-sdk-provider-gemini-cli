import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiLanguageModel } from '../gemini-language-model';
import { initializeGeminiClient } from '../client';
import { mapPromptToGeminiFormat } from '../message-mapper';
import type {
  LanguageModelV2FunctionTool,
  LanguageModelV2CallOptions,
} from '@ai-sdk/provider';
import { FunctionCallingConfigMode } from '@google/genai';

// Mock dependencies
vi.mock('../client');
vi.mock('../message-mapper');

describe('GeminiLanguageModel', () => {
  let model: GeminiLanguageModel;
  let mockClient: any;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations
    mockClient = {
      generateContent: vi.fn(),
      generateContentStream: vi.fn(),
    };

    vi.mocked(initializeGeminiClient).mockResolvedValue({
      client: mockClient,
      config: {
        maxRetries: 3,
        timeout: 30000,
      },
    });

    vi.mocked(mapPromptToGeminiFormat).mockReturnValue({
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Who are you?' }],
        },
      ],
      systemInstruction: {
        role: 'user',
        parts: [{ text: 'You are a helpful assistant' }],
      },
    });

    // Create model instance for testing
    model = new GeminiLanguageModel({
      modelId: 'gemini-2.5-pro',
      providerOptions: { authType: 'gemini-api-key', apiKey: 'test-key' },
      settings: {},
    });
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(model.modelId).toBe('gemini-2.5-pro');
      expect(model.provider).toBe('gemini-cli-core');
      expect(model.specificationVersion).toBe('v2');
      expect(model.defaultObjectGenerationMode).toBe('json');
      expect(model.supportsImageUrls).toBe(false);
    });
  });

  describe('doGenerate', () => {
    it('should generate text successfully', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Hello, world!' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 20,
        },
      };

      mockClient.generateContent.mockResolvedValue(mockResponse);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'system',
          content: 'You are a helpful assistant',
        },
        {
          role: 'user',
          content: [{ type: 'text', text: 'Who are you?' }],
        },
      ];

      const result = await model.doGenerate({
        prompt: messages,
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect((result.content[0] as any).text).toBe('Hello, world!');
      expect(result.finishReason).toBe('stop');
      expect(result.usage).toEqual({
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
      });
    });

    it('should handle tool calls', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    name: 'getWeather',
                    args: { location: 'London' },
                  },
                },
              ],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 15,
          candidatesTokenCount: 25,
        },
      };

      mockClient.generateContent.mockResolvedValue(mockResponse);

      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'getWeather',
          description: 'Get weather information',
          inputSchema: {
            type: 'object',
            properties: {
              location: { type: 'string' },
            },
          },
        },
      ];

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'What is the weather in London?' }],
        },
      ];

      const result = await model.doGenerate({
        prompt: messages,
        tools,
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('tool-call');
      const toolCall = result.content[0] as any;
      expect(toolCall.toolCallId).toBeDefined();
      expect(toolCall.toolName).toBe('getWeather');
      expect(toolCall.input).toBe('{"location":"London"}');
    });

    it('should handle JSON mode with native schema support', async () => {
      // With native responseJsonSchema, Gemini returns clean JSON without markdown
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: '{"name": "John", "age": 30}' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 30,
        },
      };

      mockClient.generateContent.mockResolvedValue(mockResponse);

      const jsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      };

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Generate a person object' }],
        },
      ];

      const result = await model.doGenerate({
        prompt: messages,
        responseFormat: { type: 'json', schema: jsonSchema },
      });

      expect(result.content[0].type).toBe('text');
      expect((result.content[0] as any).text).toBe(
        '{"name": "John", "age": 30}'
      );

      // Verify responseJsonSchema is passed to Gemini API
      expect(mockClient.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            responseMimeType: 'application/json',
            responseJsonSchema: jsonSchema,
          }),
        }),
        expect.any(String)
      );
    });

    it('should downgrade JSON mode without schema to text/plain with warning', async () => {
      // When JSON is requested without a schema, should downgrade to text/plain
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Some plain text response' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 30,
        },
      };

      mockClient.generateContent.mockResolvedValue(mockResponse);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Generate something' }],
        },
      ];

      const result = await model.doGenerate({
        prompt: messages,
        responseFormat: { type: 'json' }, // No schema provided
      });

      // Should return the text as-is
      expect(result.content[0].type).toBe('text');
      expect((result.content[0] as any).text).toBe('Some plain text response');

      // Should emit unsupported-setting warning
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('unsupported-setting');
      expect(result.warnings[0].setting).toBe('responseFormat');
      expect(result.warnings[0].details).toContain('without a schema');

      // Should use text/plain, not application/json
      expect(mockClient.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            responseMimeType: 'text/plain',
          }),
        }),
        expect.any(String)
      );

      // Should NOT include responseJsonSchema
      const callArgs = mockClient.generateContent.mock.calls[0][0];
      expect(callArgs.config.responseJsonSchema).toBeUndefined();
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 0,
        },
      };

      mockClient.generateContent.mockResolvedValue(mockResponse);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Hello' }],
        },
      ];

      const result = await model.doGenerate({
        prompt: messages,
      });

      expect(result.content).toHaveLength(0);
      expect(result.finishReason).toBe('stop');
    });

    it('should handle multi-modal input', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'I see a cat in the image' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 50,
          candidatesTokenCount: 40,
        },
      };

      mockClient.generateContent.mockResolvedValue(mockResponse);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What do you see?' },
            {
              type: 'file',
              data: 'base64imagedata',
              contentType: 'image/jpeg',
            },
          ],
        },
      ];

      const result = await model.doGenerate({
        prompt: messages,
      });

      expect(result.content[0].type).toBe('text');
      expect((result.content[0] as any).text).toBe('I see a cat in the image');
    });

    it('should handle system messages', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'I am a helpful assistant!' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 12,
          candidatesTokenCount: 18,
        },
      };

      mockClient.generateContent.mockResolvedValue(mockResponse);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'system',
          content: 'You are a helpful assistant',
        },
        {
          role: 'user',
          content: [{ type: 'text', text: 'Who are you?' }],
        },
      ];

      const result = await model.doGenerate({
        prompt: messages,
      });

      expect(result.content[0].type).toBe('text');
      expect((result.content[0] as any).text).toBe('I am a helpful assistant!');
      expect(mapPromptToGeminiFormat).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: messages,
        })
      );
    });

    it('should respect temperature settings', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Response with custom settings' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 8,
          candidatesTokenCount: 12,
        },
      };

      mockClient.generateContent.mockResolvedValue(mockResponse);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Test' }],
        },
      ];

      await model.doGenerate({
        prompt: messages,
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1000,
      });

      expect(mockClient.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1000,
          }),
        }),
        expect.any(String) // UUID for userPromptId
      );
    });

    it('should handle errors gracefully', async () => {
      mockClient.generateContent.mockRejectedValue(
        new Error('API Error: Rate limit exceeded')
      );

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Hello' }],
        },
      ];

      await expect(
        model.doGenerate({
          prompt: messages,
        })
      ).rejects.toThrow();
    });
  });

  describe('doStream', () => {
    it('should stream text successfully', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [{ text: 'Hello' }],
                },
              },
            ],
          };
          yield {
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [{ text: ', world!' }],
                },
                finishReason: 'STOP',
              },
            ],
            usageMetadata: {
              promptTokenCount: 10,
              candidatesTokenCount: 20,
            },
          };
        },
      };

      mockClient.generateContentStream.mockResolvedValue(mockStream);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Say hello' }],
        },
      ];

      const result = await model.doStream({
        prompt: messages,
      });

      const streamParts: any[] = [];
      const reader = result.stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamParts.push(value);
      }

      expect(streamParts).toHaveLength(5); // stream-start, 2 text-delta chunks, response-metadata, finish
      expect(streamParts[0]).toEqual({ type: 'stream-start', warnings: [] });
      expect(streamParts[1]).toEqual(
        expect.objectContaining({
          type: 'text-delta',
          delta: 'Hello',
        })
      );
      expect(streamParts[2]).toEqual(
        expect.objectContaining({
          type: 'text-delta',
          delta: ', world!',
        })
      );
      expect(streamParts[3].type).toBe('response-metadata');
      expect(streamParts[4]).toEqual(
        expect.objectContaining({
          type: 'finish',
          finishReason: 'stop',
          usage: {
            inputTokens: 10,
            outputTokens: 20,
            totalTokens: 30,
          },
        })
      );
    });

    it('should stream tool calls', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [
                    {
                      functionCall: {
                        name: 'getWeather',
                        args: { location: 'London' },
                      },
                    },
                  ],
                },
                finishReason: 'STOP',
              },
            ],
            usageMetadata: {
              promptTokenCount: 15,
              candidatesTokenCount: 25,
            },
          };
        },
      };

      mockClient.generateContentStream.mockResolvedValue(mockStream);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Get weather' }],
        },
      ];

      const result = await model.doStream({
        prompt: messages,
      });

      const streamParts: any[] = [];
      const reader = result.stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamParts.push(value);
      }

      const toolCallPart = streamParts.find((p) => p.type === 'tool-call');
      expect(toolCallPart).toBeDefined();
      expect(toolCallPart.toolName).toBe('getWeather');
      expect(toolCallPart.input).toBe('{"location":"London"}');
    });

    it('should handle streaming errors', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [{ text: 'Starting...' }],
                },
              },
            ],
          };
          throw new Error('Stream error');
        },
      };

      mockClient.generateContentStream.mockResolvedValue(mockStream);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Test' }],
        },
      ];

      const result = await model.doStream({
        prompt: messages,
      });

      const streamParts: any[] = [];
      const reader = result.stream.getReader();

      await expect(async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          streamParts.push(value);
        }
      }).rejects.toThrow();

      // Should have at least stream-start before error
      expect(streamParts[0]).toEqual({ type: 'stream-start', warnings: [] });
    });

    it('should handle empty stream chunks', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [],
                },
              },
            ],
          };
          yield {
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [],
                },
                finishReason: 'STOP',
              },
            ],
            usageMetadata: {
              promptTokenCount: 5,
              candidatesTokenCount: 0,
            },
          };
        },
      };

      mockClient.generateContentStream.mockResolvedValue(mockStream);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Test' }],
        },
      ];

      const result = await model.doStream({
        prompt: messages,
      });

      const streamParts: any[] = [];
      const reader = result.stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamParts.push(value);
      }

      // Should have stream-start, response-metadata, and finish
      expect(streamParts).toHaveLength(3);
      expect(streamParts[0].type).toBe('stream-start');
      expect(streamParts[1].type).toBe('response-metadata');
      expect(streamParts[2].type).toBe('finish');
    });

    it('should handle JSON mode in streaming with native schema', async () => {
      // With native responseJsonSchema, Gemini returns clean JSON directly
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [{ text: '{"name":' }],
                },
              },
            ],
          };
          yield {
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [{ text: ' "John"}' }],
                },
                finishReason: 'STOP',
              },
            ],
            usageMetadata: {
              promptTokenCount: 20,
              candidatesTokenCount: 30,
            },
          };
        },
      };

      mockClient.generateContentStream.mockResolvedValue(mockStream);

      const jsonSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      };

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Generate JSON' }],
        },
      ];

      const result = await model.doStream({
        prompt: messages,
        responseFormat: { type: 'json', schema: jsonSchema },
      });

      const streamParts: any[] = [];
      const reader = result.stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamParts.push(value);
      }

      // Now streaming outputs directly without accumulation
      const textDeltas = streamParts.filter((p) => p.type === 'text-delta');
      expect(textDeltas).toHaveLength(2);
      expect(textDeltas[0].delta).toBe('{"name":');
      expect(textDeltas[1].delta).toBe(' "John"}');

      // Verify responseJsonSchema is passed to Gemini API
      expect(mockClient.generateContentStream).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            responseMimeType: 'application/json',
            responseJsonSchema: jsonSchema,
          }),
        }),
        expect.any(String)
      );
    });

    it('should downgrade JSON mode without schema to text/plain with warning (streaming)', async () => {
      // When JSON is requested without a schema in streaming, should downgrade to text/plain
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [{ text: 'Some plain text' }],
                },
              },
            ],
          };
          yield {
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [{ text: ' response' }],
                },
                finishReason: 'STOP',
              },
            ],
            usageMetadata: {
              promptTokenCount: 20,
              candidatesTokenCount: 30,
            },
          };
        },
      };

      mockClient.generateContentStream.mockResolvedValue(mockStream);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Generate something' }],
        },
      ];

      const result = await model.doStream({
        prompt: messages,
        responseFormat: { type: 'json' }, // No schema provided
      });

      const streamParts: any[] = [];
      const reader = result.stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamParts.push(value);
      }

      // Should emit stream-start with warning
      const streamStart = streamParts.find((p) => p.type === 'stream-start');
      expect(streamStart).toBeDefined();
      expect(streamStart.warnings).toHaveLength(1);
      expect(streamStart.warnings[0].type).toBe('unsupported-setting');
      expect(streamStart.warnings[0].setting).toBe('responseFormat');
      expect(streamStart.warnings[0].details).toContain('without a schema');

      // Text should pass through unchanged
      const textDeltas = streamParts.filter((p) => p.type === 'text-delta');
      expect(textDeltas).toHaveLength(2);
      expect(textDeltas[0].delta).toBe('Some plain text');
      expect(textDeltas[1].delta).toBe(' response');

      // Should use text/plain, not application/json
      expect(mockClient.generateContentStream).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            responseMimeType: 'text/plain',
          }),
        }),
        expect.any(String)
      );

      // Should NOT include responseJsonSchema
      const callArgs = mockClient.generateContentStream.mock.calls[0][0];
      expect(callArgs.config.responseJsonSchema).toBeUndefined();
    });

    it('should pass toolConfig when toolChoice is provided (streaming)', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [{ text: 'ok' }],
                },
                finishReason: 'STOP',
              },
            ],
            usageMetadata: {
              promptTokenCount: 1,
              candidatesTokenCount: 1,
            },
          };
        },
      };

      mockClient.generateContentStream.mockResolvedValue(mockStream);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Test toolChoice' }],
        },
      ];

      await model.doStream({
        prompt: messages,
        toolChoice: { type: 'tool', toolName: 'getWeather' },
      });

      expect(mockClient.generateContentStream).toHaveBeenCalled();
      const callArg = mockClient.generateContentStream.mock.calls[0][0];
      expect(callArg.config.toolConfig).toBeDefined();
      expect(
        callArg.config.toolConfig.functionCallingConfig.allowedFunctionNames
      ).toEqual(['getWeather']);
      expect(callArg.config.toolConfig.functionCallingConfig.mode).toBe(
        FunctionCallingConfigMode.ANY
      );
    });
  });

  describe('supportsStructuredOutputs', () => {
    it('should return true for gemini models with native schema support', () => {
      expect(model.supportsStructuredOutputs).toBe(true);
    });
  });

  describe('provider property', () => {
    it('should return correct provider name', () => {
      expect(model.provider).toBe('gemini-cli-core');
    });
  });

  describe('lazy initialization', () => {
    it('should initialize client only once', async () => {
      // Setup mock response for both calls
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Test response' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 10,
        },
      };

      mockClient.generateContent.mockResolvedValue(mockResponse);

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Test' }],
        },
      ];

      // First call
      await model.doGenerate({ prompt: messages });

      // Second call
      await model.doGenerate({ prompt: messages });

      // Client should only be initialized once
      expect(initializeGeminiClient).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      vi.mocked(initializeGeminiClient).mockRejectedValue(
        new Error('Failed to initialize')
      );

      const messages: LanguageModelV2CallOptions['prompt'] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Test' }],
        },
      ];

      await expect(model.doGenerate({ prompt: messages })).rejects.toThrow(
        'Failed to initialize Gemini model'
      );
    });
  });

  describe('abort signal handling', () => {
    it('should handle abort signal in doGenerate', async () => {
      const model = new GeminiLanguageModel({
        modelId: 'gemini-2.5-pro',
        providerOptions: { authType: 'gemini-api-key', apiKey: 'test-key' },
      });

      const abortController = new AbortController();

      // Abort immediately
      abortController.abort();

      await expect(
        model.doGenerate({
          prompt: [
            { role: 'user', content: [{ type: 'text', text: 'Hello' }] },
          ],
          abortSignal: abortController.signal,
        })
      ).rejects.toThrow('Request aborted');
    });

    it('should handle abort signal in doStream', async () => {
      const model = new GeminiLanguageModel({
        modelId: 'gemini-2.5-pro',
        providerOptions: { authType: 'gemini-api-key', apiKey: 'test-key' },
      });

      const abortController = new AbortController();

      // Abort immediately
      abortController.abort();

      await expect(
        model.doStream({
          prompt: [
            { role: 'user', content: [{ type: 'text', text: 'Hello' }] },
          ],
          abortSignal: abortController.signal,
        })
      ).rejects.toThrow('Request aborted');
    });
  });
});
