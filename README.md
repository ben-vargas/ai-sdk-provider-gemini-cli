<p align="center">
  <img src="https://img.shields.io/badge/warning-alpha-FF6700" alt="alpha warning">
  <a href="https://www.npmjs.com/package/ai-sdk-provider-gemini-cli"><img src="https://img.shields.io/npm/v/ai-sdk-provider-gemini-cli?color=00A79E" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/ai-sdk-provider-gemini-cli"><img src="https://img.shields.io/npm/unpacked-size/ai-sdk-provider-gemini-cli?color=00A79E" alt="install size" /></a>
  <a href="https://www.npmjs.com/package/ai-sdk-provider-gemini-cli"><img src="https://img.shields.io/npm/dy/ai-sdk-provider-gemini-cli.svg?color=00A79E" alt="npm downloads" /></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/badge/node-%3E%3D18-00A79E" alt="Node.js ≥ 18" /></a>
  <a href="https://www.npmjs.com/package/ai-sdk-provider-gemini-cli"><img src="https://img.shields.io/npm/l/ai-sdk-provider-gemini-cli?color=00A79E" alt="License: MIT" /></a>
</p>

# AI SDK Provider for Gemini CLI

A community provider for the [Vercel AI SDK](https://sdk.vercel.ai/docs) that enables using Google's Gemini models through the [@google/gemini-cli-core](https://www.npmjs.com/package/@google/gemini-cli-core) library and Google Cloud Code endpoints.

## Disclaimer

**This is an unofficial community provider** and is not affiliated with or endorsed by Google or Vercel. By using this provider:

- You understand that your data will be sent to Google's servers through the Gemini CLI Core library
- You agree to comply with [Google's Terms of Service](https://policies.google.com/terms)
- You acknowledge this software is provided "as is" without warranties of any kind

Please ensure you have appropriate permissions and comply with all applicable terms when using this provider.

## Features

- 🚀 Compatible with Vercel AI SDK
- ☁️ Uses Google Cloud Code endpoints (https://cloudcode-pa.googleapis.com)
- 🔄 Streaming support for real-time responses
- 🛠️ Tool/function calling capabilities
- 🖼️ Multimodal support (text and base64 images)
- 🔐 OAuth authentication using Gemini CLI credentials
- 📝 TypeScript support with full type safety
- 🎯 Structured object generation with Zod schemas

## Installation

### 1. Install and set up the Gemini CLI

```bash
npm install -g @google/gemini-cli
gemini  # Follow the interactive authentication setup
```

### 2. Add the provider

```bash
npm install ai-sdk-provider-gemini-cli ai
```

## Quick Start

```typescript
import { generateText } from 'ai';
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';

// Create provider with OAuth authentication
const gemini = createGeminiProvider({
  authType: 'oauth-personal',
});

const result = await generateText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Write a haiku about coding',
});

console.log(result.text);
```

## Documentation

- **[Examples](examples/)** - Comprehensive examples demonstrating all features
- **[API Reference](docs/)** - Technical documentation and implementation details
- **[Authentication Guide](docs/gemini-cli-auth-options.md)** - Detailed authentication options

## Examples

The `examples/` directory contains comprehensive examples demonstrating all features:

### Getting Started

- `check-auth.mjs` - Verify your authentication setup
- `basic-usage.mjs` - Simple text generation examples
- `streaming.mjs` - Real-time streaming responses
- `conversation-history.mjs` - Multi-turn conversations

### Advanced Features

- `generate-object-basic.mjs` - Structured output with Zod schemas
- `generate-object-nested.mjs` - Complex nested data structures
- `generate-object-constraints.mjs` - Data validation and constraints
- `system-messages.mjs` - Control model behavior with system prompts
- `error-handling.mjs` - Robust error handling patterns

### Run Examples

```bash
# First build the project
npm run build

# Check authentication
npm run example:check

# Run basic examples
npm run example:basic

# Run all tests
npm run example:test
```

See the [examples README](examples/README.md) for detailed documentation.

## Authentication

The provider uses OAuth authentication with Google Cloud Code endpoints:

### OAuth Authentication (Recommended)

```typescript
const gemini = createGeminiProvider({
  authType: 'oauth-personal',
});
```

This uses your existing Gemini CLI credentials from `~/.gemini/oauth_creds.json`. To set up authentication:

```bash
# Initial setup - follow interactive prompts
gemini

# Or change auth method inside CLI with slash command
/auth
```

### API Key Authentication

```typescript
// Using AI SDK standard auth type (recommended)
const gemini = createGeminiProvider({
  authType: 'api-key',
  apiKey: process.env.GEMINI_API_KEY,
});

// Alternative: Gemini-specific auth type
const gemini = createGeminiProvider({
  authType: 'gemini-api-key',
  apiKey: process.env.GEMINI_API_KEY,
});
```

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey) and set it as an environment variable:

```bash
export GEMINI_API_KEY="your-api-key-here"
```

## Usage Examples

### Text Generation

```typescript
import { generateText } from 'ai';
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';

const gemini = createGeminiProvider({
  authType: 'oauth-personal',
});

const result = await generateText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Explain quantum computing in simple terms',
  maxTokens: 500,
});

console.log(result.text);
console.log(`Tokens used: ${result.usage?.totalTokens}`);
```

### Streaming Responses

```typescript
import { streamText } from 'ai';
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';

const gemini = createGeminiProvider({
  authType: 'oauth-personal',
});

const result = await streamText({
  model: gemini('gemini-2.5-pro'),
  prompt: 'Write a story about a robot learning to paint',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Object Generation (Structured Output)

```typescript
import { generateObject } from 'ai';
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';
import { z } from 'zod';

const gemini = createGeminiProvider({
  authType: 'oauth-personal',
});

const result = await generateObject({
  model: gemini('gemini-2.5-pro'),
  schema: z.object({
    name: z.string().describe('Product name'),
    price: z.number().describe('Price in USD'),
    features: z.array(z.string()).describe('Key features'),
  }),
  prompt: 'Generate a laptop product listing',
});

console.log(result.object);
```

### System Messages

```typescript
import { generateText } from 'ai';
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';

const gemini = createGeminiProvider({
  authType: 'oauth-personal',
});

const result = await generateText({
  model: gemini('gemini-2.5-pro'),
  system: 'You are a helpful coding assistant. Always include code examples.',
  prompt: 'How do I read a file in Node.js?',
});

console.log(result.text);
```

### Conversation History

```typescript
const result = await generateText({
  model: gemini('gemini-2.5-pro'),
  messages: [
    { role: 'user', content: 'My name is Alice' },
    { role: 'assistant', content: 'Nice to meet you, Alice!' },
    { role: 'user', content: 'What is my name?' },
  ],
});

console.log(result.text); // Should mention "Alice"
```

## Supported Models

- **`gemini-2.5-pro`** - Most capable model for complex tasks (64K output tokens)
- **`gemini-2.5-flash`** - Faster model for simpler tasks (64K output tokens)

**Note**: This provider uses Google Cloud Code endpoints, which may have different model availability and rate limits than the direct Gemini API. The provider defaults to 64K output tokens to take full advantage of Gemini 2.5's capabilities.

## Configuration

### Model Settings

```typescript
const model = gemini('gemini-2.5-pro', {
  // Standard AI SDK parameters:
  temperature: 0.7,
  maxTokens: 1000,
  topP: 0.95,
});
```

### Provider Options

```typescript
const gemini = createGeminiProvider({
  authType: 'oauth-personal',
  // Uses ~/.gemini/oauth_creds.json by default
});
```

## Key Features

This provider uses Google's Cloud Code endpoints through the Gemini CLI Core library:

- 🔐 Secure OAuth authentication
- ☁️ Access to Google Cloud Code models
- 🚀 Core Vercel AI SDK features
- 📊 Structured output with JSON schemas
- 🔄 Streaming support for real-time responses

## Limitations

- Requires Node.js ≥ 18
- OAuth authentication requires the Gemini CLI to be installed globally
- Rate limits may vary from the direct Gemini API
- Very strict character length constraints in schemas may be challenging for the model
- Image URLs not supported (use base64-encoded images)
- Some AI SDK parameters not supported: `frequencyPenalty`, `presencePenalty`, `seed`
- Only function tools supported (no provider-defined tools)

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT - see [LICENSE](LICENSE) for details.
