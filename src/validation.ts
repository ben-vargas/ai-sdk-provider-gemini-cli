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
  
  // Create validated options with explicit authType
  const validatedOptions: GeminiProviderOptions = {
    ...options,
    authType
  };

  // Validate based on auth type
  switch (authType) {
    case 'api-key':
    case 'gemini-api-key':
      if (!options.apiKey) {
        throw new Error(`API key is required for ${authType} auth type`);
      }
      break;

    case 'vertex-ai':
      if (!options.projectId) {
        throw new Error(
          'Project ID is required for vertex-ai auth type'
        );
      }
      if (!options.location) {
        throw new Error(
          'Location is required for vertex-ai auth type'
        );
      }
      break;

    case 'oauth-personal':
      // No additional validation needed for oauth
      break;

    default:
      throw new Error(`Invalid auth type: ${authType}`);
  }

  return validatedOptions;
}
