# Zod to Gemini Function Declaration Mapping

## Overview

This document provides a comprehensive mapping between Vercel AI SDK's use of Zod schemas for tool definitions and Google Gemini's FunctionDeclaration format requirements.

## Core Type Definitions

### Vercel AI SDK Tool Structure

```typescript
// From @ai-sdk/provider
interface LanguageModelV1FunctionTool {
  type: 'function';
  name: string;
  description?: string;
  parameters: JSONSchema7;  // JSON Schema format
}

// From @ai-sdk/ai-core
interface Tool<PARAMETERS extends ToolParameters = any, RESULT = any> {
  parameters: PARAMETERS;  // Can be z.ZodTypeAny or Schema<any>
  description?: string;
  execute?: (args: inferParameters<PARAMETERS>, options: ToolExecutionOptions) => PromiseLike<RESULT>;
}
```

### Google Gemini FunctionDeclaration

```typescript
// From @google/genai
interface FunctionDeclaration {
  name: string;
  description?: string;
  parameters?: Schema;  // Gemini's custom Schema format
  parametersJsonSchema?: unknown;  // Alternative: standard JSON Schema
  behavior?: Behavior;
}

interface Schema {
  type?: Type;  // 'TYPE_UNSPECIFIED' | 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT'
  format?: string;
  description?: string;
  nullable?: boolean;
  enum?: string[];
  items?: Schema;  // For arrays
  properties?: { [key: string]: Schema };  // For objects
  required?: string[];  // For objects
  anyOf?: Schema[];
  default?: unknown;
  example?: unknown;
  
  // String constraints
  maxLength?: string;
  minLength?: string;
  pattern?: string;
  
  // Number constraints
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  
  // Array constraints
  minItems?: string;
  maxItems?: string;
  uniqueItems?: boolean;
  
  // Object constraints
  minProperties?: string;
  maxProperties?: string;
  additionalProperties?: boolean;
}
```

## Conversion Strategy

### 1. Tool Definition Conversion

```typescript
function convertVercelToolToGemini(tool: LanguageModelV1FunctionTool): FunctionDeclaration {
  return {
    name: tool.name,
    description: tool.description,
    parameters: convertJSONSchemaToGeminiSchema(tool.parameters)
  };
}
```

### 2. Zod to JSON Schema to Gemini Schema

The conversion happens in two steps:
1. **Zod → JSON Schema**: Using `zod-to-json-schema` library (already done by Vercel AI SDK)
2. **JSON Schema → Gemini Schema**: Custom conversion logic

### 3. Type Mapping Table

| Zod Type | JSON Schema Type | Gemini Schema Type | Notes |
|----------|------------------|-------------------|-------|
| `z.string()` | `{ type: 'string' }` | `{ type: 'STRING' }` | |
| `z.number()` | `{ type: 'number' }` | `{ type: 'NUMBER' }` | |
| `z.boolean()` | `{ type: 'boolean' }` | `{ type: 'BOOLEAN' }` | |
| `z.literal()` | `{ const: value }` | `{ enum: [value] }` | Single enum value |
| `z.enum()` | `{ enum: [...] }` | `{ type: 'STRING', enum: [...] }` | |
| `z.array()` | `{ type: 'array', items: {...} }` | `{ type: 'ARRAY', items: {...} }` | |
| `z.object()` | `{ type: 'object', properties: {...} }` | `{ type: 'OBJECT', properties: {...} }` | |
| `z.union()` | `{ anyOf: [...] }` | `{ anyOf: [...] }` | |
| `z.optional()` | `{ type: [..., 'null'] }` | `{ nullable: true }` | |
| `z.nullable()` | `{ type: [..., 'null'] }` | `{ nullable: true }` | |
| `z.record()` | `{ type: 'object', additionalProperties: {...} }` | `{ type: 'OBJECT', additionalProperties: true }` | |
| `z.tuple()` | `{ type: 'array', items: [...] }` | Not directly supported | Convert to array with items schema |
| `z.intersection()` | `{ allOf: [...] }` | Not directly supported | Merge properties |
| `z.lazy()` | `{ $ref: '...' }` | Not supported | Requires schema flattening |

### 4. Format Mapping

| Zod/JSON Schema Format | Gemini Format | Notes |
|----------------------|---------------|-------|
| `email` | `email` | |
| `url` | `uri` | |
| `uuid` | `uuid` | |
| `date-time` | `date-time` | |
| `date` | `date` | |
| `time` | `time` | |
| `ipv4` | `ipv4` | |
| `ipv6` | `ipv6` | |
| `hostname` | Not supported | Use string |
| `json-pointer` | Not supported | Use string |
| `regex` | Use `pattern` property | |

### 5. Constraint Mapping

#### String Constraints
```typescript
// Zod
z.string().min(5).max(100).regex(/^[A-Z]/)

// JSON Schema
{
  type: 'string',
  minLength: 5,
  maxLength: 100,
  pattern: '^[A-Z]'
}

// Gemini Schema
{
  type: 'STRING',
  minLength: '5',  // Note: string type
  maxLength: '100', // Note: string type
  pattern: '^[A-Z]'
}
```

#### Number Constraints
```typescript
// Zod
z.number().min(0).max(100).int()

// JSON Schema
{
  type: 'integer',
  minimum: 0,
  maximum: 100
}

// Gemini Schema
{
  type: 'INTEGER',
  minimum: 0,
  maximum: 100
}
```

