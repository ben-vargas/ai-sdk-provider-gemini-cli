import { APICallError } from '@ai-sdk/provider';

/**
 * Maps Gemini errors to Vercel AI SDK errors
 */
export function mapGeminiError(error: unknown): APICallError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Check for rate limit errors
    if (message.includes('rate limit') || message.includes('quota')) {
      return new APICallError({
        url: 'gemini-cli-core',
        requestBodyValues: {},
        statusCode: 429,
        responseHeaders: {},
        message: error.message,
        cause: error,
        data: {},
        isRetryable: true,
      });
    }

    // Check for authentication errors
    if (message.includes('unauthorized') || message.includes('authentication') || message.includes('api key')) {
      return new APICallError({
        url: 'gemini-cli-core',
        requestBodyValues: {},
        statusCode: 401,
        responseHeaders: {},
        message: error.message,
        cause: error,
        data: {},
        isRetryable: false,
      });
    }

    // Check for invalid request errors
    if (message.includes('invalid') || message.includes('bad request')) {
      return new APICallError({
        url: 'gemini-cli-core',
        requestBodyValues: {},
        statusCode: 400,
        responseHeaders: {},
        message: error.message,
        cause: error,
        data: {},
        isRetryable: false,
      });
    }

    // Check for model not found
    if (message.includes('not found') || message.includes('model')) {
      return new APICallError({
        url: 'gemini-cli-core',
        requestBodyValues: {},
        statusCode: 404,
        responseHeaders: {},
        message: error.message,
        cause: error,
        data: {},
        isRetryable: false,
      });
    }

    // Default to internal server error
    return new APICallError({
      url: 'gemini-cli-core',
      requestBodyValues: {},
      statusCode: 500,
      responseHeaders: {},
      message: error.message,
      cause: error,
      data: {},
      isRetryable: true,
    });
  }

  // Unknown error type
  return new APICallError({
    url: 'gemini-cli-core',
    requestBodyValues: {},
    statusCode: 500,
    responseHeaders: {},
    message: 'An unknown error occurred',
    cause: error,
    data: {},
    isRetryable: true,
  });
}