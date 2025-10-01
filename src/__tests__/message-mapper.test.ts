import { describe, it, expect } from 'vitest';
import { mapPromptToGeminiFormat } from '../message-mapper';
import type { LanguageModelV2CallOptions } from '@ai-sdk/provider';
import { z } from 'zod';

describe('mapPromptToGeminiFormat', () => {
  describe('basic message mapping', () => {
    it('should map a simple user message', () => {
      const options: LanguageModelV2CallOptions = {
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
      const options: LanguageModelV2CallOptions = {
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
      const options: LanguageModelV2CallOptions = {
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
      const options: LanguageModelV2CallOptions = {
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
      const options: LanguageModelV2CallOptions = {
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
      const options: LanguageModelV2CallOptions = {
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
      const options: LanguageModelV2CallOptions = {
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

    it('should throw error for URL images', () => {
      const options: LanguageModelV2CallOptions = {
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
        'URL images are not supported by Gemini CLI Core'
      );
    });

    it('should throw error for unsupported image format', () => {
      const options: LanguageModelV2CallOptions = {
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
        'Unsupported image format'
      );
    });
  });

  describe('tool calling', () => {
    it('should map assistant message with tool calls', () => {
      const options: LanguageModelV2CallOptions = {
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
      const options: LanguageModelV2CallOptions = {
        prompt: [
          {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: '123',
                toolName: 'getWeather',
                output: { temperature: 72, condition: 'sunny' },
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
      const options: LanguageModelV2CallOptions = {
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
  });

  describe('json response format', () => {
    it('should append schema to last user message in json response format', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const options: LanguageModelV2CallOptions = {
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
      const userMessage = result.contents[0];
      expect(userMessage.parts[0].text).toContain('Generate a person object');
      expect(userMessage.parts[0].text).toContain(
        'You must respond with a JSON object'
      );
      expect(userMessage.parts[0].text).toContain('matches this schema');
    });

    it('should only modify last user message', () => {
      const schema = z.object({ result: z.string() });

      const options: LanguageModelV2CallOptions = {
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
      // First user message should be unchanged
      expect(result.contents[0].parts[0].text).toBe('First question');
      // Last user message should have schema appended
      expect(result.contents[2].parts[0].text).toContain('Second question');
      expect(result.contents[2].parts[0].text).toContain('JSON object');
    });

    it('should handle multipart user messages in json response format', () => {
      const schema = z.object({ description: z.string() });

      const options: LanguageModelV2CallOptions = {
        responseFormat: { type: 'json', schema },
        prompt: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this:' },
              { type: 'file', data: 'base64data', mediaType: 'image/jpeg' },
              { type: 'text', text: 'in JSON format' },
            ],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      // Should append to the last text part
      expect(result.contents[0].parts[0].text).toBe('Describe this:');
      expect(result.contents[0].parts[2].text).toContain('in JSON format');
      expect(result.contents[0].parts[2].text).toContain('JSON object');
    });

    it('should not modify non-user last messages', () => {
      const schema = z.object({ result: z.string() });

      const options: LanguageModelV2CallOptions = {
        responseFormat: { type: 'json', schema },
        prompt: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Question' }],
          },
          {
            role: 'assistant',
            content: [{ type: 'text', text: 'Answer' }],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      // User message should be unchanged since it's not the last message
      expect(result.contents[0].parts[0].text).toBe('Question');
      expect(result.contents[1].parts[0].text).toBe('Answer');
    });

    it('should handle json response format without schema', () => {
      const options: LanguageModelV2CallOptions = {
        responseFormat: { type: 'json' },
        prompt: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Generate JSON' }],
          },
        ],
      };

      const result = mapPromptToGeminiFormat(options);

      // Should not modify message when no schema is provided
      expect(result.contents[0].parts[0].text).toBe('Generate JSON');
    });

    it('should handle empty prompt in json response format', () => {
      const schema = z.object({ test: z.string() });

      const options: LanguageModelV2CallOptions = {
        responseFormat: { type: 'json', schema },
        prompt: [],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty prompt', () => {
      const options: LanguageModelV2CallOptions = {
        prompt: [],
      };

      const result = mapPromptToGeminiFormat(options);

      expect(result.contents).toHaveLength(0);
      expect(result.systemInstruction).toBeUndefined();
    });

    it('should handle multiple system messages', () => {
      const options: LanguageModelV2CallOptions = {
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
      const options: LanguageModelV2CallOptions = {
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
