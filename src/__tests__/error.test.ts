import { describe, it, expect } from 'vitest';
import {
  mapGeminiError,
  createAPICallError,
  createAuthenticationError,
  createTimeoutError,
  isAuthenticationError,
  isTimeoutError,
  getErrorMetadata,
} from '../error';
import { APICallError, LoadAPIKeyError } from '@ai-sdk/provider';

describe('mapGeminiError', () => {
  describe('rate limit errors (429)', () => {
    it('should map "rate limit" error to 429', () => {
      const error = new Error('You have exceeded the rate limit for this API');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(APICallError);
      expect(result.statusCode).toBe(429);
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe(
        'You have exceeded the rate limit for this API'
      );
      expect(result.data).toEqual({
        code: 'RATE_LIMIT',
        exitCode: undefined,
        stderr: undefined,
      });
      expect(result.url).toBe('gemini-cli-core://command');
    });

    it('should map "quota" error to 429', () => {
      const error = new Error('API quota exceeded');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(APICallError);
      expect(result.statusCode).toBe(429);
      expect(result.isRetryable).toBe(true);
    });

    it('should handle case-insensitive rate limit detection', () => {
      const error = new Error('RATE LIMIT exceeded');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(429);
      expect(result.isRetryable).toBe(true);
    });
  });

  describe('authentication errors (401)', () => {
    it('should map "unauthorized" error to LoadAPIKeyError', () => {
      const error = new Error('Unauthorized access to the API');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(LoadAPIKeyError);
      expect(result.message).toBe('Unauthorized access to the API');
    });

    it('should map "authentication" error to LoadAPIKeyError', () => {
      const error = new Error('Authentication failed');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(LoadAPIKeyError);
      expect(result.message).toBe('Authentication failed');
    });

    it('should map "api key" error to LoadAPIKeyError', () => {
      const error = new Error('Invalid API key provided');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(LoadAPIKeyError);
      expect(result.message).toBe('Invalid API key provided');
    });

    it('should handle case-insensitive authentication detection', () => {
      const error = new Error('AUTHENTICATION REQUIRED');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(LoadAPIKeyError);
    });
  });

  describe('bad request errors (400)', () => {
    it('should map "invalid" error to 400', () => {
      const error = new Error('Invalid request parameters');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(APICallError);
      expect(result.statusCode).toBe(400);
      expect(result.isRetryable).toBe(false);
      expect(result.data?.code).toBe('INVALID_REQUEST');
    });

    it('should map "bad request" error to 400', () => {
      const error = new Error('Bad request format');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(400);
      expect(result.isRetryable).toBe(false);
    });
  });

  describe('not found errors (404)', () => {
    it('should map "not found" error to 404', () => {
      const error = new Error('Model not found');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(APICallError);
      expect(result.statusCode).toBe(404);
      expect(result.isRetryable).toBe(false);
      expect(result.data?.code).toBe('MODEL_NOT_FOUND');
    });

    it('should map "model" error to 404', () => {
      const error = new Error('Invalid model specified');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(404);
      expect(result.isRetryable).toBe(false);
    });
  });

  describe('internal server errors (500)', () => {
    it('should map generic errors to 500', () => {
      const error = new Error('Internal server error');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(APICallError);
      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
      expect(result.data?.code).toBe('INTERNAL_ERROR');
    });

    it('should map unknown errors to 500', () => {
      const error = new Error('Something went wrong');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
    });
  });

  describe('timeout errors (504)', () => {
    it('should map timeout errors to 504', () => {
      const error = new Error('Request timeout');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(APICallError);
      expect(result.statusCode).toBe(504);
      expect(result.isRetryable).toBe(true);
      expect(result.data?.code).toBe('TIMEOUT');
    });

    it('should map "timed out" errors to 504', () => {
      const error = new Error('Operation timed out');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(504);
      expect(result.isRetryable).toBe(true);
    });
  });

  describe('error priority', () => {
    it('should prioritize authentication over bad request', () => {
      const error = new Error('Invalid API key in bad request');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(LoadAPIKeyError);
    });

    it('should prioritize rate limit over not found', () => {
      const error = new Error('Rate limit exceeded: model not found');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(429);
      expect(result.isRetryable).toBe(true);
    });
  });

  describe('non-Error objects', () => {
    it('should handle string errors', () => {
      const error = 'String error message';
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(APICallError);
      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.data?.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle object errors', () => {
      const error = { code: 'ERR_001', message: 'Custom error' };
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe('An unknown error occurred');
    });

    it('should handle null errors', () => {
      const error = null;
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
    });

    it('should handle number errors', () => {
      const error = 404;
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
    });
  });

  describe('APICallError properties', () => {
    it('should set all required properties', () => {
      const error = new Error('Test error');
      const result = mapGeminiError(error);

      expect(result.url).toBe('gemini-cli-core://command');
      expect(result.requestBodyValues).toEqual({});
      expect(result.responseHeaders).toEqual({});
    });

    it('should preserve error message', () => {
      const error = new Error('Test error with stack');
      const result = mapGeminiError(error);

      expect(result.message).toBe('Test error with stack');
    });
  });

  describe('edge cases', () => {
    it('should handle errors with special characters', () => {
      const error = new Error('Error: @#$% unauthorized %$#@');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(LoadAPIKeyError);
    });

    it('should handle errors with multiple matching keywords', () => {
      const error = new Error('Rate limit exceeded: unauthorized request');
      const result = mapGeminiError(error);

      // Authentication takes priority
      expect(result).toBeInstanceOf(LoadAPIKeyError);
    });
  });
});

