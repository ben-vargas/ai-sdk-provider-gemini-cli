import { describe, it, expect } from 'vitest';
import { validateAuthOptions } from '../validation';

describe('validateAuthOptions', () => {
  it('should default to oauth-personal auth type when no options provided', () => {
    const result = validateAuthOptions({});
    expect(result.authType).toBe('oauth-personal');
  });

  it('should accept oauth-personal auth type', () => {
    const result = validateAuthOptions({ authType: 'oauth-personal' });
    expect(result.authType).toBe('oauth-personal');
  });

  it('should accept api-key auth type with API key', () => {
    const result = validateAuthOptions({
      authType: 'api-key',
      apiKey: 'test-api-key',
    });
    expect(result.authType).toBe('api-key');
    expect(result.apiKey).toBe('test-api-key');
  });

  it('should accept gemini-api-key auth type with API key', () => {
    const result = validateAuthOptions({
      authType: 'gemini-api-key',
      apiKey: 'test-api-key',
    });
    expect(result.authType).toBe('gemini-api-key');
    expect(result.apiKey).toBe('test-api-key');
  });

  it('should accept vertex-ai auth type with required fields', () => {
    const result = validateAuthOptions({
      authType: 'vertex-ai',
      projectId: 'test-project',
      location: 'us-central1',
    });
    expect(result.authType).toBe('vertex-ai');
    expect(result.projectId).toBe('test-project');
    expect(result.location).toBe('us-central1');
  });

  it('should throw error for api-key auth without API key', () => {
    expect(() => 
      validateAuthOptions({
        authType: 'api-key',
      })
    ).toThrow('API key is required for api-key auth type');
  });

  it('should throw error for gemini-api-key auth without API key', () => {
    expect(() => 
      validateAuthOptions({
        authType: 'gemini-api-key',
      })
    ).toThrow('API key is required for gemini-api-key auth type');
  });

  it('should throw error for vertex-ai auth without projectId', () => {
    expect(() => 
      validateAuthOptions({
        authType: 'vertex-ai',
        location: 'us-central1',
      })
    ).toThrow('Project ID is required for vertex-ai auth type');
  });

  it('should throw error for vertex-ai auth without location', () => {
    expect(() => 
      validateAuthOptions({
        authType: 'vertex-ai',
        projectId: 'test-project',
      })
    ).toThrow('Location is required for vertex-ai auth type');
  });

  it('should throw error for invalid auth type', () => {
    expect(() => 
      validateAuthOptions({
        // @ts-expect-error Testing invalid auth type
        authType: 'invalid-auth',
      })
    ).toThrow('Invalid auth type: invalid-auth');
  });
});