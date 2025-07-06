import type { ProviderV1 } from '@ai-sdk/provider';
import { GeminiLanguageModel } from './gemini-language-model';
import type { GeminiProviderOptions } from './types';
import { validateAuthOptions } from './validation';

export interface GeminiProvider extends ProviderV1 {
  (modelId: string, settings?: Record<string, unknown>): GeminiLanguageModel;
  languageModel(
    modelId: string,
    settings?: Record<string, unknown>
  ): GeminiLanguageModel;
  chat(
    modelId: string,
    settings?: Record<string, unknown>
  ): GeminiLanguageModel;
}

/**
 * Creates a new Gemini provider instance.
 *
 * @param options - Configuration options for the provider
 * @returns A configured provider function
 * @throws Error if authentication options are invalid
 *
 * @example
 * ```typescript
 * // Using API key authentication
 * const gemini = createGeminiProvider({
 *   authType: 'gemini-api-key',
 *   apiKey: process.env.GEMINI_API_KEY
 * });
 *
 * // Use with Vercel AI SDK
 * const model = gemini('gemini-1.5-flash');
 * const result = await generateText({
 *   model,
 *   prompt: 'Hello, world!'
 * });
 * ```
 */
export function createGeminiProvider(
  options: GeminiProviderOptions = {}
): GeminiProvider {
  // Validate authentication options
  const validatedOptions = validateAuthOptions(options);

  // Create the language model factory function
  const createLanguageModel = (
    modelId: string,
    settings?: Record<string, unknown>
  ) => {
    return new GeminiLanguageModel({
      modelId,
      providerOptions: validatedOptions,
      settings,
    });
  };

  // Create the provider function
  const provider = function (
    modelId: string,
    settings?: Record<string, unknown>
  ) {
    if (new.target) {
      throw new Error(
        'The provider function cannot be called with the new keyword.'
      );
    }

    return createLanguageModel(modelId, settings);
  } as GeminiProvider;

  // Attach methods
  provider.languageModel = createLanguageModel;
  provider.chat = createLanguageModel;

  return provider;
}