describe('error factory functions', () => {
  describe('createAPICallError', () => {
    it('should create API call error with metadata', () => {
      const error = createAPICallError({
        message: 'Test error',
        code: 'TEST_ERROR',
        exitCode: 1,
        stderr: 'Error output',
        promptExcerpt: 'Test prompt',
        isRetryable: true,
        statusCode: 500,
      });

      expect(error).toBeInstanceOf(APICallError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isRetryable).toBe(true);
      expect(error.data).toEqual({
        code: 'TEST_ERROR',
        exitCode: 1,
        stderr: 'Error output',
      });
      expect(error.requestBodyValues).toEqual({ prompt: 'Test prompt' });
    });
  });

  describe('createAuthenticationError', () => {
    it('should create authentication error', () => {
      const error = createAuthenticationError({
        message: 'Invalid credentials',
      });

      expect(error).toBeInstanceOf(LoadAPIKeyError);
      expect(error.message).toBe('Invalid credentials');
    });
  });

  describe('createTimeoutError', () => {
    it('should create timeout error', () => {
      const error = createTimeoutError({
        message: 'Request timed out',
        promptExcerpt: 'Test prompt',
        timeoutMs: 30000,
      });

      expect(error).toBeInstanceOf(APICallError);
      expect(error.message).toBe('Request timed out');
      expect(error.statusCode).toBe(504);
      expect(error.isRetryable).toBe(true);
      expect(error.data?.code).toBe('TIMEOUT');
    });
  });
});

describe('error utility functions', () => {
  describe('isAuthenticationError', () => {
    it('should detect LoadAPIKeyError', () => {
      const error = new LoadAPIKeyError({ message: 'Auth failed' });
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should detect authentication error by message', () => {
      const error = new Error('Unauthorized request');
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return false for non-auth errors', () => {
      const error = new Error('Generic error');
      expect(isAuthenticationError(error)).toBe(false);
    });
  });

  describe('isTimeoutError', () => {
    it('should detect timeout by status code', () => {
      const error = new APICallError({
        url: 'test',
        requestBodyValues: {},
        statusCode: 504,
        responseHeaders: {},
        message: 'Timeout',
      });
      expect(isTimeoutError(error)).toBe(true);
    });

    it('should detect timeout by message', () => {
      const error = new Error('Request timeout');
      expect(isTimeoutError(error)).toBe(true);
    });
  });

  describe('getErrorMetadata', () => {
    it('should extract metadata from APICallError', () => {
      const error = createAPICallError({
        message: 'Test',
        code: 'TEST',
        exitCode: 1,
      });

      const metadata = getErrorMetadata(error);
      expect(metadata).toEqual({
        code: 'TEST',
        exitCode: 1,
        stderr: undefined,
      });
    });

    it('should return undefined for non-APICallError', () => {
      const error = new Error('Test');
      expect(getErrorMetadata(error)).toBeUndefined();
    });
  });
});
