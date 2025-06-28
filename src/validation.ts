import type { GeminiProviderOptions } from './types';

/**
 * Validates the authentication options for the Gemini provider.
 * Ensures that the provided configuration has valid authentication credentials.
 * 
 * @param options - The provider options to validate
 * @returns The validated options
 * @throws Error if authentication configuration is invalid
 */
export function validateAuthOptions(options: GeminiProviderOptions): GeminiProviderOptions {
  if (!options || typeof options !== 'object') {
    throw new Error('Provider options must be an object');
  }

  // If no auth type specified, return as-is (will use default)
  if (!('authType' in options)) {
    return options;
  }

  // Validate based on auth type
  switch (options.authType) {
    case 'gemini-api-key':
      // API key can be provided or fallback to env var
      if ('apiKey' in options && typeof options.apiKey !== 'string' && options.apiKey !== undefined) {
        throw new Error('API key must be a string');
      }
      break;

    case 'vertex-ai':
      if (!options.vertexAI) {
        throw new Error('vertexAI configuration is required for vertex-ai auth type');
      }
      if (!options.vertexAI.projectId || !options.vertexAI.location) {
        throw new Error('projectId and location are required for Vertex AI authentication');
      }
      break;

    case 'oauth':
    case 'oauth-personal':
      // Optional cacheDir validation
      if ('cacheDir' in options && typeof options.cacheDir !== 'string' && options.cacheDir !== undefined) {
        throw new Error('cacheDir must be a string');
      }
      break;

    case 'google-auth-library':
      if (!options.googleAuth) {
        throw new Error('googleAuth client is required for google-auth-library auth type');
      }
      break;

    default:
      throw new Error(`Unknown auth type: ${(options as any).authType}`);
  }

  return options;
}