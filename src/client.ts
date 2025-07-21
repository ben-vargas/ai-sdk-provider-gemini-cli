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

  if (options.authType === 'api-key' || options.authType === 'gemini-api-key') {
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

  // Create a minimal config object that implements the required methods
  const configMock = {
    getModel: () => modelId,
    getProxy: () =>
      options.proxy ||
      process.env.HTTP_PROXY ||
      process.env.HTTPS_PROXY ||
      undefined,
  };

  // Create the configuration
  const config = createContentGeneratorConfig(
    configMock as Parameters<typeof createContentGeneratorConfig>[0],
    authType
  );

  // Apply additional configuration based on auth type
  if (
    (options.authType === 'api-key' || options.authType === 'gemini-api-key') &&
    options.apiKey
  ) {
    config.apiKey = options.apiKey;
  } else if (options.authType === 'vertex-ai' && options.vertexAI) {
    config.vertexai = true;
    // Note: Vertex AI project/location configuration might need to be
    // handled through environment variables or other means
  }

  // Create content generator - pass the configMock as the second parameter
  const client = await createContentGenerator(
    config,
    configMock as Parameters<typeof createContentGenerator>[1]
  );

  return { client, config };
}
