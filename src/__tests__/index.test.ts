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
    it('should re-export LanguageModelV3 type', () => {
      type _TestType = index.LanguageModelV3;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV3FunctionTool type', () => {
      type _TestType = index.LanguageModelV3FunctionTool;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV3ToolCall type', () => {
      type _TestType = index.LanguageModelV3ToolCall;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV3FinishReason type', () => {
      type _TestType = index.LanguageModelV3FinishReason;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV3CallOptions type', () => {
      type _TestType = index.LanguageModelV3CallOptions;
      expect(true).toBe(true);
    });

    it('should re-export SharedV3Warning type', () => {
      type _TestType = index.SharedV3Warning;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV3StreamPart type', () => {
      type _TestType = index.LanguageModelV3StreamPart;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV3Content type', () => {
      type _TestType = index.LanguageModelV3Content;
      expect(true).toBe(true);
    });

    it('should re-export LanguageModelV3Usage type', () => {
      type _TestType = index.LanguageModelV3Usage;
      expect(true).toBe(true);
    });

    it('should re-export ProviderV3 type', () => {
      type _TestType = index.ProviderV3;
      expect(true).toBe(true);
    });
  });

  describe('thinkingConfig exports', () => {
    it('should export ThinkingLevel enum', () => {
      expect(index.ThinkingLevel).toBeDefined();
      expect(index.ThinkingLevel.LOW).toBe('LOW');
      expect(index.ThinkingLevel.MEDIUM).toBe('MEDIUM');
      expect(index.ThinkingLevel.HIGH).toBe('HIGH');
      expect(index.ThinkingLevel.MINIMAL).toBe('MINIMAL');
    });

    it('should export ThinkingConfigInput type', () => {
      // TypeScript type exports are compile-time only
      type _TestType = index.ThinkingConfigInput;
      // This test passes if TypeScript compilation succeeds
      expect(true).toBe(true);
    });
  });

  describe('export completeness', () => {
    it('should export all expected named exports', () => {
      const expectedFunctionExports = [
        'createGeminiProvider',
        'createGeminiCliCoreProvider', // legacy alias
      ];

      const actualFunctionExports = Object.keys(index).filter(
        (key) => typeof (index as any)[key] === 'function'
      );

      for (const expectedExport of expectedFunctionExports) {
        expect(actualFunctionExports).toContain(expectedExport);
      }

      // Also verify ThinkingLevel enum is exported
      expect(index.ThinkingLevel).toBeDefined();
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
