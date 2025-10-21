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

/**
 * Logger interface for provider diagnostics and debugging.
 *
 * Supports four log levels:
 * - `debug`: Detailed execution tracing (request/response, tool calls, stream events)
 * - `info`: General execution flow information (session initialization, completion)
 * - `warn`: Warnings about configuration issues or unexpected behavior
 * - `error`: Error messages for failures and exceptions
 *
 * When implementing a custom logger, all four methods must be provided.
 *
 * @example
 * ```typescript
 * const customLogger: Logger = {
 *   debug: (msg) => myLogger.debug(msg),
 *   info: (msg) => myLogger.info(msg),
 *   warn: (msg) => myLogger.warn(msg),
 *   error: (msg) => myLogger.error(msg),
 * };
 * ```
 */
export interface Logger {
  /**
   * Log detailed execution tracing (only shown when verbose mode is enabled).
   * Used for request/response details, tool calls, stream events, and token usage.
   */
  debug(message: string): void;

  /**
   * Log general execution flow information (only shown when verbose mode is enabled).
   * Used for session initialization, request completion, and major state transitions.
   */
  info(message: string): void;

  /**
   * Log warnings about configuration issues or unexpected behavior.
   * Always shown regardless of verbose mode setting.
   */
  warn(message: string): void;

  /**
   * Log error messages for failures and exceptions.
   * Always shown regardless of verbose mode setting.
   */
  error(message: string): void;
}
