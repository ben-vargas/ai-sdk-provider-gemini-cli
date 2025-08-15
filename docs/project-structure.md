# Project Structure

This document provides an overview of the ai-sdk-provider-gemini-cli codebase organization.

```
ai-sdk-provider-gemini-cli/
├── src/                                      # Source code
│   ├── index.ts                              # Main exports
│   ├── gemini-provider.ts                    # Provider factory function
│   ├── gemini-language-model.ts              # Core LanguageModelV2 implementation (v5)
│   ├── client.ts                             # Gemini CLI Core client initialization
│   ├── message-mapper.ts                     # Maps AI SDK messages to Gemini format
│   ├── tool-mapper.ts                        # Maps AI SDK tools to Gemini format
│   ├── extract-json.ts                       # JSON extraction from markdown
│   ├── error.ts                              # Error handling and mapping
│   ├── validation.ts                         # Input validation utilities
│   ├── types.ts                              # TypeScript type definitions
│   └── __tests__/                            # Unit tests
│       ├── client.test.ts                    # Client initialization tests
│       ├── error.test.ts                     # Error handling tests
│       ├── extract-json.test.ts              # JSON extraction tests
│       ├── gemini-language-model.test.ts     # Language model tests
│       ├── gemini-provider.test.ts           # Provider creation tests
│       ├── index.test.ts                     # Main exports tests
│       ├── message-mapper.test.ts            # Message mapping tests
│       ├── tool-mapper.test.ts               # Tool mapping tests
│       └── validation.test.ts                # Validation logic tests
│
├── examples/                                 # Usage examples
│   ├── README.md                             # Examples documentation
│   ├── check-auth.mjs                        # Authentication verification
│   ├── basic-usage.mjs                       # Simple text generation
│   ├── streaming.mjs                         # Streaming responses
│   ├── conversation-history.mjs              # Multi-turn conversations
│   ├── system-messages.mjs                   # System prompts
│   ├── custom-config.mjs                     # Provider configuration
│   ├── error-handling.mjs                    # Error handling patterns
│   ├── long-running-tasks.mjs                # Timeout management
│   ├── integration-test.mjs                  # Comprehensive testing
│   └── generate-object-*.mjs                 # Object generation examples
│       ├── basic.mjs                         # Basic object generation
│       ├── nested.mjs                        # Nested structures
│       ├── constraints.mjs                   # Validation constraints
│       └── advanced.mjs                      # Complex real-world examples
│
├── docs/                                     # Technical documentation
│   ├── README.md                             # Documentation index
│   ├── project-structure.md                  # This file
│   ├── gemini-cli-auth-options.md            # Authentication details
│   ├── language-model-v2-implementation.md   # AI SDK v5 interface
│   ├── tool-schema-mapping.md                # Tool schema conversion
│   ├── zod-to-gemini-mapping.md              # Zod to Gemini mapping
│   └── ai-sdk-v5/                            # v5 specific docs
│       ├── BREAKING_CHANGES.md               # Migration guide from v4
│       ├── DEVELOPMENT_STATUS.md             # Current development status
│       ├── GUIDE.md                          # Comprehensive usage guide
│       └── TROUBLESHOOTING.md                # Common issues and solutions
│
├── dist/                                     # Build output (generated)
│   ├── index.js                              # CommonJS bundle
│   ├── index.mjs                             # ES Module bundle
│   ├── index.d.ts                            # TypeScript declarations
│   └── *.map                                 # Source maps
│
├── Configuration Files
│   ├── package.json                          # Project metadata and scripts
│   ├── tsconfig.json                         # TypeScript configuration
│   ├── tsconfig.build.json                   # Build-specific TS config
│   ├── tsup.config.ts                        # Build tool configuration
│   ├── vitest.config.ts                      # Test runner configuration
│   ├── eslint.config.js                      # ESLint configuration (flat config)
│   ├── .gitignore                            # Git ignore patterns
│   ├── .npmignore                            # NPM publish ignore patterns
│   └── .prettierrc                           # Code formatter configuration
│
└── Root Files
    ├── README.md                             # Main project documentation
    ├── CONTRIBUTING.md                       # Contributing guidelines
    └── LICENSE                               # MIT license

```

## Key Components

### Core Implementation (`src/`)

- **Provider Entry Points**
  - `index.ts` - Exports all public APIs
  - `gemini-provider.ts` - Factory function for creating providers

- **Language Model**
  - `gemini-language-model.ts` - Implements Vercel AI SDK's LanguageModelV2 interface for v5
  - Handles both streaming and non-streaming generation
  - Manages authentication and client initialization
  - Supports abort signals (with limitations)

- **Message & Tool Processing**
  - `message-mapper.ts` - Converts AI SDK message format to Gemini format
  - `tool-mapper.ts` - Converts function tools from Zod/JSON Schema to Gemini

- **Utilities**
  - `client.ts` - Initializes Gemini CLI Core with proper auth
  - `extract-json.ts` - Extracts JSON from markdown-wrapped responses
  - `error.ts` - Maps Gemini errors to AI SDK error types
  - `validation.ts` - Validates model IDs and configurations

### Examples (`examples/`)

Organized by complexity and use case:
- **Getting Started**: Authentication, basic usage, streaming
- **Advanced Features**: Object generation, system messages, error handling
- **Testing**: Integration tests covering all features

### Documentation (`docs/`)

Technical documentation covering:
- Authentication options and setup
- Vercel AI SDK interface implementation
- Schema mapping and conversion details
- This project structure guide

## Development Workflow

1. **Source Code**: All TypeScript source in `src/`
2. **Build Output**: Generated in `dist/` via `npm run build`
3. **Examples**: Runnable examples in `examples/`
4. **Testing**: Run examples as integration tests

## Key Design Decisions

- **Minimal Dependencies**: Only essential packages included
- **Direct Integration**: Uses Gemini CLI Core directly without abstraction layers
- **Type Safety**: Full TypeScript support with comprehensive types
- **AI SDK Compatibility**: Implements standard LanguageModelV2 interface for v5
- **OAuth First**: Designed for OAuth authentication via Gemini CLI

## Test Coverage

The project includes comprehensive unit tests covering:
- Provider creation and configuration
- Message and tool mapping
- Error handling and validation
- JSON extraction from responses
- Client initialization
- All core functionality

Current test coverage: ~98.85%