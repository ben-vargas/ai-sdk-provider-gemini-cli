import type {
  ProviderV2,
  LanguageModelV2,
  EmbeddingModelV2,
  ImageModelV2,
} from '@ai-sdk/provider';
import { NoSuchModelError } from '@ai-sdk/provider';
import { GeminiLanguageModel } from './gemini-language-model';
import type { GeminiProviderOptions } from './types';
import { validateAuthOptions } from './validation';

export interface GeminiProvider extends ProviderV2 {
  (modelId: string, settings?: Record<string, unknown>): LanguageModelV2;
  languageModel(
    modelId: string,
    settings?: Record<string, unknown>
  ): LanguageModelV2;
  chat(modelId: string, settings?: Record<string, unknown>): LanguageModelV2;
  textEmbeddingModel(modelId: string): EmbeddingModelV2<string>;
  imageModel(modelId: string): ImageModelV2;
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
      languageModel: createLanguageModel,
      chat: createLanguageModel,
      textEmbeddingModel: (modelId: string): never => {
        throw new NoSuchModelError({
          modelId,
          modelType: 'textEmbeddingModel',
          message: `Gemini provider does not support text embedding models.`,
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
