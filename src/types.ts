import type { GoogleAuth } from 'google-auth-library';

/**
 * Base options available for all authentication types
 */
export interface BaseProviderOptions {
  /**
   * HTTP proxy URL to use for requests
   * Can also be set via HTTP_PROXY or HTTPS_PROXY environment variables
   */
  proxy?: string;
}

/**
 * Provider options for configuring Gemini authentication and behavior
 */
export type GeminiProviderOptions =
  | (GeminiApiKeyAuth & BaseProviderOptions)
  | (VertexAIAuth & BaseProviderOptions)
  | (OAuthAuth & BaseProviderOptions)
  | (GoogleAuthLibraryAuth & BaseProviderOptions)
  | ({ authType?: undefined } & BaseProviderOptions);

/**
 * Gemini API key authentication (supports both AI SDK standard and Gemini-specific auth types)
 */
export interface GeminiApiKeyAuth {
  authType: 'api-key' | 'gemini-api-key';
  apiKey?: string;
}

/**
 * Vertex AI authentication
 */
export interface VertexAIAuth {
  authType: 'vertex-ai';
  vertexAI: {
    projectId: string;
    location: string;
    apiKey?: string;
  };
}

/**
 * OAuth authentication (personal or service account)
 */
export interface OAuthAuth {
  authType: 'oauth' | 'oauth-personal';
  cacheDir?: string;
}

/**
 * Google Auth Library authentication
 */
export interface GoogleAuthLibraryAuth {
  authType: 'google-auth-library';
  googleAuth?: GoogleAuth;
  googleAuthClient?: unknown; // For backward compatibility
}
