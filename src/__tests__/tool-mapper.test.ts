import { describe, it, expect } from 'vitest';
import { mapToolsToGeminiFormat } from '../tool-mapper';
import type { LanguageModelV2FunctionTool } from '@ai-sdk/provider';
import { z } from 'zod';

describe('mapToolsToGeminiFormat', () => {
  describe('basic tool mapping', () => {
    it('should map a simple tool with Zod schema', () => {
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'getWeather',
          description: 'Get the weather for a location',
          inputSchema: z.object({
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
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'getWeather',
          description: 'Get weather',
          inputSchema: z.object({ location: z.string() }),
        },
        {
          type: 'function',
          name: 'getTime',
          description: 'Get current time',
          inputSchema: z.object({ timezone: z.string() }),
        },
      ];

      const result = mapToolsToGeminiFormat(tools);

      expect(result).toHaveLength(1);
      expect(result[0].functionDeclarations).toHaveLength(2);
      expect(result[0].functionDeclarations[0].name).toBe('getWeather');
      expect(result[0].functionDeclarations[1].name).toBe('getTime');
    });

    it('should handle empty tools array', () => {
      const tools: LanguageModelV2FunctionTool[] = [];
      const result = mapToolsToGeminiFormat(tools);

      expect(result).toHaveLength(1);
      expect(result[0].functionDeclarations).toHaveLength(0);
    });
  });

  describe('JSON schema parameters', () => {
    it('should map tool with JSON schema parameters', () => {
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'createUser',
          description: 'Create a new user',
          inputSchema: {
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
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          inputSchema: {
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
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          inputSchema: {
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
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          inputSchema: {
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
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          inputSchema: {
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
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          inputSchema: {
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
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          inputSchema: {
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
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'createOrder',
          description: 'Create an order',
          inputSchema: z.object({
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
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'processValue',
          description: 'Process a value',
          inputSchema: z.object({
            value: z.union([z.string(), z.number(), z.boolean()]),
          }),
        },
      ];

      const result = mapToolsToGeminiFormat(tools);
      const params = result[0].functionDeclarations[0].parameters as any;

      // Zod v3 with zod-to-json-schema converts unions to type arrays
      // Zod v4 uses anyOf for unions
      // Check for either format
      if (params.properties.value.type) {
        // Zod v3 format: type array
        expect(params.properties.value.type).toEqual([
          'string',
          'number',
          'boolean',
        ]);
      } else if (params.properties.value.anyOf) {
        // Zod v4 format: anyOf array
        expect(params.properties.value.anyOf).toEqual([
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' },
        ]);
      } else {
        throw new Error('Union type not properly converted to JSON Schema');
      }
    });

    it('should handle Zod optional fields', () => {
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'updateUser',
          description: 'Update user',
          inputSchema: z.object({
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
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          inputSchema: 'not-a-schema' as any,
        },
      ];

      const result = mapToolsToGeminiFormat(tools);

      expect(result[0].functionDeclarations[0].parameters).toBe('not-a-schema');
    });

    it('should handle null parameters', () => {
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          inputSchema: null as any,
        },
      ];

      const result = mapToolsToGeminiFormat(tools);

      expect(result[0].functionDeclarations[0].parameters).toBe(null);
    });

    it('should handle undefined parameters', () => {
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          inputSchema: undefined as any,
        },
      ];

      const result = mapToolsToGeminiFormat(tools);

      expect(result[0].functionDeclarations[0].parameters).toBe(undefined);
    });

    it('should handle primitive types in cleanJsonSchema', () => {
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          inputSchema: {
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
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          description: 'Test function',
          inputSchema: {
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
      const tools: LanguageModelV2FunctionTool[] = [
        {
          type: 'function',
          name: 'test',
          // No description
          inputSchema: z.object({ value: z.string() }),
        } as LanguageModelV2FunctionTool,
      ];

      const result = mapToolsToGeminiFormat(tools);

      expect(result[0].functionDeclarations[0].name).toBe('test');
      expect(result[0].functionDeclarations[0].description).toBeUndefined();
    });
  });
});
