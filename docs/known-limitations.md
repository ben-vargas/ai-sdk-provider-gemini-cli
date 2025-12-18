# Known Limitations

This document details known limitations when using the AI SDK Provider for Gemini CLI, particularly around structured output and schema complexity.

## Structured Output (generateObject) Limitations

The provider supports native structured output via Gemini's `responseJsonSchema` parameter. However, Gemini's API has internal limits on schema complexity that can cause requests to fail.

### Schema Complexity Limits

Gemini uses an internal "state machine" to enforce JSON schema constraints. When a schema is too complex, the API will reject it with an error:

```
The specified schema produces a constraint that has too many states for serving.
```

**This is not a provider bug** - it's a Gemini API limitation. The schema is rejected before generation begins.

#### What Makes a Schema "Too Complex"

Schemas that combine multiple of these features may exceed Gemini's limits:

| Feature | Risk Level | Example |
|---------|------------|---------|
| Deeply nested objects (3+ levels) | Medium | `product.variants[].inventory.warehouse` |
| Arrays of objects with nested arrays | High | `variants[].images[]` inside `product` |
| Many numeric constraints (min/max) | Medium | Multiple fields with `.min()`, `.max()`, `.positive()` |
| Record types with nested values | High | `z.record(z.string(), z.object({...}))` |
| Large array length limits | High | `.min(1).max(100)` on nested arrays |
| Multiple enum fields | Low | Several `z.enum([...])` fields |

#### Examples That May Fail

```typescript
// TOO COMPLEX - likely to fail
const complexSchema = z.object({
  product: z.object({
    variants: z.array(z.object({
      inventory: z.object({
        warehouse: z.record(z.string(), z.number()),
      }),
      images: z.array(z.object({
        url: z.string().url(),
        isPrimary: z.boolean(),
      })).min(1).max(10),
      pricing: z.object({
        price: z.number().positive().min(0.99).max(99999),
        margin: z.number().min(0).max(100),
      }),
    })).min(1).max(10),
    reviews: z.object({
      distribution: z.object({
        5: z.number().int(),
        4: z.number().int(),
        // ... more fields
      }),
    }),
  }),
});
```

```typescript
// SIMPLER - more likely to succeed
const simplerSchema = z.object({
  product: z.object({
    name: z.string(),
    price: z.number().positive(),
    category: z.enum(['electronics', 'clothing', 'home']),
    features: z.array(z.string()).max(5),
    inStock: z.boolean(),
  }),
});
```

### Problematic Constraints

Some Zod constraints don't work reliably with Gemini's structured output:

| Constraint | Issue | Workaround |
|------------|-------|------------|
| `.multipleOf(0.01)` | Floating-point multiples cause validation failures | Remove or use `.refine()` post-validation |
| `.multipleOf(0.5)` | Same issue with decimal multiples | Use integer cents/units instead |
| `.regex()` with complex patterns | May not be enforced | Validate after generation |
| `.url().startsWith('https://')` | Combined constraints may fail | Use simpler `.url()` only |

#### Example: multipleOf Issue

```typescript
// PROBLEMATIC - multipleOf with decimals
const schema = z.object({
  price: z.number().multipleOf(0.01),  // May cause validation failures
  rating: z.number().multipleOf(0.5),   // Same issue
});

// WORKAROUND - validate after generation
const schema = z.object({
  price: z.number().positive(),
  rating: z.number().min(0).max(5),
});

const { object } = await generateObject({ model, schema, prompt });

// Post-validate
const validatedPrice = Math.round(object.price * 100) / 100;
```

## Workarounds

### 1. Simplify Your Schema

Break complex schemas into smaller, focused schemas:

```typescript
// Instead of one massive schema, use multiple calls
const productBasics = await generateObject({
  schema: z.object({
    name: z.string(),
    price: z.number(),
    category: z.string(),
  }),
  prompt: 'Generate basic product info for a laptop',
});

const productFeatures = await generateObject({
  schema: z.object({
    features: z.array(z.string()).max(5),
    specs: z.object({
      cpu: z.string(),
      ram: z.string(),
      storage: z.string(),
    }),
  }),
  prompt: `Generate features for: ${productBasics.object.name}`,
});
```

### 2. Reduce Nesting Depth

Flatten nested structures where possible:

```typescript
// Instead of deep nesting
const deep = z.object({
  order: z.object({
    customer: z.object({
      address: z.object({
        street: z.string(),
        city: z.string(),
      }),
    }),
  }),
});

// Flatten to reduce complexity
const flat = z.object({
  customerStreet: z.string(),
  customerCity: z.string(),
  // ... other fields at top level
});
```

### 3. Remove Unnecessary Constraints

Only include constraints that are essential:

```typescript
// Over-constrained
const strict = z.object({
  price: z.number().positive().min(0.01).max(999999.99).multipleOf(0.01),
  quantity: z.number().int().nonnegative().min(0).max(10000),
});

// Minimal constraints
const minimal = z.object({
  price: z.number().positive(),
  quantity: z.number().int().nonnegative(),
});
```

### 4. Use Gemini 3 Pro for Complex Schemas

`gemini-3-pro-preview` may handle more complex schemas than other models:

```typescript
const model = gemini('gemini-3-pro-preview');  // Better for complex schemas
```

### 5. Post-Generation Validation

For constraints that Gemini can't enforce, validate after generation:

```typescript
import { z } from 'zod';

// Relaxed schema for generation
const generationSchema = z.object({
  email: z.string(),
  price: z.number(),
});

// Strict schema for validation
const validationSchema = z.object({
  email: z.string().email(),
  price: z.number().multipleOf(0.01),
});

const { object } = await generateObject({
  model,
  schema: generationSchema,
  prompt: 'Generate a user with email and price',
});

// Validate and transform
const validated = validationSchema.parse(object);
```

## Error Handling

When schema complexity causes failures, handle them gracefully:

```typescript
try {
  const { object } = await generateObject({
    model: gemini('gemini-2.5-pro'),
    schema: complexSchema,
    prompt: 'Generate complex data',
  });
} catch (error) {
  if (error.message?.includes('too many states')) {
    console.error('Schema too complex for Gemini. Try simplifying.');
    // Fall back to simpler schema or different approach
  } else if (error.message?.includes('could not parse')) {
    console.error('Generation succeeded but validation failed.');
    // The raw response may be available in error.text
  } else {
    throw error;
  }
}
```

## Summary

| Limitation | Cause | Solution |
|------------|-------|----------|
| "too many states" error | Schema complexity exceeds Gemini's internal limits | Simplify schema, reduce nesting |
| Validation failures with `multipleOf` | Floating-point precision issues | Remove constraint, validate post-generation |
| Complex regex not enforced | Limited regex support in schema | Validate after generation |
| Nested arrays of objects | Combinatorial explosion of states | Flatten structure or split into multiple calls |

## Related Documentation

- [Zod to Gemini Mapping](./zod-to-gemini-mapping.md) - How Zod types map to Gemini schemas
- [Tool Schema Mapping](./tool-schema-mapping.md) - Schema mapping for tool calls
- [Examples](../examples/) - Working examples including `generate-object-basic.mjs`
