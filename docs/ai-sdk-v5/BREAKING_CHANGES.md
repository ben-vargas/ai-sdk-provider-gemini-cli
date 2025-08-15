# Breaking Changes: AI SDK v5

This document outlines the breaking changes when migrating from AI SDK v4 to v5 for the Gemini CLI provider.

## Overview

The Vercel AI SDK v5 introduces significant architectural changes that affect how providers are implemented and used. This provider has been updated to be fully compatible with v5.

## Key Breaking Changes

### 1. Response Format Changes

**v4 Response:**
```typescript
const { text, usage } = await generateText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Hello',
});
```

**v5 Response:**
```typescript
const result = await generateText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Hello',
});

// Access properties differently:
console.log(result.text);           // The generated text
console.log(result.usage);          // Token usage info
console.log(result.content[0].text); // Alternative access
```

### 2. Parameter Name Changes

Several parameter names have been updated to align with v5 conventions:

| v4 Parameter | v5 Parameter | Notes |
|--------------|-------------------|-------|
| `maxTokens` | `maxOutputTokens` | Maximum tokens to generate |
| `stopWords` | `stopSequences` | Sequences that stop generation |

### 3. Streaming API Changes

**v4 Streaming:**
```typescript
const { textStream } = await streamText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Tell me a story',
});

for await (const chunk of textStream) {
  process.stdout.write(chunk);
}
```

**v5 Streaming:**
```typescript
const result = await streamText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Tell me a story',
});

// Now returns a promise with stream properties
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}

// Can also access the full text after streaming
const fullText = await result.text;
```

### 4. Token Usage Property Names

Token usage reporting has been standardized:

**v4:**
```typescript
{
  promptTokens: 10,
  completionTokens: 50,
  totalTokens: 60
}
```

**v5:**
```typescript
{
  inputTokens: 10,
  outputTokens: 50,
  totalTokens: 60
}
```

### 5. Message Format Requirements

v5 enforces stricter message formats:

```typescript
// Messages must have proper role types
messages: [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'How are you?' }
]
```

### 6. Provider Interface Changes

The provider now extends `ProviderV2` and implements `LanguageModelV2`:

```typescript
// Provider extends ProviderV2
class GeminiProvider extends ProviderV2 {
  // Returns LanguageModelV2 instances
}
```

### 7. Error Handling

Error handling has been improved with better error types and messages:

```typescript
try {
  const result = await generateText({
    model: gemini('gemini-2.5-pro'),
    prompt: 'Hello',
  });
} catch (error) {
  // Errors now have consistent structure
  if (error.name === 'AbortError') {
    // Handle cancellation
  }
}
```

### 8. Object Generation

The `generateObject` function now has stricter schema validation:

```typescript
// Schema validation errors now show as:
// "No object generated: could not parse the response"
// This actually means validation failed, not parsing
```

## Migration Guide

### Step 1: Update Dependencies

```bash
npm install ai-sdk-provider-gemini-cli@beta ai@beta
```

### Step 2: Update Import Statements

No changes needed - imports remain the same:

```typescript
import { generateText, streamText } from 'ai';
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';
```

### Step 3: Update Response Handling

Replace all instances of destructured responses:

```typescript
// Old
const { text, usage } = await generateText(...);

// New
const result = await generateText(...);
const text = result.text;
const usage = result.usage;
```

### Step 4: Update Parameter Names

Search and replace parameter names:
- `maxTokens` → `maxOutputTokens`
- `stopWords` → `stopSequences`

### Step 5: Update Token Usage Access

Update any code that accesses token usage:

```typescript
// Old
console.log(usage.promptTokens);
console.log(usage.completionTokens);

// New
console.log(usage.inputTokens);
console.log(usage.outputTokens);
```

### Step 6: Test Thoroughly

Run all tests and examples to ensure compatibility:

```bash
npm run build
npm run example:test
```

## Known Issues

1. **maxOutputTokens with gemini-2.5-pro**: Setting `maxOutputTokens` can cause empty responses with gemini-2.5-pro. Consider omitting this parameter or using gemini-2.5-flash.

2. **Abort Signal Limitation**: The underlying gemini-cli-core doesn't support request cancellation. Abort signals work from the SDK perspective but requests continue in the background.

3. **Schema Validation Messages**: When using `generateObject`, validation failures show misleading "could not parse" errors even though JSON parsing succeeded.

## Need Help?

- Check the [examples](../../examples/) directory for v5 usage patterns
- Review the [GUIDE.md](./GUIDE.md) for detailed usage instructions
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues