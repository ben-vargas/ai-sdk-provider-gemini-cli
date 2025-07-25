#!/usr/bin/env node

/**
 * Basic Usage Example
 * 
 * This example demonstrates the simplest way to use the Gemini CLI Provider
 * to generate text and access response metadata.
 */

import { generateText } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';

console.log('🚀 Gemini CLI Provider - Basic Usage\n');

async function main() {
  try {
    // Create provider with OAuth authentication
    const gemini = createGeminiProvider({
      authType: 'oauth-personal'
    });

    // Example 1: Simple text generation
    console.log('Example 1: Basic Text Generation');
    console.log('─'.repeat(50));
    
    const result1 = await generateText({
      model: gemini('gemini-2.5-pro'),
      prompt: 'Explain quantum computing in one paragraph.',
    });

    console.log('Response:');
    console.log(result1.content[0]?.text || 'No response generated');
    console.log(`\nTokens used: ${result1.usage?.totalTokens || 'N/A'}`);
    console.log();

    // Example 2: Using pro model
    console.log('Example 2: Using Pro Model');
    console.log('─'.repeat(50));
    
    const result2 = await generateText({
      model: gemini('gemini-2.5-pro'),
      prompt: 'Write a haiku about artificial intelligence',
    });

    console.log('Response:');
    console.log(result2.content[0]?.text || 'No response generated');
    console.log(`\nModel used: gemini-2.5-pro`);
    console.log(`Input tokens: ${result2.usage?.inputTokens || 'N/A'}`);
    console.log(`Output tokens: ${result2.usage?.outputTokens || 'N/A'}`);
    console.log();

    // Example 3: Using temperature settings
    console.log('Example 3: Using Temperature Settings');
    console.log('─'.repeat(50));
    
    const result3 = await generateText({
      model: gemini('gemini-2.5-pro'),
      prompt: 'Write a haiku about programming',
    });

    console.log('Response:');
    console.log(result3.content[0]?.text || 'No response generated');
    console.log(`\nModel used: gemini-2.5-pro`);
    console.log(`Total tokens: ${result3.usage?.totalTokens || 'N/A'}`);
    console.log();

    // Example 4: Accessing provider metadata
    console.log('Example 4: Provider Information');
    console.log('─'.repeat(50));
    
    const model = gemini('gemini-2.5-pro');
    console.log(`Provider: ${model.provider}`);
    console.log(`Model ID: ${model.modelId}`);
    console.log(`Specification: ${JSON.stringify(model.specificationVersion)}`);
    
    console.log('\n✅ All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tips:');
    console.log('- Make sure you have authenticated: gemini (follow setup prompts)');
    console.log('- Check your OAuth credentials: ~/.gemini/oauth_creds.json');
    console.log('- Run "node examples/check-auth.mjs" to verify setup');
  }
}

main().catch(console.error);