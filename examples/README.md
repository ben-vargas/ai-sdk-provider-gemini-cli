# Gemini CLI AI SDK Provider Examples

This directory contains curated examples demonstrating the key features of the Gemini CLI AI SDK Provider. Each example shows how to use Google's Gemini models through the Cloud Code endpoints with the Vercel AI SDK.

## Prerequisites

1. Authenticate with Google Cloud Code:
```bash
# Run the gemini CLI to authenticate
gemini auth login
```

2. Build the provider:
```bash
npm run build
```

3. Verify your setup:
```bash
node examples/check-auth.mjs
```

## Quick Start Examples

### 1. Basic Usage (`basic-usage.mjs`)
**Purpose**: The simplest example - generate text with Gemini and display metadata.
```bash
node examples/basic-usage.mjs
```
**Key concepts**: Text generation, token usage, OAuth authentication

### 2. Streaming (`streaming.mjs`)
**Purpose**: Demonstrate real-time streaming for responsive user experiences.
```bash
node examples/streaming.mjs
```
**Key concepts**: Stream processing, chunk handling, real-time output

### 3. Conversation History (`conversation-history.mjs`)
**Purpose**: Show how to maintain context across multiple messages.
```bash
node examples/conversation-history.mjs
```
**Key concepts**: Message history, context preservation, multi-turn conversations

## Advanced Configuration

### 4. Custom Config (`custom-config.mjs`)
**Purpose**: Demonstrate provider configuration options.
```bash
node examples/custom-config.mjs
```
**Key concepts**: API key auth, OAuth auth, model settings

### 5. System Messages (`system-messages.mjs`)
**Purpose**: Use system prompts to control model behavior.
```bash
node examples/system-messages.mjs
```
**Key concepts**: System instructions, persona control, response formatting

### 6. Long-Running Tasks (`long-running-tasks.mjs`)
**Purpose**: Handle complex tasks with proper timeout management.
```bash
node examples/long-running-tasks.mjs
```
**Key concepts**: AbortSignal, timeout handling, complex reasoning

## Object Generation (Structured Output)

### 7. Object Generation Basic (`generate-object-basic.mjs`)
**Purpose**: Learn structured output generation step-by-step.
```bash
node examples/generate-object-basic.mjs
```
**Key concepts**: Zod schemas, JSON generation, validation

### 8. Nested Structures (`generate-object-nested.mjs`)
**Purpose**: Generate complex hierarchical data structures.
```bash
node examples/generate-object-nested.mjs
```
**Key concepts**: Nested objects, arrays of objects, complex relationships

### 9. Validation Constraints (`generate-object-constraints.mjs`)
**Purpose**: Enforce data quality with validation rules.
```bash
node examples/generate-object-constraints.mjs
```
**Key concepts**: Enums, ranges, patterns, business rules

### 10. Advanced Object Generation (`generate-object-advanced.mjs`)
**Purpose**: Real-world examples of complex object generation.
```bash
node examples/generate-object-advanced.mjs
```
**Key concepts**: Product catalogs, analytics data, form generation

## Testing & Troubleshooting

### 11. Check Authentication (`check-auth.mjs`)
**Purpose**: Verify Google Cloud Code authentication status.
```bash
node examples/check-auth.mjs
```
**Key concepts**: OAuth validation, credential refresh, troubleshooting

### 12. Integration Test (`integration-test.mjs`)
**Purpose**: Comprehensive test suite to verify all features.
```bash
node examples/integration-test.mjs
```
**Key concepts**: Feature verification, error handling, test patterns

### 13. Error Handling (`error-handling.mjs`)
**Purpose**: Demonstrate proper error handling patterns.
```bash
node examples/error-handling.mjs
```
**Key concepts**: Authentication errors, rate limits, retry logic

## Common Patterns

### OAuth Authentication
```javascript
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';

// Uses ~/.gemini/oauth_creds.json automatically
const gemini = createGeminiProvider({
  authType: 'oauth-personal'
});
```

### API Key Authentication
```javascript
const gemini = createGeminiProvider({
  authType: 'api-key',
  apiKey: process.env.GOOGLE_API_KEY
});
```

### Message History
```javascript
const messages = [
  { role: 'user', content: 'My name is Alice' },
  { role: 'assistant', content: 'Nice to meet you, Alice!' },
  { role: 'user', content: 'What is my name?' }
];

const { text } = await generateText({
  model: gemini('gemini-2.5-pro'),
  messages,
});
```

### Custom Timeouts
```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 60000); // 1 minute

try {
  const { text } = await generateText({
    model: gemini('gemini-2.5-pro'),
    prompt: 'Complex analysis...',
    abortSignal: controller.signal,
  });
  clearTimeout(timeout);
} catch (error) {
  // Handle timeout
}
```

## Quick Reference

| Example | Primary Use Case | Key Feature |
|---------|-----------------|-------------|
| basic-usage | Getting started | Simple generation |
| streaming | Responsive UIs | Real-time output |
| conversation-history | Chatbots | Context retention |
| custom-config | Authentication | OAuth vs API key |
| system-messages | Response control | System prompts |
| generate-object-basic | Learning | Structured output |
| generate-object-nested | Complex data | Hierarchical JSON |
| check-auth | Setup | Authentication status |

## Learning Path

1. **Beginners**: `check-auth.mjs` → `basic-usage.mjs` → `streaming.mjs`
2. **Object Generation**: `generate-object-basic.mjs` → `generate-object-nested.mjs` → `generate-object-advanced.mjs`
3. **Advanced**: `system-messages.mjs` → `long-running-tasks.mjs` → `error-handling.mjs`
4. **Testing**: Run `integration-test.mjs` to verify everything works

## Cloud Code Endpoints

This provider uses Google Cloud Code endpoints (https://cloudcode-pa.googleapis.com) through the gemini-cli-core library. The available models include:
- `gemini-2.5-pro` - Most capable model (64K output tokens)
- `gemini-2.5-flash` - Faster, efficient model (64K output tokens)

**Note**: The provider defaults to 64K output tokens to take full advantage of Gemini 2.5's capabilities. You can override this with the `maxTokens` parameter if needed.

## Troubleshooting

If you encounter authentication issues:
1. Run `gemini auth login` to authenticate
2. Check `~/.gemini/oauth_creds.json` exists
3. Run `node examples/check-auth.mjs` to verify

If you encounter rate limit errors:
- `gemini-2.5-pro` has stricter rate limits
- Consider using `gemini-2.5-flash` for testing and development
- Add delays between requests if running multiple examples

For object generation issues:
- Very strict character length constraints (e.g., exactly 60-80 chars) can be challenging
- Consider using ranges or slightly more flexible constraints
- The model may occasionally exceed limits by a few characters

For more details, see the main [README](../README.md).