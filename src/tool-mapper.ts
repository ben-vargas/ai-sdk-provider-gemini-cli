import type {
  LanguageModelV3CallOptions,
  LanguageModelV3FunctionTool,
  LanguageModelV3ToolChoice,
} from '@ai-sdk/provider';
import {
  Tool,
  FunctionDeclaration,
  Schema,
  ToolConfig,
  FunctionCallingConfigMode,
} from '@google/genai';
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
  tools: LanguageModelV3FunctionTool[]
): Tool[] {
  const functionDeclarations: FunctionDeclaration[] = [];

  for (const tool of tools) {
    functionDeclarations.push({
      name: tool.name,
      description: tool.description,
      parameters: convertToolParameters(tool.inputSchema),
    });
  }

  return [{ functionDeclarations }];
}

/**
 * Attempts to convert a Zod schema to JSON Schema using available methods
 */
function convertZodToJsonSchema(zodSchema: z.ZodSchema): unknown {
  // Try Zod v4's native toJSONSchema function first (if available)
  const zodWithToJSONSchema = z as unknown as {
    toJSONSchema?: (schema: z.ZodSchema) => unknown;
  };

  if (
    zodWithToJSONSchema.toJSONSchema &&
    typeof zodWithToJSONSchema.toJSONSchema === 'function'
  ) {
    try {
      // Zod v4 uses z.toJSONSchema(schema) as a standalone function
      return zodWithToJSONSchema.toJSONSchema(zodSchema);
    } catch {
      // Method exists but failed, try fallback
    }
  }

  // Try zod-to-json-schema for Zod v3 compatibility
  try {
    // Lazy load zod-to-json-schema to avoid import errors with Zod v4
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const zodToJsonSchemaModule = require('zod-to-json-schema');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return zodToJsonSchemaModule.zodToJsonSchema(zodSchema);
  } catch {
    // zod-to-json-schema not available or not compatible
  }

  // No conversion method available
  console.warn(
    'Unable to convert Zod schema to JSON Schema. ' +
      'For Zod v3, install zod-to-json-schema. ' +
      'For Zod v4, use z.toJSONSchema() function.'
  );

  // Return a basic object schema as fallback
  return { type: 'object' };
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
    const jsonSchema = convertZodToJsonSchema(parameters as z.ZodSchema);
    return cleanJsonSchema(jsonSchema as JsonSchemaObject) as Schema;
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

  if (cleaned.properties && cleaned.type === undefined) {
    cleaned.type = 'object';
  }

  return cleaned;
}

/**
 * Maps Vercel AI SDK tool config options to Gemini format
 */
export function mapGeminiToolConfig(
  options: LanguageModelV3CallOptions
): ToolConfig | undefined {
  if (options.toolChoice) {
    // Restrict allowed function names when a specific tool is forced.
    // Gemini expects that when forcing a tool call, the function name is
    // provided via `allowedFunctionNames` while `mode` is set to ANY.
    const allowedFunctionNames =
      options.toolChoice.type === 'tool'
        ? [options.toolChoice.toolName]
        : undefined;

    return {
      functionCallingConfig: {
        allowedFunctionNames,
        mode: mapToolChoiceToGeminiFormat(options.toolChoice),
      },
    };
  }
  return undefined;
}

function mapToolChoiceToGeminiFormat(
  toolChoice: LanguageModelV3ToolChoice
): FunctionCallingConfigMode {
  switch (toolChoice.type) {
    case 'auto':
      return FunctionCallingConfigMode.AUTO;
    case 'none':
      return FunctionCallingConfigMode.NONE;
    case 'required':
    case 'tool':
      return FunctionCallingConfigMode.ANY;
    default:
      // this should never happen if types are correct
      return FunctionCallingConfigMode.MODE_UNSPECIFIED;
  }
}
