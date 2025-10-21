// Main exports
export { createGeminiProvider } from './gemini-provider';

// Type exports
export type { GeminiProvider } from './gemini-provider';
export type { GeminiProviderOptions, Logger } from './types';

// Legacy compatibility exports (for backward compatibility)
export { createGeminiProvider as createGeminiCliCoreProvider } from './gemini-provider';
export type { GeminiProvider as GeminiCliCoreProvider } from './gemini-provider';
export type { GeminiProviderOptions as GeminiCliCoreProviderOptions } from './types';

// Re-export types from AI SDK for convenience
export type {
  LanguageModelV2,
  LanguageModelV2FunctionTool,
  LanguageModelV2ToolCall,
  LanguageModelV2FinishReason,
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2StreamPart,
  LanguageModelV2Content,
  LanguageModelV2Usage,
  ProviderV2,
} from '@ai-sdk/provider';
