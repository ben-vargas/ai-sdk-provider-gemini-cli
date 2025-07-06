import type { LanguageModelV1FunctionTool } from '@ai-sdk/provider';
import type { Tool, FunctionDeclaration, Schema } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

// Type for JSON Schema objects with common properties
interface JsonSchemaObject {
  $schema?: string;
  $ref?: string;
  $defs?: unknown;
  definitions?: unknown;
  properties?: Record<string, unknown>;
  items?: unknown;
  additionalProperties?: unknown;
  allOf?: unknown[];
  anyOf?: unknown[];
  oneOf?: unknown[];
  [key: string]: unknown;
}

/**
 * Maps Vercel AI SDK tools to Gemini format
 */
export function mapToolsToGeminiFormat(
  tools: LanguageModelV1FunctionTool[]
): Tool[] {
  const functionDeclarations: FunctionDeclaration[] = [];

  for (const tool of tools) {
    functionDeclarations.push({
      name: tool.name,
      description: tool.description,
      parameters: convertToolParameters(tool.parameters),
    });
  }

  return [{ functionDeclarations }];
}

/**
 * Converts tool parameters from Zod schema or JSON schema to Gemini format
 */
function convertToolParameters(parameters: unknown): Schema {
  // If it's already a plain object (JSON schema), clean it
  if (isJsonSchema(parameters)) {
    return cleanJsonSchema(parameters as JsonSchemaObject) as Schema;
  }

  // If it's a Zod schema, convert to JSON schema first
  if (isZodSchema(parameters)) {
    const jsonSchema = zodToJsonSchema(parameters as z.ZodSchema);
    return cleanJsonSchema(jsonSchema) as Schema;
  }

  // Return a basic schema if we can't identify the format
  return parameters as Schema;
}

/**
 * Checks if an object is a JSON schema
 */
function isJsonSchema(obj: unknown): boolean {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('type' in obj || 'properties' in obj || '$schema' in obj)
  );
}

/**
 * Checks if an object is a Zod schema
 */
function isZodSchema(obj: unknown): obj is z.ZodTypeAny {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '_def' in obj &&
    typeof (obj as z.ZodTypeAny)._def === 'object'
  );
}

/**
 * Cleans JSON schema for Gemini compatibility
 * Removes $schema and other metadata that Gemini doesn't support
 */
function cleanJsonSchema(schema: JsonSchemaObject): JsonSchemaObject {
  if (typeof schema !== 'object' || schema === null) {
    return schema;
  }

  const cleaned = { ...schema };

  // Remove $schema property
  delete cleaned.$schema;
  delete cleaned.$ref;
  delete cleaned.$defs;
  delete cleaned.definitions;

  // Recursively clean nested schemas
  if (cleaned.properties && typeof cleaned.properties === 'object') {
    const cleanedProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(cleaned.properties)) {
      cleanedProps[key] = cleanJsonSchema(value as JsonSchemaObject);
    }
    cleaned.properties = cleanedProps;
  }

  if (cleaned.items) {
    cleaned.items = cleanJsonSchema(cleaned.items as JsonSchemaObject);
  }

  if (
    cleaned.additionalProperties &&
    typeof cleaned.additionalProperties === 'object'
  ) {
    cleaned.additionalProperties = cleanJsonSchema(
      cleaned.additionalProperties as JsonSchemaObject
    );
  }

  // Clean arrays
  for (const key of ['allOf', 'anyOf', 'oneOf'] as const) {
    const arrayProp = cleaned[key];
    if (Array.isArray(arrayProp)) {
      cleaned[key] = arrayProp.map((item) =>
        cleanJsonSchema(item as JsonSchemaObject)
      );
    }
  }

  return cleaned;
}
