# Tool Schema Mapping: Vercel AI SDK to Gemini

## Overview

This document outlines the mapping between Vercel AI SDK's Zod-based tool schemas and Google Gemini's FunctionDeclaration format.

## Vercel AI SDK Tool Structure

```typescript
interface LanguageModelV1FunctionTool {
  type: 'function';
  name: string;
  description?: string;
  parameters: JSONSchema7;
}
```

The AI SDK uses `zodSchema()` utility to convert Zod schemas to JSON Schema 7 format.

## Gemini FunctionDeclaration Format

```typescript
interface FunctionDeclaration {
  name: string;
  description?: string;
  // Option 1: Native Gemini Schema format
  parameters?: Schema;
  // Option 2: Standard JSON Schema (alternative)
  parametersJsonSchema?: object;
}

interface Schema {
  type: 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT';
  description?: string;
  nullable?: boolean;
  enum?: string[];
  items?: Schema;  // For arrays
  properties?: { [key: string]: Schema };  // For objects
  required?: string[];  // For objects
  // Constraints (note: some use string type)
  minLength?: string;
  maxLength?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minItems?: string;
  maxItems?: string;
}
```

## Type Mapping Table

### Basic Types

| JSON Schema Type | Gemini Schema Type | Notes |
|-----------------|-------------------|-------|
| `string` | `STRING` | |
| `number` | `NUMBER` | |
| `integer` | `INTEGER` | |
| `boolean` | `BOOLEAN` | |
| `array` | `ARRAY` | Requires `items` |
| `object` | `OBJECT` | Requires `properties` |

### Zod to JSON Schema to Gemini

| Zod Type | JSON Schema | Gemini Schema |
|----------|-------------|---------------|
| `z.string()` | `{type: 'string'}` | `{type: 'STRING'}` |
| `z.number()` | `{type: 'number'}` | `{type: 'NUMBER'}` |
| `z.boolean()` | `{type: 'boolean'}` | `{type: 'BOOLEAN'}` |
| `z.array(T)` | `{type: 'array', items: T}` | `{type: 'ARRAY', items: T}` |
| `z.object({...})` | `{type: 'object', properties: {...}}` | `{type: 'OBJECT', properties: {...}}` |
| `z.enum([...])` | `{enum: [...]}` | `{enum: [...]}` |
| `z.optional(T)` | `T` (not in required) | `T` (not in required) |
| `z.nullable(T)` | `{type: [T, 'null']}` | `{...T, nullable: true}` |

## Special Conversions

### Nullable Types
JSON Schema: `{type: ['string', 'null']}`
Gemini: `{type: 'STRING', nullable: true}`

### Const Values
JSON Schema: `{const: 'value'}`
Gemini: `{enum: ['value']}`

### Numeric Constraints
Note: Some Gemini constraints use string type:
- `minLength`, `maxLength`: string representation of number
- `minItems`, `maxItems`: string representation of number
- `minimum`, `maximum`: number type

### Union Types (anyOf)
Both formats support `anyOf` for union types.

## Implementation Approach

### Current Implementation: Convert to Native Gemini Schema
```typescript
function mapToolsToGeminiFormat(tools: LanguageModelV1FunctionTool[]): Tool[] {
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
```

The implementation uses the native Gemini Schema format (`parameters` field) rather than `parametersJsonSchema`. This ensures maximum compatibility with the Gemini CLI Core library.

## Unsupported Features

1. **References ($ref)**: Gemini doesn't support JSON Schema references
2. **allOf**: Not directly supported, needs manual merging
3. **Tuple arrays**: Not supported in Gemini
4. **Complex validation**: Some JSON Schema validation rules have no Gemini equivalent

## Testing Considerations

1. Test with simple types (string, number, boolean)
2. Test with nested objects and arrays
3. Test with optional and nullable fields
4. Test with enums and const values
5. Test with complex real-world schemas
6. Verify constraint conversion (especially string vs number types)