#### Array Constraints
```typescript
// Zod
z.array(z.string()).min(1).max(10)

// JSON Schema
{
  type: 'array',
  items: { type: 'string' },
  minItems: 1,
  maxItems: 10
}

// Gemini Schema
{
  type: 'ARRAY',
  items: { type: 'STRING' },
  minItems: '1',  // Note: string type
  maxItems: '10'  // Note: string type
}
```

## Implementation Guidelines

### 1. Conversion Function Structure

```typescript
function convertJSONSchemaToGeminiSchema(jsonSchema: JSONSchema7): Schema {
  // Handle boolean schemas
  if (typeof jsonSchema === 'boolean') {
    return { type: 'BOOLEAN' };
  }

  const geminiSchema: Schema = {};

  // Convert type
  if (jsonSchema.type) {
    geminiSchema.type = mapJSONSchemaTypeToGemini(jsonSchema.type);
  }

  // Convert constraints based on type
  if (geminiSchema.type === 'STRING') {
    if (jsonSchema.minLength !== undefined) {
      geminiSchema.minLength = String(jsonSchema.minLength);
    }
    if (jsonSchema.maxLength !== undefined) {
      geminiSchema.maxLength = String(jsonSchema.maxLength);
    }
    if (jsonSchema.pattern) {
      geminiSchema.pattern = jsonSchema.pattern;
    }
  }

  // Handle objects
  if (geminiSchema.type === 'OBJECT' && jsonSchema.properties) {
    geminiSchema.properties = {};
    for (const [key, value] of Object.entries(jsonSchema.properties)) {
      geminiSchema.properties[key] = convertJSONSchemaToGeminiSchema(value);
    }
    if (jsonSchema.required) {
      geminiSchema.required = jsonSchema.required;
    }
  }

  // Handle arrays
  if (geminiSchema.type === 'ARRAY' && jsonSchema.items) {
    geminiSchema.items = convertJSONSchemaToGeminiSchema(jsonSchema.items);
  }

  // Copy common properties
  if (jsonSchema.description) {
    geminiSchema.description = jsonSchema.description;
  }
  if (jsonSchema.enum) {
    geminiSchema.enum = jsonSchema.enum.map(String);
  }
  if (jsonSchema.default !== undefined) {
    geminiSchema.default = jsonSchema.default;
  }

  return geminiSchema;
}
```

### 2. Type Mapping Helper

```typescript
function mapJSONSchemaTypeToGemini(type: JSONSchema7TypeName | JSONSchema7TypeName[]): string {
  if (Array.isArray(type)) {
    // Handle nullable types
    const nonNullTypes = type.filter(t => t !== 'null');
    if (nonNullTypes.length === 1) {
      return mapSingleType(nonNullTypes[0]);
    }
    // Multiple non-null types not directly supported
    return 'TYPE_UNSPECIFIED';
  }
  return mapSingleType(type);
}

function mapSingleType(type: JSONSchema7TypeName): string {
  switch (type) {
    case 'string': return 'STRING';
    case 'number': return 'NUMBER';
    case 'integer': return 'INTEGER';
    case 'boolean': return 'BOOLEAN';
    case 'array': return 'ARRAY';
    case 'object': return 'OBJECT';
    case 'null': return 'TYPE_UNSPECIFIED';
    default: return 'TYPE_UNSPECIFIED';
  }
}
```

### 3. Special Cases Handling

#### Nullable Types
```typescript
// JSON Schema: { type: ['string', 'null'] }
// Gemini: { type: 'STRING', nullable: true }
```

#### Union Types (anyOf)
```typescript
// JSON Schema: { anyOf: [{ type: 'string' }, { type: 'number' }] }
// Gemini: { anyOf: [{ type: 'STRING' }, { type: 'NUMBER' }] }
```

#### Empty Objects
```typescript
// JSON Schema: { type: 'object', properties: {} }
// Gemini: omit parameters entirely or use parametersJsonSchema
```

## Alternative Approach: Using parametersJsonSchema

Gemini also supports standard JSON Schema through the `parametersJsonSchema` field:

```typescript
function convertVercelToolToGeminiWithJsonSchema(tool: LanguageModelV1FunctionTool): FunctionDeclaration {
  return {
    name: tool.name,
    description: tool.description,
    parametersJsonSchema: tool.parameters  // Use JSON Schema directly
  };
}
```

This approach may be simpler but requires verifying that Gemini CLI Core supports this field.

## Testing Considerations

1. **Type Coverage**: Test all Zod primitive types and their combinations
2. **Constraint Validation**: Ensure numeric constraints are properly converted to strings where required
3. **Nested Structures**: Test deeply nested objects and arrays
4. **Edge Cases**: Empty objects, null values, undefined properties
5. **Schema References**: Handle or reject recursive schemas appropriately

## Recommendations

1. **Primary Approach**: Convert to Gemini's native Schema format for maximum compatibility
2. **Fallback**: Use `parametersJsonSchema` if supported by Gemini CLI Core
3. **Validation**: Implement runtime validation to ensure converted schemas are valid
4. **Documentation**: Document any limitations or unsupported features
5. **Error Handling**: Provide clear error messages for unsupported schema patterns