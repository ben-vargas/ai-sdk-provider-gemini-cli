#!/usr/bin/env node

/**
 * Custom Configuration Example
 * 
 * This example demonstrates various configuration options for the
 * Gemini CLI provider, including authentication methods and model settings.
 */

import { generateText } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';

console.log('⚙️  Gemini CLI Provider - Custom Configuration\n');

async function main() {
  try {
    // Example 1: OAuth Personal Authentication (default)
    console.log('Example 1: OAuth Personal Authentication');
    console.log('─'.repeat(50));
    
    const oauthProvider = createGeminiProvider({
      authType: 'oauth-personal'
    });
    
    const result1 = await generateText({
      model: oauthProvider('gemini-3-pro-preview'),
      prompt: 'What authentication method am I using?',
    });
    
    console.log('Response:', result1.text || 'No response generated');
    console.log('Auth method: OAuth with ~/.gemini/oauth_creds.json');
    console.log();

    // Example 2: API Key Authentication (if available)
    console.log('Example 2: API Key Authentication');
    console.log('─'.repeat(50));
    
    if (process.env.GEMINI_API_KEY) {
      const apiKeyProvider = createGeminiProvider({
        authType: 'api-key',
        apiKey: process.env.GEMINI_API_KEY
      });
      
      const result2 = await generateText({
        model: apiKeyProvider('gemini-3-pro-preview'),
        prompt: 'Say hello',
      });
      
      console.log('Response:', result2.text || 'No response generated');
      console.log('Auth method: API Key');
    } else {
      console.log('Skipping: GEMINI_API_KEY not set in environment');
    }
    console.log();

    // Example 3: Model-specific settings
    console.log('Example 3: Model Settings');
    console.log('─'.repeat(50));
    
    const gemini = createGeminiProvider({
      authType: 'oauth-personal'
    });
    
    // Using Pro model with specific settings
    const proModel = gemini('gemini-3-pro-preview', {
      temperature: 0.2,
      topP: 0.95,
    });
    
    const result3 = await generateText({
      model: proModel,
      prompt: 'List exactly 3 programming languages',
    });
    
    console.log('Pro model response:', result3.text || 'No response generated');
    console.log('Settings: temperature=0.2, topP=0.95');
    console.log();

    // Using Pro model with higher temperature for creativity
    const creativeModel = gemini('gemini-3-pro-preview', {
      temperature: 0.8,
    });
    
    const result4 = await generateText({
      model: creativeModel,
      prompt: 'Write a creative tagline for a coffee shop',
    });
    
    console.log('Pro model response:', result4.text || 'No response generated');
    console.log('Settings: temperature=0.8 (more creative)');
    console.log();

    // Example 4: Error handling configuration
    console.log('Example 4: Error Handling');
    console.log('─'.repeat(50));
    
    try {
      // Attempt with invalid model
      await generateText({
        model: gemini('invalid-model'),
        prompt: 'This should fail',
      });
    } catch (error) {
      console.log('✅ Expected error caught:', error.message);
      console.log('Error type:', error.constructor.name);
    }
    console.log();

    // Example 5: Environment variable configuration
    console.log('Example 5: Environment Variables');
    console.log('─'.repeat(50));
    
    console.log('CODE_ASSIST_ENDPOINT:', process.env.CODE_ASSIST_ENDPOINT || 'Not set (using default)');
    console.log('Default endpoint: https://cloudcode-pa.googleapis.com');
    console.log();
    
    // Example 6: Multiple provider instances
    console.log('Example 6: Multiple Provider Instances');
    console.log('─'.repeat(50));
    
    const provider1 = createGeminiProvider({
      authType: 'oauth-personal'
    });
    
    const provider2 = createGeminiProvider({
      authType: 'oauth-personal'
    });
    
    // Both providers can be used independently
    const [response1, response2] = await Promise.all([
      generateText({
        model: provider1('gemini-3-pro-preview'),
        prompt: 'Say "Provider 1"',
      }),
      generateText({
        model: provider2('gemini-3-pro-preview'),
        prompt: 'Say "Provider 2"',
      }),
    ]);
    
    console.log('Provider 1:', response1.text || 'No response generated');
    console.log('Provider 2:', response2.text || 'No response generated');
    console.log('✅ Multiple instances work independently');
    console.log();

    // Example 7: Custom settings persistence
    console.log('Example 7: Settings Persistence');
    console.log('─'.repeat(50));
    
    const customGemini = createGeminiProvider({
      authType: 'oauth-personal'
    });
    
    // Create model with custom settings
    const customModel = customGemini('gemini-3-pro-preview', {
      temperature: 0.1,
      topP: 0.9,
      topK: 10,
    });
    
    // Settings persist across multiple calls
    const responses = [];
    for (let i = 1; i <= 3; i++) {
      const result = await generateText({
        model: customModel,
        prompt: `Count to ${i}`,
      });
      responses.push(result.text || 'No response');
    }
    
    console.log('Responses with persistent settings:');
    responses.forEach((r, i) => console.log(`  ${i + 1}: ${r}`));
    console.log('Settings remained: temperature=0.1, topP=0.9, topK=10');
    
    console.log('\n✅ All configuration examples completed!');
    console.log('\n💡 Configuration tips:');
    console.log('- OAuth is the default and recommended auth method');
    console.log('- Model settings can be customized per instance');
    console.log('- Multiple provider instances can coexist');
    console.log('- Settings persist for a model instance');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('- For OAuth: run "gemini (follow setup prompts)"');
    console.log('- For API key: set GEMINI_API_KEY environment variable');
  }
}

main().catch(console.error);