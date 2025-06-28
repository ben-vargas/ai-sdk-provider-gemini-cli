import { createGeminiProvider } from './create-gemini-provider';

/**
 * Default Gemini provider instance that uses environment variables for configuration.
 * 
 * You can use this directly:
 * ```typescript
 * import { geminiProvider } from 'ai-sdk-provider-gemini-cli';
 * 
 * const model = geminiProvider('gemini-1.5-flash');
 * ```
 * 
 * Or create your own instance with custom settings:
 * ```typescript
 * import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';
 * 
 * const gemini = createGeminiProvider({
 *   authType: 'gemini-api-key',
 *   apiKey: 'your-api-key'
 * });
 * ```
 */
export const geminiProvider = createGeminiProvider({
  authType: 'gemini-api-key',
  apiKey: process.env.GEMINI_API_KEY
});