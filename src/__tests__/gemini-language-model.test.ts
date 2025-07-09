import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import type {
  LanguageModelV1FunctionTool,
  LanguageModelV1Prompt,
} from '@ai-sdk/provider';
import { GeminiLanguageModel } from '../gemini-language-model';
import type { GeminiProviderOptions } from '../types';
import type { ContentGenerator } from '@google/gemini-cli-core';

// Mock the dependencies
vi.mock('../client', () => ({
  initializeGeminiClient: vi.fn(),
}));

vi.mock('../message-mapper', () => ({
  mapPromptToGeminiFormat: vi.fn(() => ({
    contents: [{ parts: [{ text: 'mocked' }], role: 'user' }],
    systemInstruction: undefined,
  })),
}));

vi.mock('../tool-mapper', () => ({
  mapToolsToGeminiFormat: vi.fn(),
}));

vi.mock('../error', () => ({
  mapGeminiError: vi.fn((error) => error),
}));

vi.mock('../extract-json', () => ({
  extractJson: vi.fn(() => '{"name": "John", "age": 30}'),
}));

// Import mocked modules
import { initializeGeminiClient } from '../client';
import { mapPromptToGeminiFormat } from '../message-mapper';
import { mapToolsToGeminiFormat } from '../tool-mapper';
import { mapGeminiError } from '../error';
import { extractJson } from '../extract-json';

