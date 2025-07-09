import { describe, it, expect } from 'vitest';
import { mapGeminiError } from '../error';
import { APICallError } from '@ai-sdk/provider';

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
      expect(result.cause).toBe(error);
      expect(result.url).toBe('gemini-cli-core');
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
    it('should map "unauthorized" error to 401', () => {
      const error = new Error('Unauthorized access to the API');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(APICallError);
      expect(result.statusCode).toBe(401);
      expect(result.isRetryable).toBe(false);
      expect(result.message).toBe('Unauthorized access to the API');
    });

    it('should map "authentication" error to 401', () => {
      const error = new Error('Authentication failed');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(401);
      expect(result.isRetryable).toBe(false);
    });

    it('should map "api key" error to 401', () => {
      const error = new Error('Invalid API key provided');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(401);
      expect(result.isRetryable).toBe(false);
    });

    it('should handle case-insensitive authentication detection', () => {
      const error = new Error('AUTHENTICATION REQUIRED');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(401);
      expect(result.isRetryable).toBe(false);
    });
  });

  describe('bad request errors (400)', () => {
    it('should map "invalid" error to 400', () => {
      const error = new Error('Invalid request parameters');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(APICallError);
      expect(result.statusCode).toBe(400);
      expect(result.isRetryable).toBe(false);
      expect(result.message).toBe('Invalid request parameters');
    });

    it('should map "bad request" error to 400', () => {
      const error = new Error('Bad request: missing required field');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(400);
      expect(result.isRetryable).toBe(false);
    });

    it('should handle case-insensitive bad request detection', () => {
      const error = new Error('INVALID input data');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(400);
      expect(result.isRetryable).toBe(false);
    });
  });

  describe('not found errors (404)', () => {
    it('should map "not found" error to 404', () => {
      const error = new Error('Resource not found');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(APICallError);
      expect(result.statusCode).toBe(404);
      expect(result.isRetryable).toBe(false);
      expect(result.message).toBe('Resource not found');
    });

    it('should map "model" error to 404', () => {
      const error = new Error('Model gemini-99 does not exist');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(404);
      expect(result.isRetryable).toBe(false);
    });

    it('should handle combined "model not found" error', () => {
      const error = new Error('The specified model was not found');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(404);
      expect(result.isRetryable).toBe(false);
    });
  });

  describe('internal server errors (500)', () => {
    it('should map generic errors to 500', () => {
      const error = new Error('Something went wrong');
      const result = mapGeminiError(error);

      expect(result).toBeInstanceOf(APICallError);
      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe('Something went wrong');
    });

    it('should map network errors to 500', () => {
      const error = new Error('Network connection failed');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
    });

    it('should map timeout errors to 500', () => {
      const error = new Error('Request timeout');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
    });
  });

  describe('error priority', () => {
    it('should prioritize rate limit over other errors', () => {
      const error = new Error('Rate limit exceeded for invalid request');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(429);
      expect(result.isRetryable).toBe(true);
    });

    it('should prioritize authentication over bad request', () => {
      const error = new Error('Unauthorized: invalid parameters');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(401);
      expect(result.isRetryable).toBe(false);
    });

    it('should prioritize bad request over not found', () => {
      const error = new Error('Invalid model not found');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(400);
      expect(result.isRetryable).toBe(false);
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
      expect(result.cause).toBe(error);
    });

    it('should handle object errors', () => {
      const error = { code: 'ERR_001', message: 'Custom error' };
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.cause).toBe(error);
    });

    it('should handle null errors', () => {
      const error = null;
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.cause).toBe(error);
    });

    it('should handle undefined errors', () => {
      const error = undefined;
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.cause).toBe(error);
    });

    it('should handle number errors', () => {
      const error = 404;
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.cause).toBe(error);
    });
  });

  describe('APICallError properties', () => {
    it('should set all required properties', () => {
      const error = new Error('Test error');
      const result = mapGeminiError(error);

      expect(result.url).toBe('gemini-cli-core');
      expect(result.requestBodyValues).toEqual({});
      expect(result.responseHeaders).toEqual({});
      expect(result.data).toEqual({});
      expect(result.cause).toBe(error);
    });

    it('should preserve error stack trace', () => {
      const error = new Error('Test error with stack');
      const result = mapGeminiError(error);

      expect(result.cause).toBe(error);
      expect((result.cause as Error).stack).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty error messages', () => {
      const error = new Error('');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe('');
    });

    it('should handle errors with special characters', () => {
      const error = new Error('Error: [401] Unauthorized!');
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(401);
      expect(result.isRetryable).toBe(false);
    });

    it('should handle very long error messages', () => {
      const longMessage = 'Rate limit ' + 'x'.repeat(1000);
      const error = new Error(longMessage);
      const result = mapGeminiError(error);

      expect(result.statusCode).toBe(429);
      expect(result.message).toBe(longMessage);
    });

    it('should handle errors with multiple matching keywords', () => {
      const error = new Error(
        'Unauthorized: Rate limit exceeded for invalid model'
      );
      const result = mapGeminiError(error);

      // Should match the first condition (rate limit)
      expect(result.statusCode).toBe(429);
      expect(result.isRetryable).toBe(true);
    });
  });
});
