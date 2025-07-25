import { APICallError, LoadAPIKeyError } from '@ai-sdk/provider';

/**
 * Custom error metadata for Gemini CLI errors
 */
export interface GeminiCLIErrorMetadata {
  code?: string;
  exitCode?: number;
  stderr?: string;
  promptExcerpt?: string;
}

/**
 * Creates an API call error with Gemini-specific metadata
 */
export function createAPICallError({
  message,
  code,
  exitCode,
  stderr,
  promptExcerpt,
  isRetryable = false,
  statusCode = 500,
}: GeminiCLIErrorMetadata & {
  message: string;
  isRetryable?: boolean;
  statusCode?: number;
}): APICallError {
  return new APICallError({
    url: 'gemini-cli-core://command',
    requestBodyValues: promptExcerpt ? { prompt: promptExcerpt } : {},
    statusCode,
    responseHeaders: {},
    message,
    data: {
      code,
      exitCode,
      stderr,
    },
    isRetryable,
  });
}

/**
 * Creates an authentication error
 */
export function createAuthenticationError({
  message,
}: {
  message: string;
}): LoadAPIKeyError {
  return new LoadAPIKeyError({
    message,
  });
}

/**
 * Creates a timeout error
 */
export function createTimeoutError({
  message,
  promptExcerpt,
}: {
  message: string;
  promptExcerpt?: string;
}): APICallError {
  return createAPICallError({
    message,
    code: 'TIMEOUT',
    promptExcerpt,
    isRetryable: true,
    statusCode: 504,
  });
}

/**
 * Checks if an error is an authentication error
 */
export function isAuthenticationError(error: unknown): boolean {
  if (error instanceof LoadAPIKeyError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('api key') ||
      message.includes('credentials')
    );
  }

  return false;
}

/**
 * Checks if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof APICallError) {
    return (
      error.statusCode === 504 ||
      (error.data as GeminiCLIErrorMetadata)?.code === 'TIMEOUT'
    );
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('timeout') || message.includes('timed out');
  }

  return false;
}

/**
 * Gets error metadata from an error
 */
export function getErrorMetadata(
  error: unknown
): GeminiCLIErrorMetadata | undefined {
  if (error instanceof APICallError) {
    return error.data as GeminiCLIErrorMetadata;
  }

  return undefined;
}

/**
 * Maps Gemini errors to Vercel AI SDK errors (v5 pattern)
 */
export function mapGeminiError(error: unknown): APICallError | LoadAPIKeyError {
  if (error instanceof Error) {
    // Don't wrap abort errors - they should pass through unchanged
    if (error.name === 'AbortError') {
      throw error;
    }

    const message = error.message.toLowerCase();

    // Check for authentication errors
    if (isAuthenticationError(error)) {
      return createAuthenticationError({
        message: error.message,
      });
    }

    // Check for rate limit errors
    if (message.includes('rate limit') || message.includes('quota')) {
      return createAPICallError({
        message: error.message,
        code: 'RATE_LIMIT',
        isRetryable: true,
        statusCode: 429,
      });
    }

    // Check for timeout errors
    if (isTimeoutError(error)) {
      return createTimeoutError({
        message: error.message,
      });
    }

    // Check for model not found (check this before general invalid errors)
    if (
      message.includes('not found') ||
      message.includes('no such model') ||
      (message.includes('model') &&
        (message.includes('invalid') || message.includes('not found')))
    ) {
      return createAPICallError({
        message: error.message,
        code: 'MODEL_NOT_FOUND',
        isRetryable: false,
        statusCode: 404,
      });
    }

    // Check for invalid request errors
    if (message.includes('invalid') || message.includes('bad request')) {
      return createAPICallError({
        message: error.message,
        code: 'INVALID_REQUEST',
        isRetryable: false,
        statusCode: 400,
      });
    }

    // Default to internal server error
    return createAPICallError({
      message: error.message,
      code: 'INTERNAL_ERROR',
      isRetryable: true,
      statusCode: 500,
    });
  }

  // Unknown error type
  return createAPICallError({
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    isRetryable: true,
    statusCode: 500,
  });
}
