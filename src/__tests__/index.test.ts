import { describe, it, expect } from 'vitest';
import * as index from '../index';
import { createGeminiProvider } from '../gemini-provider';

describe('index exports', () => {
  describe('main exports', () => {
    it('should export createGeminiProvider function', () => {
      expect(index.createGeminiProvider).toBeDefined();
      expect(typeof index.createGeminiProvider).toBe('function');
      expect(index.createGeminiProvider).toBe(createGeminiProvider);
    });

    it('should export GeminiProvider type', () => {
      // TypeScript type exports are compile-time only, but we can verify the export exists
      // by checking that TypeScript doesn't complain when we import it
      type _TestProvider = index.GeminiProvider;
      // This test passes if TypeScript compilation succeeds
      expect(true).toBe(true);
    });

    it('should export GeminiProviderOptions type', () => {
      // TypeScript type exports are compile-time only
      type _TestOptions = index.GeminiProviderOptions;
      // This test passes if TypeScript compilation succeeds
      expect(true).toBe(true);
    });
  });

  describe('legacy compatibility exports', () => {
    it('should export createGeminiCliCoreProvider as alias for createGeminiProvider', () => {
      expect(index.createGeminiCliCoreProvider).toBeDefined();
      expect(index.createGeminiCliCoreProvider).toBe(
        index.createGeminiProvider
      );
      expect(index.createGeminiCliCoreProvider).toBe(createGeminiProvider);
    });

    it('should export GeminiCliCoreProvider type', () => {
      // TypeScript type exports are compile-time only
      type _TestProvider = index.GeminiCliCoreProvider;
      // This test passes if TypeScript compilation succeeds
      expect(true).toBe(true);
    });

    it('should export GeminiCliCoreProviderOptions type', () => {
      // TypeScript type exports are compile-time only
      type _TestOptions = index.GeminiCliCoreProviderOptions;
      // This test passes if TypeScript compilation succeeds
      expect(true).toBe(true);
    });
  });

  describe('AI SDK type re-exports', () => {
    it('should re-export LanguageModelV1 type', () => {
      type _TestType = index.LanguageModelV1;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV1FunctionTool type', () => {
      type _TestType = index.LanguageModelV1FunctionTool;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV1FunctionToolCall type', () => {
      type _TestType = index.LanguageModelV1FunctionToolCall;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV1FinishReason type', () => {
      type _TestType = index.LanguageModelV1FinishReason;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV1CallOptions type', () => {
      type _TestType = index.LanguageModelV1CallOptions;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV1CallWarning type', () => {
      type _TestType = index.LanguageModelV1CallWarning;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV1StreamPart type', () => {
      type _TestType = index.LanguageModelV1StreamPart;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV1Message type', () => {
      type _TestType = index.LanguageModelV1Message;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV1Prompt type', () => {
      type _TestType = index.LanguageModelV1Prompt;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV1ProviderMetadata type', () => {
      type _TestType = index.LanguageModelV1ProviderMetadata;
      expect(true).toBe(true);
    });
  });

  describe('export completeness', () => {
    it('should export all expected named exports', () => {
      const expectedExports = [
        'createGeminiProvider',
        'createGeminiCliCoreProvider', // legacy alias
      ];

      const actualExports = Object.keys(index).filter(
        (key) => typeof (index as any)[key] === 'function'
      );

      for (const expectedExport of expectedExports) {
        expect(actualExports).toContain(expectedExport);
      }
    });

    it('should not have any default export', () => {
      // The module doesn't export default, only named exports
      expect((index as any).default).toBeUndefined();
    });
  });

  describe('backwards compatibility', () => {
    it('should maintain backwards compatibility for renamed exports', () => {
      // Ensure legacy names still work
      const provider1 = index.createGeminiProvider({});
      const provider2 = index.createGeminiCliCoreProvider({});

      // Both should create the same type of object
      expect(provider1.constructor).toBe(provider2.constructor);
    });
  });

  describe('type safety', () => {
    it('should accept valid provider options', () => {
      // This test verifies that the type exports are working correctly
      const validOptions: index.GeminiProviderOptions = {
        authType: 'oauth-personal',
      };

      const provider = index.createGeminiProvider(validOptions);
      expect(provider).toBeDefined();
    });

    it('should accept legacy provider options type', () => {
      // This test verifies that the legacy type exports are working correctly
      const validOptions: index.GeminiCliCoreProviderOptions = {
        authType: 'api-key',
        apiKey: 'test-key',
      };

      const provider = index.createGeminiCliCoreProvider(validOptions);
      expect(provider).toBeDefined();
    });
  });
});
