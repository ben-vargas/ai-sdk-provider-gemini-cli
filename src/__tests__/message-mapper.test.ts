import { describe, it, expect } from 'vitest';
import { mapPromptToGeminiFormat } from '../message-mapper';
import type { LanguageModelV3CallOptions } from '@ai-sdk/provider';

describe('mapPromptToGeminiFormat', () => {
  describe('basic message mapping', () => {
    it('should map a simple user message', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Hello, world!' }],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toEqual({
        role: 'user',
        parts: [{ text: 'Hello, world!' }],
      });
      expect(result.systemInstruction).toBeUndefined();
    });

    it('should map a simple assistant message', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'assistant',
            content: [{ type: 'text', text: 'Hi there!' }],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toEqual({
        role: 'model',
        parts: [{ text: 'Hi there!' }],
      });
    });

    it('should handle system messages separately', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'system',
            content: 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: [{ type: 'text', text: 'Hello!' }],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toEqual({
        role: 'user',
        parts: [{ text: 'Hello!' }],
      });
      expect(result.systemInstruction).toEqual({
        role: 'user',
        parts: [{ text: 'You are a helpful assistant.' }],
      });
    });

    it('should handle conversation with multiple messages', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'What is 2 + 2?' }],
          },
          {
            role: 'assistant',
            content: [{ type: 'text', text: '2 + 2 equals 4.' }],
          },
          {
            role: 'user',
            content: [{ type: 'text', text: 'What about 3 + 3?' }],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(3);
      expect(result.contents[0].role).toBe('user');
      expect(result.contents[1].role).toBe('model');
      expect(result.contents[2].role).toBe('user');
    });
  });

  describe('multimodal content', () => {
    it('should map user message with text and base64 image', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What is in this image?' },
              {
                type: 'file',
                data: 'base64encodeddata',
                mediaType: 'image/png',
              },
            ],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toEqual({
        role: 'user',
        parts: [
          { text: 'What is in this image?' },
          {
            inlineData: {
              mimeType: 'image/png',
              data: 'base64encodeddata',
            },
          },
        ],
      });
    });

    it('should map user message with Uint8Array image', () => {
      const imageData = new Uint8Array([1, 2, 3, 4]);
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this image' },
              {
                type: 'file',
                data: imageData,
                mediaType: 'image/jpeg',
              },
            ],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents[0].parts[1]).toEqual({
        inlineData: {
          mimeType: 'image/jpeg',
          data: Buffer.from(imageData).toString('base64'),
        },
      });
    });

    it('should handle images with explicit content type', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [
              {
                type: 'file',
                data: 'base64data',
                mediaType: 'image/jpeg',
              },
            ],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents[0].parts[0]).toEqual({
        inlineData: {
          mimeType: 'image/jpeg',
          data: 'base64data',
        },
      });
    });

    it('should map user message with PDF file', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this document' },
              {
                type: 'file',
                data: 'base64pdfdata',
                mediaType: 'application/pdf',
              },
            ],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents[0].parts[1]).toEqual({
        inlineData: {
          mimeType: 'application/pdf',
          data: 'base64pdfdata',
        },
      });
    });

    it('should map user message with audio file', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Transcribe this audio' },
              {
                type: 'file',
                data: 'base64audiodata',
                mediaType: 'audio/mp3',
              },
            ],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents[0].parts[1]).toEqual({
        inlineData: {
          mimeType: 'audio/mp3',
          data: 'base64audiodata',
        },
      });
    });

    it('should map user message with video file', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this video' },
              {
                type: 'file',
                data: 'base64videodata',
                mediaType: 'video/mp4',
              },
            ],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents[0].parts[1]).toEqual({
        inlineData: {
          mimeType: 'video/mp4',
          data: 'base64videodata',
        },
      });
    });

    it('should throw error for URL files', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [
              {
                type: 'file',
                data: new URL('https://example.com/image.jpg'),
                mediaType: 'image/jpeg',
              },
            ],
          },
        ],
      };

      expect(() => mapPromptToGeminiFormat(options)).toThrow(
        'URL files are not supported by Gemini CLI Core'
      );
    });

    it('should throw error for unsupported file format', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [
              {
                type: 'file',
                data: { invalid: 'format' } as any,
                mediaType: 'image/jpeg',
              },
            ],
          },
        ],
      };

      expect(() => mapPromptToGeminiFormat(options)).toThrow(
        'Unsupported file format'
      );
    });
  });

  describe('tool calling', () => {
    it('should map assistant message with tool calls', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'assistant',
            content: [
              { type: 'text', text: 'Let me check the weather for you.' },
              {
                type: 'tool-call',
                toolCallId: '123',
                toolName: 'getWeather',
                input: { location: 'New York' },
              },
            ],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toEqual({
        role: 'model',
        parts: [
          { text: 'Let me check the weather for you.' },
          {
            functionCall: {
              name: 'getWeather',
              args: { location: 'New York' },
            },
          },
        ],
      });
    });

    it('should map tool result messages', () => {
      // v6 uses typed output union - using 'json' type here
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: '123',
                toolName: 'getWeather',
                output: {
                  type: 'json',
                  value: { temperature: 72, condition: 'sunny' },
                },
              },
            ],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toEqual({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: 'getWeather',
              response: { temperature: 72, condition: 'sunny' },
            },
          },
        ],
      });
    });

    it('should handle empty args in tool calls', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'assistant',
            content: [
              {
                type: 'tool-call',
                toolCallId: '123',
                toolName: 'getCurrentTime',
                // No input
              },
            ],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents[0].parts[0]).toEqual({
        functionCall: {
          name: 'getCurrentTime',
          args: {},
        },
      });
    });

    it('should preserve thoughtSignature from providerOptions in tool calls', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'assistant',
            content: [
              {
                type: 'tool-call',
                toolCallId: '123',
                toolName: 'getWeather',
                input: { location: 'New York' },
                providerOptions: {
                  'gemini-cli': {
                    thoughtSignature: 'test-signature-abc123',
                  },
                },
              } as any,
            ],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents[0].parts[0]).toEqual({
        functionCall: {
          name: 'getWeather',
          args: { location: 'New York' },
        },
        thoughtSignature: 'test-signature-abc123',
      });
    });

    it('should not include thoughtSignature when not present in providerOptions', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'assistant',
            content: [
              {
                type: 'tool-call',
                toolCallId: '123',
                toolName: 'getWeather',
                input: { location: 'London' },
              },
            ],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      const part = result.contents[0].parts[0] as any;
      expect(part.functionCall).toEqual({
        name: 'getWeather',
        args: { location: 'London' },
      });
      expect(part.thoughtSignature).toBeUndefined();
    });
  });

  describe('json response format (native schema support)', () => {
    // Note: Schema injection has been removed - schema is now passed via responseJsonSchema
    // in the generation config. These tests verify messages are passed through unchanged.

    it('should not modify messages when json response format with schema', () => {
      // Schema is now a JSON Schema object (the AI SDK converts Zod to JSON Schema before calling provider)
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      };

      const options: LanguageModelV3CallOptions = {
        responseFormat: { type: 'json', schema },
        prompt: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Generate a person object' }],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(1);
      // Message should be unchanged - no schema injection
      expect(result.contents[0].parts[0].text).toBe('Generate a person object');
    });

    it('should pass through all messages unchanged with json response format', () => {
      const schema = {
        type: 'object',
        properties: { result: { type: 'string' } },
        required: ['result'],
      };

      const options: LanguageModelV3CallOptions = {
        responseFormat: { type: 'json', schema },
        prompt: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'First question' }],
          },
          {
            role: 'assistant',
            content: [{ type: 'text', text: 'First answer' }],
          },
          {
            role: 'user',
            content: [{ type: 'text', text: 'Second question' }],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(3);
      expect(result.contents[0].parts[0].text).toBe('First question');
      expect(result.contents[1].parts[0].text).toBe('First answer');
      expect(result.contents[2].parts[0].text).toBe('Second question');
    });

    it('should handle json response format without schema', () => {
      const options: LanguageModelV3CallOptions = {
        responseFormat: { type: 'json' },
        prompt: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Generate JSON' }],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents[0].parts[0].text).toBe('Generate JSON');
    });

    it('should handle empty prompt in json response format', () => {
      const schema = {
        type: 'object',
        properties: { test: { type: 'string' } },
      };

      const options: LanguageModelV3CallOptions = {
        responseFormat: { type: 'json', schema },
        prompt: [],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty prompt', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(0);
      expect(result.systemInstruction).toBeUndefined();
    });

    it('should handle multiple system messages', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'system',
            content: 'First system message.',
          },
          {
            role: 'system',
            content: 'Second system message.',
          },
          {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      // Only the last system message should be used
      expect(result.systemInstruction).toEqual({
        role: 'user',
        parts: [{ text: 'Second system message.' }],
      });
      expect(result.contents).toHaveLength(1);
    });

    it('should handle messages with empty content arrays', () => {
      const options: LanguageModelV3CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [],
          },
          {
            role: 'assistant',
            content: [],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(2);
      expect(result.contents[0]).toEqual({
        role: 'user',
        parts: [],
      });
      expect(result.contents[1]).toEqual({
        role: 'model',
        parts: [],
      });
    });
  });
});
