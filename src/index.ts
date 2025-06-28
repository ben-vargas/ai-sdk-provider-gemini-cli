// Main exports
export { createGeminiProvider } from './create-gemini-provider';
export { geminiProvider } from './gemini-provider';

// Type exports
export type { GeminiProvider } from './create-gemini-provider';
export type { GeminiProviderOptions } from './types';

// Legacy compatibility exports (for backward compatibility)
export { createGeminiProvider as createGeminiCliCoreProvider } from './create-gemini-provider';
export type { GeminiProvider as GeminiCliCoreProvider } from './create-gemini-provider';
export type { GeminiProviderOptions as GeminiCliCoreProviderOptions } from './types';

// Re-export types from AI SDK for convenience
export type {
  LanguageModelV1,
  LanguageModelV1FunctionTool,
  LanguageModelV1FunctionToolCall,
  LanguageModelV1FinishReason,
  LanguageModelV1CallOptions,
  LanguageModelV1CallWarning,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
  LanguageModelV1Prompt,
  LanguageModelV1ProviderMetadata,
} from '@ai-sdk/provider';