import { describe, it, expect } from 'vitest';
import { mapGeminiToolConfig, mapToolsToGeminiFormat } from '../tool-mapper';
import type {
  LanguageModelV1CallOptions,
  LanguageModelV1FunctionTool,
} from '@ai-sdk/provider';
import { FunctionCallingConfigMode } from '@google/genai';
import { z } from 'zod';

describe('mapToolsToGeminiFormat', () => {
  describe('basic tool mapping', () => {
    it('should map a simple tool with Zod schema', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'getWeather',
          description: 'Get the weather for a location',
          parameters: z.object({
            location: z.string().describe('The location to get weather for'),
            unit: z.enum(['celsius', 'fahrenheit']).optional(),
          }),
        },
      ];

      const result = mapToolsToGeminiFormat(tools);

      expect(result).toHaveLength(1);
      expect(result[0].functionDeclarations).toHaveLength(1);
      expect(result[0].functionDeclarations[0]).toEqual({
        name: 'getWeather',
        description: 'Get the weather for a location',
        parameters: expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            location: expect.objectContaining({
              type: 'string',
              description: 'The location to get weather for',
            }),
            unit: expect.objectContaining({
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
            }),
          }),
        }),
      });
    });

    it('should map multiple tools', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'getWeather',
          description: 'Get weather',
          parameters: z.object({ location: z.string() }),
        },
        {
          type: 'function',
          name: 'getTime',
          description: 'Get current time',
          parameters: z.object({ timezone: z.string() }),
        },
      ];

      const result = mapToolsToGeminiFormat(tools);

      expect(result).toHaveLength(1);
      expect(result[0].functionDeclarations).toHaveLength(2);
      expect(result[0].functionDeclarations[0].name).toBe('getWeather');
      expect(result[0].functionDeclarations[1].name).toBe('getTime');
    });

    it('should handle empty tools array', () => {
      const tools: LanguageModelV1FunctionTool[] = [];
      const result = mapToolsToGeminiFormat(tools);

      expect(result).toHaveLength(1);
      expect(result[0].functionDeclarations).toHaveLength(0);
    });
  });

  describe('JSON schema parameters', () => {
    it('should map tool with JSON schema parameters', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'createUser',
          description: 'Create a new user',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
              email: { type: 'string', format: 'email' },
            },
            required: ['name', 'email'],
          },
        },
      ];

      const result = mapToolsToGeminiFormat(tools);

      expect(result[0].functionDeclarations[0].parameters).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          email: { type: 'string', format: 'email' },
        },
        required: ['name', 'email'],
      });
    });

    it('should clean $schema from JSON schema', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          parameters: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            properties: {
              value: { type: 'string' },
            },
          },
        },
      ];

      const result = mapToolsToGeminiFormat(tools);
      const params = result[0].functionDeclarations[0].parameters as any;

      expect(params.$schema).toBeUndefined();
      expect(params.type).toBe('object');
      expect(params.properties).toBeDefined();
    });

    it('should clean $ref, $defs, and definitions', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          parameters: {
            $ref: '#/definitions/User',
            $defs: { User: { type: 'object' } },
            definitions: { User: { type: 'object' } },
            type: 'object',
            properties: {
              user: { type: 'string' },
            },
          },
        },
      ];

      const result = mapToolsToGeminiFormat(tools);
      const params = result[0].functionDeclarations[0].parameters as any;

      expect(params.$ref).toBeUndefined();
      expect(params.$defs).toBeUndefined();
      expect(params.definitions).toBeUndefined();
      expect(params.type).toBe('object');
    });

    it('should clean nested properties', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          parameters: {
            type: 'object',
            properties: {
              nested: {
                $schema: 'should-be-removed',
                type: 'object',
                properties: {
                  value: {
                    $ref: 'should-also-be-removed',
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      ];

      const result = mapToolsToGeminiFormat(tools);
      const params = result[0].functionDeclarations[0].parameters as any;

      expect(params.properties.nested.$schema).toBeUndefined();
      expect(params.properties.nested.properties.value.$ref).toBeUndefined();
      expect(params.properties.nested.type).toBe('object');
    });

    it('should clean array items', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          parameters: {
            type: 'array',
            items: {
              $schema: 'should-be-removed',
              type: 'string',
            },
          },
        },
      ];

      const result = mapToolsToGeminiFormat(tools);
      const params = result[0].functionDeclarations[0].parameters as any;

      expect(params.items.$schema).toBeUndefined();
      expect(params.items.type).toBe('string');
    });

    it('should clean additionalProperties', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          parameters: {
            type: 'object',
            additionalProperties: {
              $schema: 'should-be-removed',
              type: 'string',
            },
          },
        },
      ];

      const result = mapToolsToGeminiFormat(tools);
      const params = result[0].functionDeclarations[0].parameters as any;

      expect(params.additionalProperties.$schema).toBeUndefined();
      expect(params.additionalProperties.type).toBe('string');
    });

    it('should clean allOf, anyOf, oneOf arrays', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          parameters: {
            type: 'object',
            allOf: [
              { $schema: 'remove1', type: 'string' },
              { $schema: 'remove2', type: 'number' },
            ],
            anyOf: [
              { $ref: 'remove3', type: 'boolean' },
              { $ref: 'remove4', type: 'null' },
            ],
            oneOf: [
              { $defs: { test: 'remove5' }, type: 'array' },
              { definitions: { test: 'remove6' }, type: 'object' },
            ],
          },
        },
      ];

      const result = mapToolsToGeminiFormat(tools);
      const params = result[0].functionDeclarations[0].parameters as any;

      // Check allOf
      expect(params.allOf[0].$schema).toBeUndefined();
      expect(params.allOf[0].type).toBe('string');
      expect(params.allOf[1].$schema).toBeUndefined();
      expect(params.allOf[1].type).toBe('number');

      // Check anyOf
      expect(params.anyOf[0].$ref).toBeUndefined();
      expect(params.anyOf[0].type).toBe('boolean');
      expect(params.anyOf[1].$ref).toBeUndefined();
      expect(params.anyOf[1].type).toBe('null');

      // Check oneOf
      expect(params.oneOf[0].$defs).toBeUndefined();
      expect(params.oneOf[0].type).toBe('array');
      expect(params.oneOf[1].definitions).toBeUndefined();
      expect(params.oneOf[1].type).toBe('object');
    });
  });

  describe('complex Zod schemas', () => {
    it('should handle nested Zod objects', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'createOrder',
          description: 'Create an order',
          parameters: z.object({
            customer: z.object({
              name: z.string(),
              email: z.string().email(),
              address: z.object({
                street: z.string(),
                city: z.string(),
                zip: z.string(),
              }),
            }),
            items: z.array(
              z.object({
                productId: z.string(),
                quantity: z.number().int().positive(),
              })
            ),
          }),
        },
      ];

      const result = mapToolsToGeminiFormat(tools);
      const params = result[0].functionDeclarations[0].parameters as any;

      expect(params.type).toBe('object');
      expect(params.properties.customer.type).toBe('object');
      expect(params.properties.customer.properties.address.type).toBe('object');
      expect(params.properties.items.type).toBe('array');
      expect(params.properties.items.items.type).toBe('object');
    });

    it('should handle Zod unions', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'processValue',
          description: 'Process a value',
          parameters: z.object({
            value: z.union([z.string(), z.number(), z.boolean()]),
          }),
        },
      ];

      const result = mapToolsToGeminiFormat(tools);
      const params = result[0].functionDeclarations[0].parameters as any;

      // zod-to-json-schema converts unions to type arrays
      expect(params.properties.value.type).toEqual([
        'string',
        'number',
        'boolean',
      ]);
    });

    it('should handle Zod optional fields', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'updateUser',
          description: 'Update user',
          parameters: z.object({
            id: z.string(),
            name: z.string().optional(),
            email: z.string().optional(),
          }),
        },
      ];

      const result = mapToolsToGeminiFormat(tools);
      const params = result[0].functionDeclarations[0].parameters as any;

      expect(params.required).toEqual(['id']);
      expect(params.properties.name).toBeDefined();
      expect(params.properties.email).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle non-schema parameters', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          parameters: 'not-a-schema' as any,
        },
      ];

      const result = mapToolsToGeminiFormat(tools);

      expect(result[0].functionDeclarations[0].parameters).toBe('not-a-schema');
    });

    it('should handle null parameters', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          parameters: null as any,
        },
      ];

      const result = mapToolsToGeminiFormat(tools);

      expect(result[0].functionDeclarations[0].parameters).toBe(null);
    });

    it('should handle undefined parameters', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          parameters: undefined as any,
        },
      ];

      const result = mapToolsToGeminiFormat(tools);

      expect(result[0].functionDeclarations[0].parameters).toBe(undefined);
    });

    it('should handle primitive types in cleanJsonSchema', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          parameters: {
            type: 'object',
            properties: {
              primitiveString: 'string',
              primitiveNumber: 42,
              primitiveBoolean: true,
              primitiveNull: null,
            },
          },
        },
      ];

      const result = mapToolsToGeminiFormat(tools);
      const params = result[0].functionDeclarations[0].parameters as any;

      expect(params.properties.primitiveString).toBe('string');
      expect(params.properties.primitiveNumber).toBe(42);
      expect(params.properties.primitiveBoolean).toBe(true);
      expect(params.properties.primitiveNull).toBe(null);
    });

    it('should handle boolean additionalProperties', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          parameters: {
            type: 'object',
            additionalProperties: true,
          },
        },
      ];

      const result = mapToolsToGeminiFormat(tools);
      const params = result[0].functionDeclarations[0].parameters as any;

      expect(params.additionalProperties).toBe(true);
    });

    it('should handle missing description', () => {
      const tools: LanguageModelV1FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          // No description
          parameters: z.object({ value: z.string() }),
        } as LanguageModelV1FunctionTool,
      ];

      const result = mapToolsToGeminiFormat(tools);

      expect(result[0].functionDeclarations[0].name).toBe('test');
      expect(result[0].functionDeclarations[0].description).toBeUndefined();
    });
  });

  describe('mapGeminiToolConfig', () => {
    it('should return undefined when no toolChoice provided', () => {
      const result = mapGeminiToolConfig({
        mode: { type: 'regular' },
      } as any as LanguageModelV1CallOptions);
      expect(result).toBeUndefined();
    });

    it('should map auto toolChoice to AUTO mode', () => {
      const result = mapGeminiToolConfig({
        mode: { type: 'regular', toolChoice: { type: 'auto' } },
      } as any as LanguageModelV1CallOptions);

      expect(result).toBeDefined();
      expect(result!.functionCallingConfig.mode).toBe(
        FunctionCallingConfigMode.AUTO
      );
      expect(
        result!.functionCallingConfig.allowedFunctionNames
      ).toBeUndefined();
    });

    it('should map none toolChoice to NONE mode', () => {
      const result = mapGeminiToolConfig({
        mode: { type: 'regular', toolChoice: { type: 'none' } },
      } as any as LanguageModelV1CallOptions);

      expect(result).toBeDefined();
      expect(result!.functionCallingConfig.mode).toBe(
        FunctionCallingConfigMode.NONE
      );
      expect(
        result!.functionCallingConfig.allowedFunctionNames
      ).toBeUndefined();
    });

    it('should map required toolChoice to ANY mode (no restriction)', () => {
      const result = mapGeminiToolConfig({
        mode: { type: 'regular', toolChoice: { type: 'required' } },
      } as any as LanguageModelV1CallOptions);

      expect(result).toBeDefined();
      expect(result!.functionCallingConfig.mode).toBe(
        FunctionCallingConfigMode.ANY
      );
      expect(
        result!.functionCallingConfig.allowedFunctionNames
      ).toBeUndefined();
    });

    it('should map tool toolChoice to ANY mode and restrict allowedFunctionNames', () => {
      const result = mapGeminiToolConfig({
        mode: {
          type: 'regular',
          toolChoice: { type: 'tool', toolName: 'getWeather' },
        },
      } as any as LanguageModelV1CallOptions);

      expect(result).toBeDefined();
      expect(result!.functionCallingConfig.mode).toBe(
        FunctionCallingConfigMode.ANY
      );
      expect(result!.functionCallingConfig.allowedFunctionNames).toEqual([
        'getWeather',
      ]);
    });
  });
});
