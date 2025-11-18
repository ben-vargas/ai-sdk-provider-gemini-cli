import { randomUUID } from 'node:crypto';
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
  sessionId: string;
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

  // Generate a stable session ID for this provider instance
  const sessionId = randomUUID();

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
      authType: authType, // Keep as AuthType | undefined for consistency
      model: modelId,
      apiKey: 'apiKey' in options ? options.apiKey : undefined,
      vertexai: options.authType === 'vertex-ai' ? true : undefined,
      proxy: options.proxy,
    }),

    // Core safety methods - most likely to be called
    getSessionId: () => sessionId,
    getDebugMode: () => false,
    getTelemetryEnabled: () => false,
    getTargetDir: () => process.cwd(),
    getFullContext: () => false,
    getIdeMode: () => false,
    getCoreTools: () => [],
    getExcludeTools: () => [],
    getMaxSessionTurns: () => 100,
    getFileFilteringRespectGitIgnore: () => true,

    // OAuth-specific methods (required for LOGIN_WITH_GOOGLE auth)
    isBrowserLaunchSuppressed: () => false, // Allow browser launch for OAuth flow
  };

  // Phase 2: Proxy wrapper to catch any unknown method calls
  const configMock = new Proxy(baseConfig, {
    get(target, prop) {
      if (prop in target) {
        return target[prop as keyof typeof target];
      }

      // Log unknown method calls (helps identify what else might be needed)
      if (typeof prop === 'string') {
        // Handle different method patterns
        if (
          prop.startsWith('get') ||
          prop.startsWith('is') ||
          prop.startsWith('has')
        ) {
          if (process.env.DEBUG) {
            console.warn(
              `[ai-sdk-provider-gemini-cli] Unknown config method called: ${prop}()`
            );
          }

          // Return safe defaults based on method prefix and naming patterns
          return () => {
            // Boolean methods (is*, has*)
            if (prop.startsWith('is') || prop.startsWith('has')) {
              return false; // Safe default for boolean checks
            }

            // Getter methods (get*)
            if (prop.startsWith('get')) {
              // Return undefined for most unknown methods (safest default)
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
            }

            return undefined; // Fallback for any other pattern
          };
        }
      }

      return undefined;
    },
  });

  // Create the configuration
  const config = await createContentGeneratorConfig(
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

  // Create content generator - pass the configMock as the second parameter and sessionId
  const client = await createContentGenerator(
    config,
    configMock as unknown as Parameters<typeof createContentGenerator>[1],
    sessionId
  );

  return { client, config, sessionId };
}
