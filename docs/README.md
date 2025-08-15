# AI SDK Provider for Gemini CLI - Technical Documentation

This directory contains technical documentation for the AI SDK Provider for Gemini CLI implementation.

## AI SDK v5 Documentation

This provider is compatible with Vercel AI SDK v5. For v5-specific documentation, see:

- **[ai-sdk-v5/GUIDE.md](ai-sdk-v5/GUIDE.md)** - Comprehensive usage guide for v5
- **[ai-sdk-v5/BREAKING_CHANGES.md](ai-sdk-v5/BREAKING_CHANGES.md)** - Breaking changes and migration guide from v4
- **[ai-sdk-v5/TROUBLESHOOTING.md](ai-sdk-v5/TROUBLESHOOTING.md)** - Common issues and solutions for v5

## Documentation Overview

### 1. [Project Structure](./project-structure.md)
Complete codebase map showing the organization of source files, examples, and documentation.

### 2. [Authentication Options](./gemini-cli-auth-options.md)
Comprehensive guide to the three authentication methods supported by `@google/gemini-cli-core`:
- OAuth with Google Personal Account (`oauth-personal`)
- Gemini API Key (`gemini-api-key`)
- Vertex AI (`vertex-ai`)

### 3. [Language Model V2 Implementation](./language-model-v2-implementation.md)
Detailed specification of the Vercel AI SDK Language Model V2 interface implementation for v5:
- Core interfaces and types
- Message format specifications
- Tool calling interfaces
- Implementation patterns

### 4. [Tool Schema Mapping](./tool-schema-mapping.md)
Guide for mapping between Vercel AI SDK's tool schemas and Gemini's FunctionDeclaration format:
- Type mapping tables
- Implementation approach
- Unsupported features
- Testing considerations

### 5. [Zod to Gemini Mapping](./zod-to-gemini-mapping.md)
Comprehensive mapping between Zod schemas and Gemini's Schema format:
- Type conversions
- Constraint mappings
- Special case handling
- Implementation guidelines

## Quick Reference

### Authentication Setup
```typescript
// OAuth (default)
const gemini = createGeminiProvider({
  authType: 'oauth-personal'
});

// API Key
const gemini = createGeminiProvider({
  authType: 'gemini-api-key',
  apiKey: process.env.GEMINI_API_KEY
});
```

### Supported Models
- `gemini-2.5-pro` - Most capable model (64K output tokens)
- `gemini-2.5-flash` - Faster, efficient model (64K output tokens)

### Key Features
- ✅ Text generation and streaming
- ✅ System instructions
- ✅ Object generation with Zod schemas
- ✅ Tool calling (function calls)
- ✅ Multimodal inputs (text and images)
- ✅ Conversation history
- ✅ Abort signal support

## Architecture Notes

The provider implements a direct integration with Google's Cloud Code endpoints through the `@google/gemini-cli-core` library. This ensures:
- Native OAuth support with cached credentials
- Direct access to Gemini models
- Optimal performance without intermediate layers
- Full compatibility with Vercel AI SDK v5 patterns

For implementation examples, see the [examples directory](../examples/).