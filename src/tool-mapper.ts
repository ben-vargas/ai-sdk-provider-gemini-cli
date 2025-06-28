import type { LanguageModelV1FunctionTool } from '@ai-sdk/provider';
import type { Tool, FunctionDeclaration } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

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
function convertToolParameters(parameters: unknown): any {
  // If it's already a plain object (JSON schema), clean it
  if (isJsonSchema(parameters)) {
    return cleanJsonSchema(parameters as any);
  }

  // If it's a Zod schema, convert to JSON schema first
  if (isZodSchema(parameters)) {
    const jsonSchema = zodToJsonSchema(parameters as z.ZodSchema);
    return cleanJsonSchema(jsonSchema);
  }

  // Return as-is if we can't identify the format
  return parameters;
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
function isZodSchema(obj: unknown): boolean {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '_def' in obj &&
    typeof (obj as any)._def === 'object'
  );
}

/**
 * Cleans JSON schema for Gemini compatibility
 * Removes $schema and other metadata that Gemini doesn't support
 */
function cleanJsonSchema(schema: any): any {
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
  if (cleaned.properties) {
    cleaned.properties = Object.fromEntries(
      Object.entries(cleaned.properties).map(([key, value]) => [
        key,
        cleanJsonSchema(value),
      ])
    );
  }

  if (cleaned.items) {
    cleaned.items = cleanJsonSchema(cleaned.items);
  }

  if (cleaned.additionalProperties && typeof cleaned.additionalProperties === 'object') {
    cleaned.additionalProperties = cleanJsonSchema(cleaned.additionalProperties);
  }

  // Clean arrays
  for (const key of ['allOf', 'anyOf', 'oneOf']) {
    if (Array.isArray(cleaned[key])) {
      cleaned[key] = cleaned[key].map(cleanJsonSchema);
    }
  }

  return cleaned;
}