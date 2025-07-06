import { describe, it, expect } from 'vitest';
import { createGeminiProvider } from '../gemini-provider';
import { GeminiLanguageModel } from '../gemini-language-model';

describe('createGeminiProvider', () => {
  it('should create a provider function', () => {
    const provider = createGeminiProvider();
    expect(typeof provider).toBe('function');
  });

  it('should have languageModel method', () => {
    const provider = createGeminiProvider();
    expect(typeof provider.languageModel).toBe('function');
  });

  it('should have chat method', () => {
    const provider = createGeminiProvider();
    expect(typeof provider.chat).toBe('function');
  });

  it('should create GeminiLanguageModel instance when called', () => {
    const provider = createGeminiProvider();
    const model = provider('gemini-2.5-pro');
    expect(model).toBeInstanceOf(GeminiLanguageModel);
  });

  it('should pass model ID to language model', () => {
    const provider = createGeminiProvider();
    const model = provider('gemini-2.5-flash');
    expect(model.modelId).toBe('gemini-2.5-flash');
  });

  it('should pass settings to language model', () => {
    const provider = createGeminiProvider();
    const settings = { temperature: 0.5, maxTokens: 1000 };
    const model = provider('gemini-2.5-pro', settings);
    expect(model.settings).toEqual(settings);
  });

  it('should work with oauth-personal auth', () => {
    const provider = createGeminiProvider({ authType: 'oauth-personal' });
    const model = provider('gemini-2.5-pro');
    expect(model).toBeInstanceOf(GeminiLanguageModel);
  });

  it('should work with api-key auth', () => {
    const provider = createGeminiProvider({
      authType: 'api-key',
      apiKey: 'test-key',
    });
    const model = provider('gemini-2.5-pro');
    expect(model).toBeInstanceOf(GeminiLanguageModel);
  });

  it('should throw error when called with new keyword', () => {
    const provider = createGeminiProvider();
    expect(() => {
      // @ts-expect-error Testing error case
      new provider('gemini-2.5-pro');
    }).toThrow('The provider function cannot be called with the new keyword.');
  });

  describe('languageModel method', () => {
    it('should create same type of model as provider function', () => {
      const provider = createGeminiProvider();
      const model1 = provider('gemini-2.5-pro');
      const model2 = provider.languageModel('gemini-2.5-pro');

      expect(model1.constructor).toBe(model2.constructor);
      expect(model1.modelId).toBe(model2.modelId);
    });
  });

  describe('chat method', () => {
    it('should create same type of model as provider function', () => {
      const provider = createGeminiProvider();
      const model1 = provider('gemini-2.5-pro');
      const model2 = provider.chat('gemini-2.5-pro');

      expect(model1.constructor).toBe(model2.constructor);
      expect(model1.modelId).toBe(model2.modelId);
    });
  });
});