describe('GeminiLanguageModel', () => {
  let mockClient: ContentGenerator;
  let model: GeminiLanguageModel;
  const defaultOptions: GeminiProviderOptions = {
    authType: 'oauth-personal',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock client
    mockClient = {
      generateContent: vi.fn(),
      generateContentStream: vi.fn(),
    } as unknown as ContentGenerator;

    vi.mocked(initializeGeminiClient).mockResolvedValue(mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default model configuration', async () => {
      model = new GeminiLanguageModel({
        modelId: 'gemini-2.5-pro',
        providerOptions: defaultOptions,
      });

      expect(model.provider).toBe('gemini-cli-core');
      expect(model.modelId).toBe('gemini-2.5-pro');
      expect(model.defaultObjectGenerationMode).toBe('json');
    });

    it('should initialize with custom settings', async () => {
      model = new GeminiLanguageModel({
        modelId: 'gemini-2.5-flash',
        providerOptions: defaultOptions,
        settings: {
          temperature: 0.5,
          topP: 0.9,
        },
      });

      expect(model.provider).toBe('gemini-cli-core');
      expect(model.modelId).toBe('gemini-2.5-flash');
    });
  });

  describe('doGenerate', () => {
    beforeEach(async () => {
      model = new GeminiLanguageModel({
        modelId: 'gemini-2.5-pro',
        providerOptions: defaultOptions,
      });

      // Manually set the contentGenerator for tests
      model['contentGenerator'] = mockClient;
      model['config'] = { model: 'gemini-2.5-pro' } as any;
    });

    it('should generate text successfully', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Hello, world!' }],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 20,
          totalTokenCount: 30,
        },
      };

      vi.mocked(mockClient.generateContent).mockResolvedValue(mockResponse);
      vi.mocked(mapPromptToGeminiFormat).mockReturnValue({
        contents: [{ parts: [{ text: 'Say hello' }], role: 'user' }],
        systemInstruction: undefined,
      });

      const prompt: LanguageModelV1Prompt = [
        { role: 'user', content: [{ type: 'text', text: 'Say hello' }] },
      ];

      const result = await model.doGenerate({
        inputFormat: 'prompt',
        mode: { type: 'regular' },
        prompt,
      });

      expect(result.text).toBe('Hello, world!');
      expect(result.finishReason).toBe('stop');
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
      });
    });

    it('should handle tool calls', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: 'weather',
                    args: { location: 'New York' },
                  },
                },
              ],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 15,
          candidatesTokenCount: 25,
          totalTokenCount: 40,
        },
      };

      vi.mocked(mockClient.generateContent).mockResolvedValue(mockResponse);
      vi.mocked(mapPromptToGeminiFormat).mockReturnValue({
        contents: [{ parts: [{ text: 'What is the weather?' }], role: 'user' }],
        systemInstruction: undefined,
      });
      vi.mocked(mapToolsToGeminiFormat).mockReturnValue([
        {
          functionDeclarations: [
            {
              name: 'weather',
              description: 'Get weather information',
              parameters: {
                type: 'object',
                properties: {
                  location: { type: 'string' },
                },
              },
            },
          ],
        },
      ]);

      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'weather',
          description: 'Get weather information',
          parameters: z.object({
            location: z.string(),
          }),
        },
      ];

      const result = await model.doGenerate({
        inputFormat: 'prompt',
        mode: { type: 'regular', tools },
        prompt: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'What is the weather?' }],
          },
        ],
      });

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0]).toEqual({
        toolCallType: 'function',
        toolCallId: expect.any(String),
        toolName: 'weather',
        args: '{"location":"New York"}',
      });
    });

    it('should handle JSON mode', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: '```json\n{"name": "John", "age": 30}\n```' }],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
      };

      vi.mocked(mockClient.generateContent).mockResolvedValue(mockResponse);

      const result = await model.doGenerate({
        inputFormat: 'prompt',
        mode: { type: 'object-json' },
        prompt: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Generate a person object' }],
          },
        ],
      });

      // Debug: The extractJson mock is being called but result.text has the wrong value
      // This suggests the mock isn't working as expected
      expect(extractJson).toHaveBeenCalled();
      expect(result.text).toBe('{"name": "John", "age": 30}');
    });

    it('should handle errors', async () => {
      const error = new Error('API Error');
      vi.mocked(mockClient.generateContent).mockRejectedValue(error);
      vi.mocked(mapGeminiError).mockReturnValue(error);

      await expect(
        model.doGenerate({
          inputFormat: 'prompt',
          mode: { type: 'regular' },
          prompt: [
            { role: 'user', content: [{ type: 'text', text: 'Hello' }] },
          ],
        })
      ).rejects.toThrow('API Error');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        candidates: [],
      };

      vi.mocked(mockClient.generateContent).mockResolvedValue(mockResponse);

      const result = await model.doGenerate({
        inputFormat: 'prompt',
        mode: { type: 'regular' },
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      });

      expect(result.text).toBe('');
      expect(result.finishReason).toBe('unknown');
    });

    it('should handle multi-modal input', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'I see a cat in the image' }],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
      };

      vi.mocked(mockClient.generateContent).mockResolvedValue(mockResponse);
      vi.mocked(mapPromptToGeminiFormat).mockReturnValue({
        contents: [
          {
            parts: [
              { text: 'What is in this image?' },
              { inlineData: { mimeType: 'image/png', data: 'base64data' } },
            ],
            role: 'user',
          },
        ],
        systemInstruction: undefined,
      });

      const prompt: LanguageModelV1Prompt = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is in this image?' },
            { type: 'image', image: 'base64data', mimeType: 'image/png' },
          ],
        },
      ];

      const result = await model.doGenerate({
        inputFormat: 'prompt',
        mode: { type: 'regular' },
        prompt,
      });

      expect(result.text).toBe('I see a cat in the image');
    });

    it('should handle system messages', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'I am a helpful assistant!' }],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
      };

      vi.mocked(mockClient.generateContent).mockResolvedValue(mockResponse);
      vi.mocked(mapPromptToGeminiFormat).mockReturnValue({
        contents: [{ parts: [{ text: 'Who are you?' }], role: 'user' }],
        systemInstruction: { parts: [{ text: 'You are a helpful assistant' }] },
      });

      const prompt: LanguageModelV1Prompt = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: [{ type: 'text', text: 'Who are you?' }] },
      ];

      const result = await model.doGenerate({
        inputFormat: 'prompt',
        mode: { type: 'regular' },
        prompt,
      });

      expect(result.text).toBe('I am a helpful assistant!');
      expect(mapPromptToGeminiFormat).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt,
        })
      );
    });

    it('should respect temperature settings', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Response with temperature' }],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
      };

      vi.mocked(mockClient.generateContent).mockResolvedValue(mockResponse);

      await model.doGenerate({
        inputFormat: 'prompt',
        mode: { type: 'regular' },
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 1000,
      });

      expect(mockClient.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1000,
          }),
        })
      );
    });

    it('should handle content filter finish reason', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Filtered response' }],
              role: 'model',
            },
            finishReason: 'SAFETY',
          },
        ],
      };

      vi.mocked(mockClient.generateContent).mockResolvedValue(mockResponse);

      const result = await model.doGenerate({
        inputFormat: 'prompt',
        mode: { type: 'regular' },
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      });

      expect(result.finishReason).toBe('content-filter');
    });

    it('should handle max tokens finish reason', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Truncated response...' }],
              role: 'model',
            },
            finishReason: 'MAX_TOKENS',
          },
        ],
      };

      vi.mocked(mockClient.generateContent).mockResolvedValue(mockResponse);

      const result = await model.doGenerate({
        inputFormat: 'prompt',
        mode: { type: 'regular' },
        prompt: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Tell me a long story' }],
          },
        ],
      });

      expect(result.finishReason).toBe('length');
    });
  });

  describe('doStream', () => {
    beforeEach(async () => {
      model = new GeminiLanguageModel({
        modelId: 'gemini-2.5-pro',
        providerOptions: defaultOptions,
      });

      // Manually set the contentGenerator for tests
      model['contentGenerator'] = mockClient;
      model['config'] = { model: 'gemini-2.5-pro' } as any;
    });

    it('should stream text successfully', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [
              {
                content: {
                  parts: [{ text: 'Hello' }],
                  role: 'model',
                },
              },
            ],
            usageMetadata: {
              promptTokenCount: 5,
              candidatesTokenCount: 5,
              totalTokenCount: 10,
            },
          };
          yield {
            candidates: [
              {
                content: {
                  parts: [{ text: ', world!' }],
                  role: 'model',
                },
                finishReason: 'STOP',
              },
            ],
            usageMetadata: {
              promptTokenCount: 5,
              candidatesTokenCount: 10,
              totalTokenCount: 15,
            },
          };
        },
      };

      vi.mocked(mockClient.generateContentStream).mockResolvedValue(
        mockStream as any
      );

      const result = await model.doStream({
        inputFormat: 'prompt',
        mode: { type: 'regular' },
        prompt: [
          { role: 'user', content: [{ type: 'text', text: 'Say hello' }] },
        ],
      });

      const parts = [];
      for await (const part of result.stream) {
        parts.push(part);
      }

      expect(parts).toHaveLength(3);
      expect(parts[0]).toEqual({
        type: 'text-delta',
        textDelta: 'Hello',
      });
      expect(parts[1]).toEqual({
        type: 'text-delta',
        textDelta: ', world!',
      });
      expect(parts[2]).toEqual({
        type: 'finish',
        finishReason: 'stop',
        usage: {
          promptTokens: 5,
          completionTokens: 10,
        },
      });
    });

    it('should stream tool calls', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      functionCall: {
                        name: 'calculator',
                        args: { a: 5, b: 3 },
                      },
                    },
                  ],
                  role: 'model',
                },
                finishReason: 'STOP',
              },
            ],
          };
        },
      };

      vi.mocked(mockClient.generateContentStream).mockResolvedValue(
        mockStream as any
      );
      vi.mocked(mapToolsToGeminiFormat).mockReturnValue([
        {
          functionDeclarations: [
            {
              name: 'calculator',
              description: 'Perform calculations',
              parameters: {
                type: 'object',
                properties: {
                  a: { type: 'number' },
                  b: { type: 'number' },
                },
              },
            },
          ],
        },
      ]);

      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'calculator',
          description: 'Perform calculations',
          parameters: z.object({
            a: z.number(),
            b: z.number(),
          }),
        },
      ];

      const result = await model.doStream({
        inputFormat: 'prompt',
        mode: { type: 'regular', tools },
        prompt: [
          { role: 'user', content: [{ type: 'text', text: 'Add 5 and 3' }] },
        ],
      });

      const parts = [];
      for await (const part of result.stream) {
        parts.push(part);
      }

      expect(parts).toContainEqual({
        type: 'tool-call',
        toolCallType: 'function',
        toolCallId: expect.any(String),
        toolName: 'calculator',
        args: '{"a":5,"b":3}',
      });
    });

    it('should handle streaming errors', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [
              {
                content: {
                  parts: [{ text: 'Starting...' }],
                  role: 'model',
                },
              },
            ],
          };
          throw new Error('Stream error');
        },
      };

      vi.mocked(mockClient.generateContentStream).mockResolvedValue(
        mockStream as any
      );
      vi.mocked(mapGeminiError).mockImplementation((err) => err);

      const result = await model.doStream({
        inputFormat: 'prompt',
        mode: { type: 'regular' },
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      });

      const parts = [];
      await expect(async () => {
        for await (const part of result.stream) {
          parts.push(part);
        }
      }).rejects.toThrow('Stream error');

      expect(parts).toHaveLength(1);
      expect(parts[0]).toEqual({
        type: 'text-delta',
        textDelta: 'Starting...',
      });
    });

    it('should handle empty stream chunks', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [],
          };
          yield {
            candidates: [
              {
                content: {
                  parts: [{ text: 'Hello' }],
                  role: 'model',
                },
                finishReason: 'STOP',
              },
            ],
          };
        },
      };

      vi.mocked(mockClient.generateContentStream).mockResolvedValue(
        mockStream as any
      );

      const result = await model.doStream({
        inputFormat: 'prompt',
        mode: { type: 'regular' },
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      });

      const parts = [];
      for await (const part of result.stream) {
        parts.push(part);
      }

      expect(parts).toHaveLength(2);
      expect(parts[0]).toEqual({
        type: 'text-delta',
        textDelta: 'Hello',
      });
    });

    it('should handle JSON mode in streaming', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [
              {
                content: {
                  parts: [{ text: '```json\n{' }],
                  role: 'model',
                },
              },
            ],
          };
          yield {
            candidates: [
              {
                content: {
                  parts: [{ text: '"name": "John"}\n```' }],
                  role: 'model',
                },
                finishReason: 'STOP',
              },
            ],
          };
        },
      };

      vi.mocked(mockClient.generateContentStream).mockResolvedValue(
        mockStream as any
      );

      const result = await model.doStream({
        inputFormat: 'prompt',
        mode: { type: 'object-json' },
        prompt: [
          { role: 'user', content: [{ type: 'text', text: 'Generate JSON' }] },
        ],
      });

      const parts = [];
      for await (const part of result.stream) {
        parts.push(part);
      }

      // In object-json mode, text is accumulated and only emitted when finish reason is received
      // We get the extracted JSON and a finish event, but there might be other parts
      expect(parts.length).toBeGreaterThanOrEqual(2);

      // Find the extracted JSON part
      const jsonPart = parts.find(
        (p) =>
          p.type === 'text-delta' &&
          p.textDelta === '{"name": "John", "age": 30}'
      );
      expect(jsonPart).toBeDefined();

      // Ensure we have a finish event
      const finishPart = parts.find((p) => p.type === 'finish');
      expect(finishPart).toBeDefined();
      expect(finishPart.finishReason).toBe('stop');
    });
  });

  describe('supportsStructuredOutputs', () => {
    it('should return true for gemini models', () => {
      model = new GeminiLanguageModel({
        modelId: 'gemini-2.5-pro',
        providerOptions: defaultOptions,
      });

      expect(model.supportsStructuredOutputs).toBe(true);
    });
  });

  describe('ensureInitialized', () => {
    it('should initialize client only once', async () => {
      model = new GeminiLanguageModel({
        modelId: 'gemini-2.5-pro',
        providerOptions: defaultOptions,
      });

      await model['ensureInitialized']();
      await model['ensureInitialized']();
      await model['ensureInitialized']();

      expect(initializeGeminiClient).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      vi.mocked(initializeGeminiClient).mockRejectedValue(
        new Error('Init failed')
      );

      model = new GeminiLanguageModel({
        modelId: 'gemini-2.5-pro',
        providerOptions: defaultOptions,
      });

      await expect(model['ensureInitialized']()).rejects.toThrow('Init failed');
    });
  });
});
