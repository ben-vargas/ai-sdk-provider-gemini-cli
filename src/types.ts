import type { GoogleAuth } from 'google-auth-library';

/**
 * Provider options for configuring Gemini authentication and behavior
 */
export type GeminiProviderOptions =
  | GeminiApiKeyAuth
  | VertexAIAuth
  | OAuthAuth
  | GoogleAuthLibraryAuth
  | { authType?: undefined };

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
  googleAuth: GoogleAuth;
}
