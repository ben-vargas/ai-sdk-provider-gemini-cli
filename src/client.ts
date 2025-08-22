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

  // Phase 1: Core config methods with safe defaults
  const baseConfig = {
    // Required methods (currently working)
    getModel: () => modelId,
    getProxy: () =>
      options.proxy ||
      process.env.HTTP_PROXY ||
      process.env.HTTPS_PROXY ||
      undefined,
    getUsageStatisticsEnabled: () => false, // Disable telemetry by default
    getContentGeneratorConfig: () => ({
      authType: authType as string | undefined,
      model: modelId,
      apiKey: (options as any).apiKey as string | undefined,
      vertexai: options.authType === 'vertex-ai' ? true : undefined,
      proxy: options.proxy,
    }),

    // Core safety methods - most likely to be called
    getSessionId: () => undefined,
    getDebugMode: () => false,
    getTelemetryEnabled: () => false,
    getTargetDir: () => process.cwd(),
    getFullContext: () => false,
    getIdeMode: () => false,
    getCoreTools: () => [],
    getExcludeTools: () => [],
    getMaxSessionTurns: () => 100,
    getFileFilteringRespectGitIgnore: () => true,
  };

  // Phase 2: Proxy wrapper to catch any unknown method calls
  const configMock = new Proxy(baseConfig, {
    get(target, prop) {
      if (prop in target) {
        return target[prop as keyof typeof target];
      }

      // Log unknown method calls (helps identify what else might be needed)
      if (typeof prop === 'string' && prop.startsWith('get')) {
        if (process.env.DEBUG) {
          console.warn(
            `[ai-sdk-provider-gemini-cli] Unknown config method called: ${prop}()`
          );
        }

        // Return safe defaults for unknown getters
        return () => {
          // Return undefined for most unknown methods (safest default)
          // Could enhance this with smarter defaults based on method name
          if (prop.includes('Enabled') || prop.includes('Mode')) {
            return false; // Booleans default to false
          }
          if (
            prop.includes('Registry') ||
            prop.includes('Client') ||
            prop.includes('Service')
          ) {
            return undefined; // Objects/services default to undefined
          }
          if (prop.includes('Config') || prop.includes('Options')) {
            return {}; // Config objects default to empty
          }
          if (prop.includes('Command') || prop.includes('Path')) {
            return undefined; // Strings default to undefined
          }
          return undefined; // Default fallback
        };
      }

      return undefined;
    },
  });

  // Create the configuration
  const config = createContentGeneratorConfig(
    configMock as unknown as Parameters<typeof createContentGeneratorConfig>[0],
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

  // Create content generator - pass the configMock as the second parameter and optional sessionId
  const client = await createContentGenerator(
    config,
    configMock as unknown as Parameters<typeof createContentGenerator>[1],
    undefined // Optional sessionId parameter
  );

  return { client, config };
}
