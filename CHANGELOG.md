# Changelog

All notable changes to this project will be documented in this file.

## [1.5.0] - 2025-12-11

### Added

- **Multimodal File Support**: Extended file input support beyond images (#27, thanks @kaiinui)
  - PDF documents (`application/pdf`)
  - Audio files (`audio/*` - mp3, wav, flac, etc.)
  - Video files (`video/*` - mp4, webm, mov, etc.)
  - All file types supported by the underlying Gemini API are now accessible

### Changed

- Renamed internal `mapImagePart` to `mapFilePart` to reflect broader file type support
- Updated error messages from "image" to "file" terminology for consistency

### Technical Details

- File handling uses the same `inlineData` format with base64 encoding
- URL-based files remain unsupported (base64-encoded data required)
- All 178 tests passing

## [1.4.1] - 2025-12-10

### Changed

- **Dependency Updates** (aligned with @google/gemini-cli-core 0.20.0):
  - `@google/gemini-cli-core`: 0.17.1 → 0.20.0
  - `@google/genai`: 1.16.0 → 1.30.0

### Fixed

- **Config Proxy Compatibility**: Added support for new 0.20.0 configuration methods to maintain compatibility:
  - `getContextManager()`, `getGlobalMemory()`, `getEnvironmentMemory()` - JIT context support
  - `getHookSystem()` - Hook execution system
  - `getModelAvailabilityService()` - Policy-driven model routing (replaces `getUseModelRouter`)
  - `getShellToolInactivityTimeout()` - Shell command timeout
  - `getExperimentsAsync()` - Experimental features

- **Proxy Handler**: Enhanced fallback handling for `Manager`, `Memory`, and `Timeout` method patterns

## [1.4.0] - 2025-11-23

### Added

- **Native Structured Output Support**: Implemented native `responseJsonSchema` support for Gemini API
  - Enables `supportsStructuredOutputs = true` for improved AI SDK integration
  - Schema is now passed directly to Gemini API via `responseJsonSchema` in generation config
  - Provides cleaner, more reliable JSON output without post-processing

- **JSON Without Schema Handling**: Graceful downgrade when JSON format is requested without a schema
  - Emits `unsupported-setting` warning to inform users
  - Downgrades to `text/plain` response format (prevents fenced/raw JSON leaking)
  - Aligns with Claude-code provider behavior for cross-provider consistency
  - Works in both streaming and non-streaming modes

### Changed

- **Dependency Updates** (aligned with @google/gemini-cli-core 0.17.1):
  - `@ai-sdk/provider-utils`: 3.0.3 → 3.0.17
  - `@google/gemini-cli-core`: 0.16.0 → 0.17.1
  - `@google/genai`: 1.14.0 → 1.16.0 (aligned with gemini-cli-core)
  - `google-auth-library`: 10.2.1 → ^9.11.0 (aligned with gemini-cli-core)
  - `zod-to-json-schema`: 3.24.6 → 3.25.0

### Removed

- **Prompt-based Schema Injection**: Removed workaround that injected schema instructions into user prompts
  - No longer needed with native `responseJsonSchema` support
- **JSON Extraction Utility**: Removed `extract-json.ts` and related post-processing
  - Gemini now returns clean JSON directly when schema is provided

### Technical Details

- Streaming now outputs JSON chunks directly without accumulation
- Simplified codebase with shared `prepareGenerationConfig` helper for consistent behavior
- Tests updated to use JSON Schema objects instead of Zod schemas (matching what AI SDK passes to providers)
- All 175 tests passing (including new no-schema downgrade tests)

## [1.3.0] - 2025-11-18

### Added

- **Support for Gemini 3**: Added support for `gemini-3-pro-preview` model
- **Dependency Update**: Updated `@google/gemini-cli-core` to `0.16.0` (pinned)
- **Security Updates**: Updated dev dependencies (Vite 6, Vitest 4) to resolve security vulnerabilities

### Changed

- **Node.js Requirement**: Updated engine requirement to `node >= 20` to align with `@google/gemini-cli-core` v0.16.0
- **CI/CD**: Removed Node 18 from CI matrix

### Fixed

- **Async Configuration**: Fixed compatibility with `gemini-cli-core` v0.16.0 async configuration loading
- **Example Compatibility**: Ensured core health-check examples (`check-auth.mjs`, `integration-test.mjs`) use GA models (`gemini-2.5-pro`) for broader compatibility

## [1.2.0] - 2025-10-21

### Added

- **Comprehensive debug logging and verbose mode** - Enhanced logging capabilities for better debugging and troubleshooting
  - Added `debug` and `info` log levels to complement existing `warn` and `error` levels
  - New `verbose` setting to control debug/info logging visibility
  - Detailed execution tracing including request/response flow, token usage, and timing information
  - `createVerboseLogger()` utility that filters debug/info logs based on verbose mode
  - When `verbose: false` (default), only `warn` and `error` messages are logged
  - When `verbose: true`, all log levels including `debug` and `info` are logged
  - Comprehensive test coverage for all logging scenarios and custom logger implementations

### Changed

- **Logger Interface**: Extended the `Logger` interface from 2 methods to 4 methods
  - Added `debug(message: string): void` - for detailed execution tracing (verbose mode only)
  - Added `info(message: string): void` - for general flow information (verbose mode only)
  - Existing `warn(message: string): void` - for warnings (always shown)
  - Existing `error(message: string): void` - for errors (always shown)
- **Settings**: Added optional `logger` and `verbose` settings to model configuration
  - `logger`: `Logger | false | undefined` - custom logger, disabled, or default console
  - `verbose`: `boolean` - enable/disable debug and info logging (default: false)

### Migration for custom logger users

**Who is affected:** Only users with custom `Logger` implementations.

**What changed:** The `Logger` interface now requires 4 methods instead of 2:

```typescript
// Before (v1.1.2 and earlier) - if you had a custom logger
const logger = {
  warn: (msg) => myLogger.warn(msg),
  error: (msg) => myLogger.error(msg),
};

// After (v1.2.0+)
const logger = {
  debug: (msg) => myLogger.debug(msg), // Add this
  info: (msg) => myLogger.info(msg), // Add this
  warn: (msg) => myLogger.warn(msg),
  error: (msg) => myLogger.error(msg),
};
```

**Most users are unaffected:**

- Users without a custom logger (using default `console`) - no changes needed
- Users with `logger: false` - no changes needed
- The default logger automatically handles all log levels

### Example Usage

```typescript
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';

// Enable verbose logging for debugging
const gemini = createGeminiProvider({
  authType: 'gemini-api-key',
  apiKey: process.env.GEMINI_API_KEY,
});

const model = gemini('gemini-2.5-flash', {
  verbose: true, // Enable debug and info logging
});

// Use with custom logger
const modelWithCustomLogger = gemini('gemini-2.5-flash', {
  verbose: true,
  logger: {
    debug: (msg) => console.log(`[DEBUG] ${msg}`),
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
  },
});
```

## [1.1.2] - 2025-10-01

### Fixed

- **Multimodal Support**: Fixed image handling crash due to AI SDK v5 API change
  - Updated `LanguageModelV2FilePart` property from `contentType` to `mediaType`
  - Resolves critical issue preventing image attachments from working
- **Import Style**: Changed to use `import type` for type-only imports for better tree-shaking

### Added

- **ToolChoice Support**: Complete implementation of AI SDK toolChoice functionality
  - Added `mapGeminiToolConfig()` function to convert AI SDK toolChoice to Gemini format
  - Proper `allowedFunctionNames` mapping when specific tool is forced
  - Support for all toolChoice types: `auto`, `none`, `required`, `tool`
- **Streaming Parity**: Added `toolConfig` to both `doGenerate` and `doStream` methods
- **Test Coverage**: Added 5 comprehensive tests for `mapGeminiToolConfig` covering all toolChoice scenarios

### Changed

- **Dependency Update**: Updated `@google/gemini-cli-core` from 0.1.22 to 0.6.1
  - Fully tested for backward compatibility
  - All 205 tests passing
  - All 12 examples verified working

### Technical Details

- Combines fixes from community PRs #16 (multimodal crash) and #17 (toolChoice support)
- Enhanced with additional refinements, streaming parity, and comprehensive testing
- No breaking changes - fully backward compatible

## [1.1.1] - 2025-08-22

### Fixed

- **Critical OAuth Fix**: Added `isBrowserLaunchSuppressed()` config method to prevent crashes during OAuth authentication (LOGIN_WITH_GOOGLE)
- **Compatibility**: Full compatibility with @google/gemini-cli-core@0.1.22
  - Updated `generateContent` and `generateContentStream` to use UUID for `userPromptId` parameter
  - Added third `sessionId` parameter to `createContentGenerator` call
  - Pinned exact version `0.1.22` to prevent breaking changes from patch updates

### Added

- **Robust Proxy Pattern**: Enhanced config Proxy to handle multiple method patterns
  - Supports `is*` methods (return false by default)
  - Supports `has*` methods (return false by default)
  - Existing `get*` methods with intelligent defaults based on naming
- **Session Management**: Generate and cache stable session ID per provider instance for better telemetry correlation
- **Comprehensive Documentation**: Added `docs/dependency-notes.md` explaining version pinning rationale and Proxy implementation

### Changed

- Improved type consistency for `authType` in config object
- Updated tests to cover OAuth methods and Proxy behavior

## [1.1.0] - 2025-08-18

### Added

- **Zod 4 Compatibility**: Added support for Zod v4 while maintaining backward compatibility with Zod v3
  - Runtime detection automatically uses the appropriate conversion method
  - Zod v3: Uses `zod-to-json-schema` package
  - Zod v4: Uses native `z.toJSONSchema()` function
  - Both versions listed in peerDependencies: `"^3.0.0 || ^4.0.0"`

### Changed

- Moved `zod` from dependencies to devDependencies to allow users to choose their version
- Updated tool mapping to handle different JSON Schema outputs between Zod versions
  - Union types: Arrays in v3 vs `anyOf` in v4

### Technical Details

- Added `convertZodToJsonSchema` function for runtime version detection
- Tests updated to handle both Zod v3 and v4 union type representations
- Maintained full compatibility with existing API

## [1.0.1] - 2025-08-15

### Changed

- **Stable Release**: Vercel AI SDK v5 is now stable (no longer beta)
- Updated all references from "v5-beta" to "v5"
- Package marked as stable release

### Fixed

- Improved documentation clarity for abort signal limitations
- Updated examples to reflect stable v5 API

### Notes

This is the stable release of v1.0.0-beta.1 with Vercel AI SDK v5 now being officially stable. No breaking changes from v1.0.0-beta.1.

## [1.0.0-beta.1] - 2025-07-24

### BREAKING CHANGES

This version is compatible with Vercel AI SDK v5. For v4 compatibility, please use version 0.x.x.

### Changed

- **Provider Interface**: Migrated from `ProviderV1` to `ProviderV2` interface
  - Updated `createGeminiProvider()` to return `ProviderV2` interface
  - Provider now extends ProviderV2 base class

- **Language Model**: Migrated from `LanguageModelV1` to `LanguageModelV2` interface
  - Changed `specificationVersion` from 'v1' to 'v2'
  - Updated response format to use v5 patterns
  - Improved streaming implementation with promise-based responses

- **Message Format**: Updated to v5 message format
  - Messages now use `ModelMessage` types from v5
  - Tool results integrated into message flow
  - System messages properly supported

- **Response Format**: Updated response structure
  - Streaming now returns promise with stream properties
  - Direct access to `result.text` and `result.usage`
  - Improved token usage tracking

- **Parameter Changes**: Updated parameter names
  - `maxTokens` → `maxOutputTokens` in generation options
  - Token usage: `promptTokens` → `inputTokens`, `completionTokens` → `outputTokens`

- **Error Handling**: Enhanced error handling
  - Proper AbortError support for AI SDK retry logic
  - Better error mapping from Gemini errors
  - Safety status mapping for blocked content

### Added

- Comprehensive abort signal support (with documented limitations)
- New documentation structure in `docs/ai-sdk-v5/`
  - BREAKING_CHANGES.md - Migration guide
  - GUIDE.md - Comprehensive usage guide
  - TROUBLESHOOTING.md - Common issues and solutions
  - DEVELOPMENT_STATUS.md - Implementation status

### Fixed

- System message implementation now works correctly
- Error handling for "Failed after 3 attempts" issue
- Stream error simulation in examples
- Progress indicators in long-running tasks example

### Known Issues

- Abort signals work but underlying gemini-cli-core doesn't support request cancellation
- maxOutputTokens may cause empty responses with gemini-2.5-pro
- Schema validation errors show misleading "could not parse" messages

## [0.1.1] - 2025-01-20

### Added

- Compatibility with gemini-cli-core 0.1.12+ breaking changes
- Comprehensive test suite with 98.85% coverage
- GitHub Actions for automated testing

### Fixed

- Authentication type handling for new gemini-cli-core API
- Error messages and types alignment

## [0.1.0] - 2025-01-15

### Added

- Full support for Vercel AI SDK v4
- OAuth authentication via Gemini CLI
- API key authentication support
- Comprehensive examples directory
- Tool/function calling support
- Multimodal support (text and images)
- Streaming responses

### Changed

- Stable API for v4 compatibility
- Improved error handling
- Better TypeScript types

## [0.0.4] - 2025-01-10

### Fixed

- Authentication configuration issues
- Type definition exports

## [0.0.3] - 2025-01-05

### Added

- System message support
- Object generation with Zod schemas
- More comprehensive examples

### Fixed

- Message mapping for complex conversations

## [0.0.2] - 2025-06-28

### BREAKING CHANGES

- Removed pre-configured geminiProvider export
- Users must now use createGeminiProvider() to create provider instances

### Added

- ESLint with modern flat config and TypeScript support
- Vitest test suite with initial tests
- Test coverage reporting (31.69% initial coverage)
- Alpha warning badge to README

### Changed

- Simplified provider structure
- Improved type safety throughout codebase

### Fixed

- TypeScript strict mode compliance issues

## [0.0.1] - 2025-06-25

### Added

- Initial release
- Basic text generation support
- OAuth authentication via Gemini CLI
- Streaming support
- Basic error handling

[1.1.1]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v1.0.0-beta.1...v1.0.1
[1.0.0-beta.1]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v0.1.1...v1.0.0-beta.1
[0.1.1]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v0.0.4...v0.1.0
[0.0.4]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/releases/tag/v0.0.1
