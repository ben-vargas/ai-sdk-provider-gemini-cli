<p align="center">
  <a href="https://www.npmjs.com/package/ai-sdk-provider-gemini-cli"><img src="https://img.shields.io/npm/v/ai-sdk-provider-gemini-cli?color=00A79E" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/ai-sdk-provider-gemini-cli"><img src="https://img.shields.io/npm/dy/ai-sdk-provider-gemini-cli.svg?color=00A79E" alt="npm downloads" /></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/badge/node-%3E%3D20-00A79E" alt="Node.js >= 20" /></a>
  <a href="https://www.npmjs.com/package/ai-sdk-provider-gemini-cli"><img src="https://img.shields.io/npm/l/ai-sdk-provider-gemini-cli?color=00A79E" alt="License: MIT" /></a>
</p>

# AI SDK Provider for Gemini CLI

A community provider for the [Vercel AI SDK](https://sdk.vercel.ai/docs) that enables using Google's Gemini models through [@google/gemini-cli-core](https://www.npmjs.com/package/@google/gemini-cli-core) and Google Cloud Code endpoints.

## Version Compatibility

| Provider Version | AI SDK Version | NPM Tag      | Branch      |
| ---------------- | -------------- | ------------ | ----------- |
| 2.x              | v6             | `latest`     | `main`      |
| 1.x              | v5             | `ai-sdk-v5`  | `ai-sdk-v5` |
| 0.x              | v4             | `ai-sdk-v4`  | `ai-sdk-v4` |

```bash
# AI SDK v6 (default)
npm install ai-sdk-provider-gemini-cli ai

# AI SDK v5
npm install ai-sdk-provider-gemini-cli@ai-sdk-v5 ai@^5.0.0

# AI SDK v4
npm install ai-sdk-provider-gemini-cli@ai-sdk-v4 ai@^4.3.16
```

## Installation

1. Install and authenticate the Gemini CLI:

```bash
npm install -g @google/gemini-cli
gemini  # Follow the interactive authentication setup
```

2. Add the provider to your project:

```bash
npm install ai-sdk-provider-gemini-cli ai
```

## Quick Start

```typescript
import { generateText } from 'ai';
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';

const gemini = createGeminiProvider({
  authType: 'oauth-personal',
});

const result = await generateText({
  model: gemini('gemini-3-pro-preview'),
  prompt: 'Write a haiku about coding',
});

console.log(result.text);
```

## Authentication

### OAuth (Recommended)

Uses credentials from `~/.gemini/oauth_creds.json` created by the Gemini CLI:

```typescript
const gemini = createGeminiProvider({
  authType: 'oauth-personal',
});
```

### API Key

```typescript
const gemini = createGeminiProvider({
  authType: 'api-key',
  apiKey: process.env.GEMINI_API_KEY,
});
```

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey).

## Supported Models

- `gemini-3-pro-preview` - Latest model with enhanced reasoning (Preview)
- `gemini-3-flash-preview` - Fast, efficient model (Preview)
- `gemini-2.5-pro` - Previous generation model (64K output tokens)
- `gemini-2.5-flash` - Previous generation fast model (64K output tokens)

## Features

- Streaming responses
- Tool/function calling
- Structured output with Zod schemas
- Multimodal support (text and base64 images)
- TypeScript support
- Configurable logging

## Configuration

```typescript
const model = gemini('gemini-3-pro-preview', {
  temperature: 0.7,
  maxOutputTokens: 1000,
  topP: 0.95,
});
```

### Logging

```typescript
// Disable logging
const model = gemini('gemini-3-flash-preview', { logger: false });

// Enable verbose debug logging
const model = gemini('gemini-3-flash-preview', { verbose: true });

// Custom logger
const model = gemini('gemini-3-flash-preview', {
  logger: {
    debug: (msg) => myLogger.debug(msg),
    info: (msg) => myLogger.info(msg),
    warn: (msg) => myLogger.warn(msg),
    error: (msg) => myLogger.error(msg),
  },
});
```

## Examples

See the [examples/](examples/) directory for comprehensive examples:

- `check-auth.mjs` - Verify authentication
- `basic-usage.mjs` - Text generation
- `streaming.mjs` - Streaming responses
- `generate-object-basic.mjs` - Structured output with Zod
- `tool-calling.mjs` - Function calling

```bash
npm run build
npm run example:check
npm run example:basic
```

## Breaking Changes

### v2.x (AI SDK v6)

- Provider interface: ProviderV2 → ProviderV3
- Token usage: flat → hierarchical structure
- Warning format: `unsupported-setting` → `unsupported`
- Method rename: `textEmbeddingModel()` → `embeddingModel()`
- Finish reason: string → `{ unified, raw }` object

See [CHANGELOG.md](CHANGELOG.md) for details.

## Limitations

- Requires Node.js >= 20
- OAuth requires global Gemini CLI installation
- Image URLs not supported (use base64)
- Some parameters not supported: `frequencyPenalty`, `presencePenalty`, `seed`
- Abort signals work but underlying requests continue in background

## Disclaimer

This is an unofficial community provider, not affiliated with Google or Vercel. Your data is sent to Google's servers. See [Google's Terms of Service](https://policies.google.com/terms).

## License

MIT
