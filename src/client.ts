import type {
  ContentGenerator,
  ContentGeneratorConfig,
} from '@google/gemini-cli-core';
import {
  createContentGenerator,
  createContentGeneratorConfig,
  AuthType,
} from '@google/gemini-cli-core';
import type { GeminiProviderOptions } from './types';

export interface GeminiClient {
  client: ContentGenerator;
  config: ContentGeneratorConfig;
}

/**
 * Initializes the Gemini client with the provided authentication options
 */
export async function initializeGeminiClient(
  options: GeminiProviderOptions,
  modelId: string
): Promise<GeminiClient> {
  // Map our auth types to Gemini CLI Core auth types
  let authType: AuthType | undefined;

  if (options.authType === 'gemini-api-key') {
    authType = AuthType.USE_GEMINI;
  } else if (options.authType === 'vertex-ai') {
    authType = AuthType.USE_VERTEX_AI;
  } else if (
    options.authType === 'oauth' ||
    options.authType === 'oauth-personal'
  ) {
    authType = AuthType.LOGIN_WITH_GOOGLE;
  } else if (options.authType === 'google-auth-library') {
    // Google Auth Library is not directly supported by AuthType enum
    // We'll need to handle this differently or use a default
    authType = AuthType.USE_GEMINI;
  }

  // Create the configuration
  const config = await createContentGeneratorConfig(modelId, authType);

  // Apply additional configuration based on auth type
  if (options.authType === 'gemini-api-key' && options.apiKey) {
    config.apiKey = options.apiKey;
  } else if (options.authType === 'vertex-ai' && options.vertexAI) {
    config.vertexai = true;
    // Note: Vertex AI project/location configuration might need to be
    // handled through environment variables or other means
  }

  // Create content generator
  const client = await createContentGenerator(config);

  return { client, config };
}
