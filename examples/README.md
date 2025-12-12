# Gemini CLI AI SDK Provider Examples

This directory contains curated examples demonstrating the key features of the Gemini CLI AI SDK Provider. Each example shows how to use Google's Gemini models through the Cloud Code endpoints with the Vercel AI SDK.

## Prerequisites

1. Authenticate with Google Cloud Code:
```bash
# Run the gemini CLI and follow interactive setup
gemini
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

## Logging Examples

The provider includes a flexible logging system that can be configured for different use cases. These examples demonstrate all logging modes:

### 4. Default Logging (`logging-default.mjs`)

**Purpose**: Understand the default logging behavior (non-verbose mode).

```bash
node examples/logging-default.mjs
```

**Key concepts**: Default behavior, warn/error only, clean output

**What you'll see**: Only warning and error messages appear. Debug and info logs are suppressed for clean output.

### 5. Verbose Logging (`logging-verbose.mjs`)

**Purpose**: Enable detailed logging for development and troubleshooting.

```bash
node examples/logging-verbose.mjs
```

**Key concepts**: Verbose mode, debug/info logs, execution tracing

**What you'll see**: All log levels (debug, info, warn, error) showing detailed provider activity.

### 6. Custom Logger (`logging-custom-logger.mjs`)

**Purpose**: Integrate with external logging systems (Winston, Pino, Datadog, etc.).

```bash
node examples/logging-custom-logger.mjs
```

**Key concepts**: Custom logger implementation, external integration, log formatting

**What you'll see**: Custom-formatted logs with timestamps and prefixes, demonstrating integration patterns.

### 7. Disabled Logging (`logging-disabled.mjs`)

**Purpose**: Completely silent operation with no logs.

```bash
node examples/logging-disabled.mjs
```

**Key concepts**: Silent mode, production deployments, zero output

**What you'll see**: No provider logs at all - completely silent operation.

## Multimodal File Support (New in v1.5.0)

### 8. PDF Document Analysis (`pdf-document-analysis.mjs`)
**Purpose**: Analyze PDF documents (like SEC 10-Q filings) with Gemini's multimodal capabilities.
```bash
node examples/pdf-document-analysis.mjs
```
**Key concepts**: PDF input, financial analysis, document understanding, base64 encoding

**What you'll see**: Executive summary, key financial metrics extraction, and risk analysis from a 10-Q filing.

**Supported file types**:
- PDF documents (`application/pdf`)
- Audio files (`audio/mp3`, `audio/wav`, `audio/flac`, etc.)
- Video files (`video/mp4`, `video/webm`, `video/mov`, etc.)
- Images (`image/png`, `image/jpeg`, `image/webp`, etc.)

## Advanced Configuration

### 9. Custom Config (`custom-config.mjs`)
**Purpose**: Demonstrate provider configuration options.
```bash
node examples/custom-config.mjs
```
**Key concepts**: API key auth, OAuth auth, model settings

### 10. System Messages (`system-messages.mjs`)
**Purpose**: Use system prompts to control model behavior.
```bash
node examples/system-messages.mjs
```
**Key concepts**: System instructions, persona control, response formatting

### 11. Long-Running Tasks (`long-running-tasks.mjs`)
**Purpose**: Handle complex tasks with proper timeout management.
```bash
node examples/long-running-tasks.mjs
```
**Key concepts**: AbortSignal, timeout handling, complex reasoning

## Object Generation (Structured Output)

### 12. Object Generation Basic (`generate-object-basic.mjs`)
**Purpose**: Learn structured output generation step-by-step.
```bash
node examples/generate-object-basic.mjs
```
**Key concepts**: Zod schemas, JSON generation, validation

### 13. Nested Structures (`generate-object-nested.mjs`)
**Purpose**: Generate complex hierarchical data structures.
```bash
node examples/generate-object-nested.mjs
```
**Key concepts**: Nested objects, arrays of objects, complex relationships

### 14. Validation Constraints (`generate-object-constraints.mjs`)
**Purpose**: Enforce data quality with validation rules.
```bash
node examples/generate-object-constraints.mjs
```
**Key concepts**: Enums, ranges, patterns, business rules

### 15. Advanced Object Generation (`generate-object-advanced.mjs`)
**Purpose**: Real-world examples of complex object generation.
```bash
node examples/generate-object-advanced.mjs
```
**Key concepts**: Product catalogs, analytics data, form generation

## Testing & Troubleshooting

### 16. Check Authentication (`check-auth.mjs`)
**Purpose**: Verify Google Cloud Code authentication status.
```bash
node examples/check-auth.mjs
```
**Key concepts**: OAuth validation, credential refresh, troubleshooting

### 17. Integration Test (`integration-test.mjs`)
**Purpose**: Comprehensive test suite to verify all features.
```bash
node examples/integration-test.mjs
```
**Key concepts**: Feature verification, error handling, test patterns

### 18. Error Handling (`error-handling.mjs`)
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
  apiKey: process.env.GEMINI_API_KEY
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
  model: gemini('gemini-3-pro-preview'),
  messages,
});
```

