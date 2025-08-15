# Troubleshooting Guide for AI SDK v5

This guide helps resolve common issues when using the Gemini CLI Provider with AI SDK v5.

## Common Issues

### 1. Empty Responses with gemini-2.5-pro

**Problem**: Getting empty responses when using `maxOutputTokens` with gemini-2.5-pro.

```typescript
// This may return empty text
const result = await generateText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Write a story',
  maxOutputTokens: 1000,
});
```

**Solution**: Omit `maxOutputTokens` or use gemini-2.5-flash:

```typescript
// Option 1: Omit maxOutputTokens
const result = await generateText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Write a story',
});

// Option 2: Use gemini-2.5-flash
const result = await generateText({
  model: gemini('gemini-2.5-flash'),
  prompt: 'Write a story',
  maxOutputTokens: 1000,
});
```

### 2. "Could not parse the response" Error

**Problem**: Getting parsing errors with `generateObject` even though the JSON looks valid.

```typescript
// Error: "No object generated: could not parse the response"
const result = await generateObject({
  model: gemini('gemini-2.5-pro'),
  schema: z.object({
    description: z.string().max(50), // Very strict limit
  }),
  prompt: 'Describe machine learning', // Likely to exceed 50 chars
});
```

**Solution**: This error is misleading - it usually means schema validation failed, not parsing:

```typescript
// Option 1: Relax constraints
const result = await generateObject({
  model: gemini('gemini-2.5-pro'),
  schema: z.object({
    description: z.string().max(200), // More reasonable limit
  }),
  prompt: 'Describe machine learning briefly',
});

// Option 2: Use generateText with JSON mode
const result = await generateText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Describe machine learning. Return as JSON: {"description": "..."}',
});
const parsed = JSON.parse(result.text);
```

### 3. Timeouts Not Working as Expected

**Problem**: Abort signals timeout but the request continues running.

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 1000); // 1 second

// This will throw AbortError after 1 second, but the
// underlying request continues for 10+ seconds
const result = await generateText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Write a long essay',
  abortSignal: controller.signal,
});
```

**Solution**: This is a limitation of gemini-cli-core. The provider correctly handles abort signals but can't cancel the underlying HTTP request:

```typescript
// Understand that timeout only affects when YOU get the error
try {
  const result = await generateText({
    model: gemini('gemini-2.5-pro'),
    prompt: 'Write a long essay',
    abortSignal: controller.signal,
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Timed out (but request continues in background)');
  }
}
```

### 4. Authentication Errors

**Problem**: Getting authentication errors when trying to use the provider.

**Solutions**:

1. **OAuth Issues**:
   ```bash
   # Re-authenticate with Gemini CLI
   gemini
   # Or use the auth command
   gemini /auth
   ```

2. **API Key Issues**:
   ```typescript
   // Ensure API key is set
   const gemini = createGeminiProvider({
     authType: 'api-key',
     apiKey: process.env.GEMINI_API_KEY, // Must be defined
   });
   ```

3. **Check credentials location**:
   ```bash
   # OAuth credentials should be at:
   ls ~/.gemini/oauth_creds.json
   ```

### 5. TypeScript Type Errors

**Problem**: Getting type errors after upgrading to v5.

```typescript
// Type error: Property 'promptTokens' does not exist
console.log(result.usage.promptTokens);
```

**Solution**: Update to v5 property names:

```typescript
// v4 → v5 mapping
console.log(result.usage.inputTokens);   // was promptTokens
console.log(result.usage.outputTokens);  // was completionTokens
console.log(result.text);                // was result (destructured)
```

### 6. Streaming Not Working

**Problem**: Stream appears to hang or not produce output.

```typescript
// This might hang
const { textStream } = await streamText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Tell a story',
});
```

**Solution**: v5 returns a promise with stream properties:

```typescript
// Correct v5 pattern
const result = await streamText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Tell a story',
});

// Access stream from result
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### 7. Rate Limiting

**Problem**: Getting rate limit errors.

**Solution**: Implement exponential backoff:

```typescript
async function withBackoff(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      console.log(`Rate limited, waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const result = await withBackoff(() => 
  generateText({
    model: gemini('gemini-2.5-pro'),
    prompt: 'Hello',
  })
);
```

### 8. Message Format Errors

**Problem**: Getting errors about invalid message format.

```typescript
// This might cause errors
messages: [
  { content: 'Hello' }, // Missing role
  { role: 'ai', content: 'Hi' }, // Wrong role name
]
```

**Solution**: Use correct role names:

```typescript
messages: [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'How are you?' },
]
```

### 9. System Message Not Working

**Problem**: System messages seem to be ignored.

**Solution**: Ensure you're using the `system` parameter correctly:

```typescript
// Correct: Use 'system' parameter
const result = await generateText({
  model: gemini('gemini-2.5-pro'),
  system: 'You are a helpful assistant',
  prompt: 'Hello',
});

// NOT as a message with role 'system'
// Some models don't support system role in messages array
```

### 10. Image Input Errors

**Problem**: Errors when trying to use images.

```typescript
// This won't work - URL images not supported
content: [
  { type: 'text', text: 'What is this?' },
  { type: 'image', url: 'https://example.com/image.png' },
]
```

**Solution**: Use base64-encoded images:

```typescript
import { readFileSync } from 'fs';

const imageBuffer = readFileSync('image.png');
const base64 = imageBuffer.toString('base64');

const result = await generateText({
  model: gemini('gemini-2.5-pro'),
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'What is this?' },
      { type: 'image', data: base64 },
    ],
  }],
});
```

## Debugging Tips

### 1. Enable Verbose Logging

```typescript
// Log all options being passed
const model = gemini('gemini-2.5-pro');
console.log('Model config:', model);

const result = await generateText({
  model,
  prompt: 'Test',
  onFinish: ({ text, usage }) => {
    console.log('Finished:', { text, usage });
  },
});
```

### 2. Check Provider Version

```bash
# Ensure you're on the beta version
npm list ai-sdk-provider-gemini-cli
# Should show: ai-sdk-provider-gemini-cli@1.x.x-beta.x
```

### 3. Verify AI SDK Version

```bash
# Ensure AI SDK is v5
npm list ai
# Should show: ai@5.x.x-beta.x
```

### 4. Test Basic Functionality

```typescript
// Minimal test to isolate issues
async function testBasic() {
  try {
    const gemini = createGeminiProvider({
      authType: 'oauth-personal',
    });
    
    const result = await generateText({
      model: gemini('gemini-2.5-flash'), // Use flash for testing
      prompt: 'Say hello',
    });
    
    console.log('Success:', result.text);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Getting Help

If you're still experiencing issues:

1. Check the [examples](../../examples/) directory for working code
2. Review the [GUIDE.md](./GUIDE.md) for correct usage patterns
3. Ensure your Gemini CLI is up to date: `npm update -g @google/gemini-cli`
4. Check if the issue is specific to gemini-2.5-pro vs gemini-2.5-flash
5. Try with a minimal reproduction case

## Known Limitations

1. **No request cancellation**: Abort signals work from SDK perspective but underlying requests continue
2. **maxOutputTokens issues**: May cause empty responses with gemini-2.5-pro
3. **Image URLs not supported**: Must use base64-encoded images
4. **Some v5 features not supported**: Provider-defined tools, seed parameter
5. **Rate limits**: May differ from direct Gemini API due to Cloud Code endpoint usage