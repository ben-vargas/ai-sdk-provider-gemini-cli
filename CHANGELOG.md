# Changelog

All notable changes to this project will be documented in this file.

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

[1.0.1]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v1.0.0-beta.1...v1.0.1
[1.0.0-beta.1]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v0.1.1...v1.0.0-beta.1
[0.1.1]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v0.0.4...v0.1.0
[0.0.4]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/releases/tag/v0.0.1
