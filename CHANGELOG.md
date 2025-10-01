# Changelog

All notable changes to this project will be documented in this file.

## [0.1.4] - 2025-10-01

### Added

- **ToolChoice Support**: Complete implementation of AI SDK toolChoice functionality (backported from v5)
  - Added `mapGeminiToolConfig()` function to convert AI SDK toolChoice to Gemini format
  - Proper `allowedFunctionNames` mapping when specific tool is forced
  - Support for all toolChoice types: `auto`, `none`, `required`, `tool`
  - Streaming parity: Added `toolConfig` to both `doGenerate` and `doStream` methods
- **Test Coverage**: Added 5 comprehensive tests for `mapGeminiToolConfig` covering all toolChoice scenarios
- **Zod v4 Compatibility**: Enhanced Zod schema handling
  - Added `convertZodToJsonSchema()` function with fallback support
  - Tries Zod v4's native `toJSONSchema()` first, then falls back to `zod-to-json-schema` library
  - Graceful handling for both Zod v3 and v4

### Changed

- **Import Style**: Enhanced import organization with inline `type` modifiers for type-only imports (better tree-shaking)

### Technical Details

- Backported features from v5 (v1.1.2) to AI SDK v4 compatible branch
- AI SDK v4 uses `LanguageModelV1` while maintaining same functionality
- All tests passing with AI SDK v4 types
- No breaking changes - fully backward compatible

## [0.1.3] - 2025-08-26

### Fixed

- **OAuth and Session Tracking**: Enhanced compatibility with `@google/gemini-cli-core` 0.1.22
  - Fixed session tracking with proper OAuth client detection
  - Improved hybrid config handling with Proxy safety net
  - Better error handling for configuration edge cases
- **Configuration System**: Complete overhaul for reliability
  - Proxy configuration now serves as safety net for direct client detection
  - Improved OAuth detection and fallback mechanisms
  - Enhanced session tracking for better request correlation

### Added

- **Session Management**: Added automatic session tracking for all requests
  - Each request gets a unique `userPromptId` for better tracing
  - Improved debugging and error tracking capabilities
- **Comprehensive Testing**: Extensive test coverage for configuration scenarios

### Changed

- **Dependency Update**: Updated `@google/gemini-cli-core` to 0.1.22
  - Incorporates upstream fixes and improvements
  - Better OAuth and proxy support

## [0.1.2] - 2025-08-20

### Fixed

- Initial compatibility fixes with `@google/gemini-cli-core` 0.1.12+
  - Updated to handle breaking changes in gemini-cli-core API
  - Fixed configuration initialization

## [0.1.1] - 2025-08-15

### Changed

- Initial release for AI SDK v4 compatibility branch
- Full support for AI SDK v4 `LanguageModelV1` interface

## [0.1.0] - 2025-08-01

### Added

- Initial release of AI SDK provider for Google Gemini using CLI/SDK
- Support for text generation and streaming
- Tool/function calling support
- Object generation with JSON schemas
- Conversation history management
- Image/multimodal support
