import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initializeGeminiClient } from '../client';
import {
  createContentGenerator,
  createContentGeneratorConfig,
  AuthType,
} from '@google/gemini-cli-core';
import type { GeminiProviderOptions } from '../types';

// Mock the @google/gemini-cli-core module
vi.mock('@google/gemini-cli-core', () => ({
  createContentGenerator: vi.fn(),
  createContentGeneratorConfig: vi.fn(),
  AuthType: {
    USE_GEMINI: 'USE_GEMINI',
    USE_VERTEX_AI: 'USE_VERTEX_AI',
    LOGIN_WITH_GOOGLE: 'LOGIN_WITH_GOOGLE',
  },
}));

describe('initializeGeminiClient', () => {
  const mockContentGenerator = { generateContent: vi.fn() };
  let mockConfig: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a fresh config object for each test
    mockConfig = { model: 'test-model' };
    vi.mocked(createContentGeneratorConfig).mockReturnValue(mockConfig);
    vi.mocked(createContentGenerator).mockResolvedValue(
      mockContentGenerator as any
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('OAuth authentication', () => {
    it('should initialize with oauth auth type', async () => {
      const options: GeminiProviderOptions = {
        authType: 'oauth',
      };

      const result = await initializeGeminiClient(options, 'gemini-2.5-pro');

      expect(createContentGeneratorConfig).toHaveBeenCalledWith(
        expect.any(Object), // Proxy object, can't check individual properties
        AuthType.LOGIN_WITH_GOOGLE
      );
      expect(createContentGenerator).toHaveBeenCalledWith(
        mockConfig,
        expect.any(Object), // Proxy object
        undefined // sessionId parameter
      );
      expect(result).toEqual({
        client: mockContentGenerator,
        config: mockConfig,
      });
    });

    it('should initialize with oauth-personal auth type', async () => {
      const options: GeminiProviderOptions = {
        authType: 'oauth-personal',
      };

      const result = await initializeGeminiClient(options, 'gemini-2.5-pro');

      expect(createContentGeneratorConfig).toHaveBeenCalledWith(
        expect.any(Object), // Proxy object, can't check individual properties
        AuthType.LOGIN_WITH_GOOGLE
      );
      expect(createContentGenerator).toHaveBeenCalledWith(
        mockConfig,
        expect.any(Object), // Proxy object
        undefined // sessionId parameter
      );
      expect(result).toEqual({
        client: mockContentGenerator,
        config: mockConfig,
      });
    });
  });

  describe('API Key authentication', () => {
    it('should initialize with api-key auth type', async () => {
      const options: GeminiProviderOptions = {
        authType: 'api-key',
        apiKey: 'test-api-key',
      };

      const result = await initializeGeminiClient(options, 'gemini-2.5-flash');

      expect(createContentGeneratorConfig).toHaveBeenCalledWith(
        expect.any(Object), // Proxy object, can't check individual properties
        AuthType.USE_GEMINI
      );
      expect(mockConfig.apiKey).toBe('test-api-key');
      expect(createContentGenerator).toHaveBeenCalledWith(
        mockConfig,
        expect.any(Object), // Proxy object
        undefined // sessionId parameter
      );
      expect(result).toEqual({
        client: mockContentGenerator,
        config: mockConfig,
      });
    });

    it('should initialize with gemini-api-key auth type', async () => {
      const options: GeminiProviderOptions = {
        authType: 'gemini-api-key',
        apiKey: 'test-gemini-api-key',
      };

      const result = await initializeGeminiClient(options, 'gemini-2.5-pro');

      expect(createContentGeneratorConfig).toHaveBeenCalledWith(
        expect.any(Object), // Proxy object, can't check individual properties
        AuthType.USE_GEMINI
      );
      expect(mockConfig.apiKey).toBe('test-gemini-api-key');
      expect(createContentGenerator).toHaveBeenCalledWith(
        mockConfig,
        expect.any(Object), // Proxy object
        undefined // sessionId parameter
      );
      expect(result).toEqual({
        client: mockContentGenerator,
        config: mockConfig,
      });
    });

    it('should handle missing API key gracefully', async () => {
      const options: GeminiProviderOptions = {
        authType: 'api-key',
        // Missing apiKey
      } as any;

      const result = await initializeGeminiClient(options, 'gemini-2.5-pro');

      expect(createContentGeneratorConfig).toHaveBeenCalledWith(
        expect.any(Object), // Proxy object, can't check individual properties
        AuthType.USE_GEMINI
      );
      // apiKey should not be set on config
      expect(mockConfig.apiKey).toBeUndefined();
      expect(result).toEqual({
        client: mockContentGenerator,
        config: mockConfig,
      });
    });
  });

  describe('Vertex AI authentication', () => {
    it('should initialize with vertex-ai auth type', async () => {
      const options: GeminiProviderOptions = {
        authType: 'vertex-ai',
        vertexAI: {
          projectId: 'test-project',
          location: 'us-central1',
        },
      };

      const result = await initializeGeminiClient(options, 'gemini-2.5-pro');

      expect(createContentGeneratorConfig).toHaveBeenCalledWith(
        expect.any(Object), // Proxy object, can't check individual properties
        AuthType.USE_VERTEX_AI
      );
      expect(mockConfig.vertexai).toBe(true);
      expect(createContentGenerator).toHaveBeenCalledWith(
        mockConfig,
        expect.any(Object), // Proxy object
        undefined // sessionId parameter
      );
      expect(result).toEqual({
        client: mockContentGenerator,
        config: mockConfig,
      });
    });

    it('should handle missing vertexAI config gracefully', async () => {
      const options: GeminiProviderOptions = {
        authType: 'vertex-ai',
        // Missing vertexAI config
      } as any;

      const result = await initializeGeminiClient(options, 'gemini-2.5-pro');

      expect(createContentGeneratorConfig).toHaveBeenCalledWith(
        expect.any(Object), // Proxy object, can't check individual properties
        AuthType.USE_VERTEX_AI
      );
      // vertexai flag should not be set
      expect(mockConfig.vertexai).toBeUndefined();
      expect(result).toEqual({
        client: mockContentGenerator,
        config: mockConfig,
      });
    });
  });

  describe('Google Auth Library authentication', () => {
    it('should initialize with google-auth-library auth type', async () => {
      const mockAuthClient = { getAccessToken: vi.fn() };
      const options: GeminiProviderOptions = {
        authType: 'google-auth-library',
        googleAuthClient: mockAuthClient as any,
      };

      const result = await initializeGeminiClient(options, 'gemini-2.5-pro');

      // Google Auth Library falls back to USE_GEMINI
      expect(createContentGeneratorConfig).toHaveBeenCalledWith(
        expect.any(Object), // Proxy object, can't check individual properties
        AuthType.USE_GEMINI
      );
      expect(createContentGenerator).toHaveBeenCalledWith(
        mockConfig,
        expect.any(Object), // Proxy object
        undefined // sessionId parameter
      );
      expect(result).toEqual({
        client: mockContentGenerator,
        config: mockConfig,
      });
    });
  });

  describe('Default authentication', () => {
    it('should handle undefined auth type', async () => {
      const options: GeminiProviderOptions = {
        // No authType specified
      };

      const result = await initializeGeminiClient(options, 'gemini-2.5-pro');

      expect(createContentGeneratorConfig).toHaveBeenCalledWith(
        expect.any(Object), // Proxy object, can't check individual properties
        undefined
      );
      expect(createContentGenerator).toHaveBeenCalledWith(
        mockConfig,
        expect.any(Object), // Proxy object
        undefined // sessionId parameter
      );
      expect(result).toEqual({
        client: mockContentGenerator,
        config: mockConfig,
      });
    });

    it('should handle unknown auth type', async () => {
      const options: GeminiProviderOptions = {
        authType: 'unknown-auth' as any,
      };

      const result = await initializeGeminiClient(options, 'gemini-2.5-pro');

      expect(createContentGeneratorConfig).toHaveBeenCalledWith(
        expect.any(Object), // Proxy object, can't check individual properties
        undefined
      );
      expect(createContentGenerator).toHaveBeenCalledWith(
        mockConfig,
        expect.any(Object), // Proxy object
        undefined // sessionId parameter
      );
      expect(result).toEqual({
        client: mockContentGenerator,
        config: mockConfig,
      });
    });
  });

  describe('Model ID handling', () => {
    it('should pass through different model IDs', async () => {
      const modelIds = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro'];
      const options: GeminiProviderOptions = {
        authType: 'oauth-personal',
      };

      for (const modelId of modelIds) {
        vi.clearAllMocks();
        vi.mocked(createContentGeneratorConfig).mockReturnValue(mockConfig);
        vi.mocked(createContentGenerator).mockResolvedValue(
          mockContentGenerator as any
        );

        await initializeGeminiClient(options, modelId);

        expect(createContentGeneratorConfig).toHaveBeenCalledWith(
          expect.any(Object), // Proxy object, can't check individual properties
          AuthType.LOGIN_WITH_GOOGLE
        );
      }
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from createContentGeneratorConfig', async () => {
      const error = new Error('Config creation failed');
      vi.mocked(createContentGeneratorConfig).mockImplementation(() => {
        throw error;
      });

      const options: GeminiProviderOptions = {
        authType: 'oauth-personal',
      };

      await expect(
        initializeGeminiClient(options, 'gemini-2.5-pro')
      ).rejects.toThrow('Config creation failed');
    });

    it('should propagate errors from createContentGenerator', async () => {
      const error = new Error('Client creation failed');
      vi.mocked(createContentGenerator).mockRejectedValue(error);

      const options: GeminiProviderOptions = {
        authType: 'oauth-personal',
      };

      await expect(
        initializeGeminiClient(options, 'gemini-2.5-pro')
      ).rejects.toThrow('Client creation failed');
    });
  });

  describe('Configuration modification', () => {
    it('should modify config for api-key auth types', async () => {
      const apiKeyOptions: GeminiProviderOptions = {
        authType: 'api-key',
        apiKey: 'test-key',
      };

      await initializeGeminiClient(apiKeyOptions, 'gemini-2.5-pro');
      expect(mockConfig.apiKey).toBe('test-key');
    });

    it('should not modify config for oauth auth types', async () => {
      const oauthOptions: GeminiProviderOptions = {
        authType: 'oauth-personal',
      };

      await initializeGeminiClient(oauthOptions, 'gemini-2.5-pro');
      expect(mockConfig.apiKey).toBeUndefined();
    });

    it('should set vertexai flag for vertex-ai auth type', async () => {
      const vertexOptions: GeminiProviderOptions = {
        authType: 'vertex-ai',
        vertexAI: {
          projectId: 'test-project',
          location: 'us-central1',
        },
      };

      await initializeGeminiClient(vertexOptions, 'gemini-2.5-pro');
      expect(mockConfig.vertexai).toBe(true);
    });

    it('should not set vertexai flag for non-vertex auth types', async () => {
      const oauthOptions: GeminiProviderOptions = {
        authType: 'oauth-personal',
      };

      await initializeGeminiClient(oauthOptions, 'gemini-2.5-pro');
      expect(mockConfig.vertexai).toBeUndefined();
    });
  });

  describe('Proxy configuration', () => {
    it('should use proxy from options if provided', async () => {
      const options: GeminiProviderOptions = {
        authType: 'oauth-personal',
        proxy: 'http://proxy.example.com:8080',
      };

      await initializeGeminiClient(options, 'gemini-2.5-pro');

      const callArgs = vi.mocked(createContentGeneratorConfig).mock.calls[0][0];
      expect(callArgs.getProxy()).toBe('http://proxy.example.com:8080');
    });

    it('should use HTTP_PROXY env var if no proxy in options', async () => {
      const originalHttpProxy = process.env.HTTP_PROXY;
      process.env.HTTP_PROXY = 'http://env-proxy.example.com:8080';

      const options: GeminiProviderOptions = {
        authType: 'oauth-personal',
      };

      await initializeGeminiClient(options, 'gemini-2.5-pro');

      const callArgs = vi.mocked(createContentGeneratorConfig).mock.calls[0][0];
      expect(callArgs.getProxy()).toBe('http://env-proxy.example.com:8080');

      process.env.HTTP_PROXY = originalHttpProxy;
    });

    it('should use HTTPS_PROXY env var if no proxy or HTTP_PROXY', async () => {
      const originalHttpProxy = process.env.HTTP_PROXY;
      const originalHttpsProxy = process.env.HTTPS_PROXY;
      delete process.env.HTTP_PROXY;
      process.env.HTTPS_PROXY = 'https://secure-proxy.example.com:8443';

      const options: GeminiProviderOptions = {
        authType: 'oauth-personal',
      };

      await initializeGeminiClient(options, 'gemini-2.5-pro');

      const callArgs = vi.mocked(createContentGeneratorConfig).mock.calls[0][0];
      expect(callArgs.getProxy()).toBe('https://secure-proxy.example.com:8443');

      process.env.HTTP_PROXY = originalHttpProxy;
      process.env.HTTPS_PROXY = originalHttpsProxy;
    });

    it('should return undefined if no proxy configured', async () => {
      const originalHttpProxy = process.env.HTTP_PROXY;
      const originalHttpsProxy = process.env.HTTPS_PROXY;
      delete process.env.HTTP_PROXY;
      delete process.env.HTTPS_PROXY;

      const options: GeminiProviderOptions = {
        authType: 'oauth-personal',
      };

      await initializeGeminiClient(options, 'gemini-2.5-pro');

      const callArgs = vi.mocked(createContentGeneratorConfig).mock.calls[0][0];
      expect(callArgs.getProxy()).toBeUndefined();

      process.env.HTTP_PROXY = originalHttpProxy;
      process.env.HTTPS_PROXY = originalHttpsProxy;
    });
  });
});
