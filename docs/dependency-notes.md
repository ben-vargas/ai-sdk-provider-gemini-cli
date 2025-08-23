# Dependency Version Pinning Notes

## @google/gemini-cli-core

**Current Version:** 0.1.22 (EXACT - no caret or tilde)

### Why Exact Version Pinning?

The `@google/gemini-cli-core` package has been introducing breaking changes in patch versions, which violates semantic versioning principles. Examples of breaking changes observed:

### Breaking Changes Timeline

| Version | Release Date | Breaking Changes |
|---------|-------------|------------------|
| 0.1.12 | 2025-07-13 | Baseline version |
| 0.1.13 | 2025-07-19 | Unknown - worked with original code |
| 0.1.14 | 2025-07-25 | Potential breaking changes introduced |
| 0.1.15 | 2025-07-30 | - |
| 0.1.16 | 2025-08-02 | - |
| 0.1.17 | 2025-08-05 | - |
| 0.1.18 | 2025-08-06 | - |
| 0.1.19 | 2025-08-12 | - |
| 0.1.20 | 2025-08-13 | - |
| 0.1.21 | 2025-08-14 | Added telemetry tracking (session events, install IDs) |
| 0.1.22 | 2025-08-18 | Added session ID support |

### Specific Breaking Changes (0.1.13 → 0.1.22)

1. **Config Object Requirements:**
   - Added required `getUsageStatisticsEnabled()` method to config object
   - This method is used for telemetry control (introduced around v0.1.21)

2. **ContentGenerator Method Signatures:**
   - `generateContent()` now requires `userPromptId: string` as second parameter
   - `generateContentStream()` now requires `userPromptId: string` as second parameter
   - These are used for API request logging and telemetry

3. **Factory Function Changes:**
   - `createContentGenerator()` now accepts optional third parameter `sessionId`
   - Used for session tracking (added in v0.1.22)

### Evidence from Source Code

From `google-gemini/gemini-cli` repository, the current implementation shows:
```typescript
// Method calls now require prompt_id
contentGenerator.generateContent(request, prompt_id)
contentGenerator.generateContentStream(request, prompt_id)
```

These changes were made without incrementing the minor or major version, violating semantic versioning where:
- Patch versions (0.0.X) should only contain backwards-compatible bug fixes
- Minor versions (0.X.0) should contain backwards-compatible functionality
- Major versions (X.0.0) should contain breaking changes

### Version Compatibility Matrix

| ai-sdk-provider-gemini-cli | @google/gemini-cli-core | Status |
|---------------------------|------------------------|---------|
| 0.1.0 - 0.1.1            | ~0.1.13                | ❌ Broken with 0.1.22 |
| 0.1.2+                   | 0.1.22 (exact)         | ✅ Working |
| 1.0.0+                   | 0.1.21                 | ❌ Missing 0.1.22 fixes |
| 1.1.0+                   | 0.1.22 (exact)         | ✅ Working |

### Upgrade Strategy

Before upgrading `@google/gemini-cli-core`:

1. Review the changelog for breaking changes (if available)
2. Test thoroughly with the new version
3. Update our code to handle any breaking changes
4. Update this document with new compatibility information
5. Consider maintaining multiple versions if needed for backward compatibility

### Current Implementation: Hybrid Approach

We've implemented a robust hybrid solution that protects against future breaking changes:

#### Phase 1: Core Safety Methods ✅
- Implemented 14 commonly-used config methods with safe defaults
- Covers telemetry, session, debug, and file handling methods
- Provides immediate protection against known breaking changes

#### Phase 2: Proxy Safety Net ✅
- Proxy wrapper catches ALL unknown method calls
- Returns intelligent defaults based on method naming patterns
- Prevents runtime errors from missing methods

#### Phase 3: Debug Logging ✅
- Set `DEBUG=true` environment variable to log unknown method calls
- Helps identify which methods are actually used in practice
- Guides future implementation decisions

### How the Proxy Works

```typescript
// Unknown methods are caught and handled gracefully:
config.getSomeNewMethod() // Returns safe default, logs if DEBUG=true

// Smart defaults based on naming patterns:
- is* methods → false (boolean checks)
- has* methods → false (capability checks)
- get*Enabled/get*Mode methods → false
- get*Registry/get*Client/get*Service methods → undefined  
- get*Config/get*Options methods → {}
- get*Command/get*Path methods → undefined
- All others → undefined
```

### OAuth-Specific Methods

The config includes critical OAuth methods required for LOGIN_WITH_GOOGLE authentication:
- `isBrowserLaunchSuppressed()` → returns `false` (allows browser launch for OAuth flow)

### Benefits

1. **Future-proof**: New methods in gemini-cli-core won't break the integration
2. **Observable**: Debug logging shows what's actually being called
3. **Maintainable**: Only implement methods that are actually used
4. **Safe**: All unknown methods return appropriate defaults

### Recommendation

Until Google/Gemini follows proper semantic versioning:

1. **Keep exact version pinning** - `"0.1.22"` without caret
2. **Monitor debug logs** - Track which methods are actually called
3. **Test thoroughly** before any version updates
4. **Use the Proxy pattern** - Provides safety net for unknown methods

### Related Issues

- Initial compatibility issue discovered: August 2025
- Breaking changes were introduced without major version bump
- No official migration guide provided by Google

### Contact

For questions about version compatibility, please open an issue on the repository.