### Custom Timeouts
```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 60000); // 1 minute

try {
  const { text } = await generateText({
    model: gemini('gemini-3-pro-preview'),
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
| pdf-document-analysis | Document analysis | PDF/multimodal input |
| logging-default | Default behavior | Warn/error only |
| logging-verbose | Development/debugging | All log levels |
| logging-custom-logger | External integration | Custom logger impl |
| logging-disabled | Silent operation | No logs at all |
| custom-config | Authentication | OAuth vs API key |
| system-messages | Response control | System prompts |
| generate-object-basic | Learning | Structured output |
| generate-object-nested | Complex data | Hierarchical JSON |
| check-auth | Setup | Authentication status |

## Learning Path

1. **Beginners**: `check-auth.mjs` → `basic-usage.mjs` → `streaming.mjs` → `conversation-history.mjs`
2. **Logging**: `logging-default.mjs` → `logging-verbose.mjs` → `logging-custom-logger.mjs` → `logging-disabled.mjs`
3. **Object Generation**: `generate-object-basic.mjs` → `generate-object-nested.mjs` → `generate-object-advanced.mjs`
4. **Advanced**: `system-messages.mjs` → `long-running-tasks.mjs` → `error-handling.mjs`
5. **Testing**: Run `integration-test.mjs` to verify everything works

## Cloud Code Endpoints

This provider uses Google Cloud Code endpoints (https://cloudcode-pa.googleapis.com) through the gemini-cli-core library. The available models include:
- `gemini-3-pro-preview` - Latest next-generation model (Preview) - **Recommended for all examples**
- `gemini-2.5-pro` - Previous generation production-ready model (64K output tokens)
- `gemini-2.5-flash` - Faster, efficient model (64K output tokens)
- And more models as they become available

**Note**: The provider defaults to 64K output tokens to take full advantage of Gemini 2.5's capabilities. You can override this with the `maxTokens` parameter if needed.

## Troubleshooting

If you encounter authentication issues:
1. Run `gemini` and follow setup prompts to authenticate
2. Check `~/.gemini/oauth_creds.json` exists
3. Run `node examples/check-auth.mjs` to verify

If you encounter rate limit errors:
- Add delays between requests if running multiple examples
- Consider reducing the number of concurrent requests
- Check your quota in the Google Cloud Console

For object generation issues:
- Very strict character length constraints (e.g., exactly 60-80 chars) can be challenging
- Consider using ranges or slightly more flexible constraints
- The model may occasionally exceed limits by a few characters
- **Important**: When using `generateObject`, validation failures will throw an error saying "No object generated: could not parse the response"
  - This error message is misleading - the JSON was likely parsed successfully but failed schema validation
  - The actual generated object is available in the error's `text` property
  - For production use with strict schemas, consider using `generateText` with JSON mode for more control over validation

For more details, see the main [README](../README.md).