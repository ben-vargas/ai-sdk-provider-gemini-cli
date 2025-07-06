import type { GeminiProviderOptions } from './types';

/**
 * Validates the authentication options for the Gemini provider.
 * Ensures that the provided configuration has valid authentication credentials.
 *
 * @param options - The provider options to validate
 * @returns The validated options
 * @throws Error if authentication configuration is invalid
 */
export function validateAuthOptions(
  options: GeminiProviderOptions = {}
): GeminiProviderOptions {
  // Default to oauth-personal if no authType specified
  const authType = options.authType || 'oauth-personal';

  // Validate based on auth type
  switch (authType) {
    case 'api-key':
    case 'gemini-api-key':
      if (!('apiKey' in options) || !options.apiKey) {
        throw new Error(`API key is required for ${authType} auth type`);
      }
      return { ...options, authType };

    case 'vertex-ai':
      if ('vertexAI' in options && options.vertexAI) {
        if (!options.vertexAI.projectId || options.vertexAI.projectId.trim() === '') {
          throw new Error('Project ID is required for vertex-ai auth type');
        }
        if (!options.vertexAI.location || options.vertexAI.location.trim() === '') {
          throw new Error('Location is required for vertex-ai auth type');
        }
      } else {
        throw new Error(
          'Vertex AI configuration is required for vertex-ai auth type'
        );
      }
      return { ...options, authType };

    case 'oauth':
    case 'oauth-personal':
      // No additional validation needed for oauth
      return { ...options, authType };

    case 'google-auth-library':
      if (!('googleAuth' in options) || !options.googleAuth) {
        throw new Error(
          'Google Auth Library instance is required for google-auth-library auth type'
        );
      }
      return { ...options, authType };

    default:
      throw new Error(`Invalid auth type: ${String(authType)}`);
  }
}
