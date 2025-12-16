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
  LanguageModelV3,
  LanguageModelV3FunctionTool,
  LanguageModelV3ToolCall,
  LanguageModelV3FinishReason,
  LanguageModelV3CallOptions,
  SharedV3Warning,
  LanguageModelV3StreamPart,
  LanguageModelV3Content,
  LanguageModelV3Usage,
  ProviderV3,
} from '@ai-sdk/provider';
