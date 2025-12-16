import type {
  ProviderV3,
  LanguageModelV3,
  EmbeddingModelV3,
  ImageModelV3,
} from '@ai-sdk/provider';
import { NoSuchModelError } from '@ai-sdk/provider';
import { GeminiLanguageModel } from './gemini-language-model';
import type { GeminiProviderOptions } from './types';
import { validateAuthOptions } from './validation';

export interface GeminiProvider extends ProviderV3 {
  (modelId: string, settings?: Record<string, unknown>): LanguageModelV3;
  languageModel(
    modelId: string,
    settings?: Record<string, unknown>
  ): LanguageModelV3;
  chat(modelId: string, settings?: Record<string, unknown>): LanguageModelV3;
  embeddingModel(modelId: string): EmbeddingModelV3;
  imageModel(modelId: string): ImageModelV3;
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
      settings: {
        maxOutputTokens: 65536, // 64K output tokens for Gemini 2.5 models
        ...settings,
      },
    });
  };

  // Create the provider function
  const provider = Object.assign(
    function (modelId: string, settings?: Record<string, unknown>) {
      if (new.target) {
        throw new Error(
          'The provider function cannot be called with the new keyword.'
        );
      }

      return createLanguageModel(modelId, settings);
    },
    {
      specificationVersion: 'v3' as const,
      languageModel: createLanguageModel,
      chat: createLanguageModel,
      embeddingModel: (modelId: string): never => {
        throw new NoSuchModelError({
          modelId,
          modelType: 'embeddingModel',
          message: `Gemini provider does not support embedding models.`,
        });
      },
      imageModel: (modelId: string): never => {
        throw new NoSuchModelError({
          modelId,
          modelType: 'imageModel',
          message: `Gemini provider does not support image models.`,
        });
      },
    }
  ) as GeminiProvider;

  return provider;
}
