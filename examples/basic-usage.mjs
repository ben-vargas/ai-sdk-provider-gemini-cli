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
      model: gemini('gemini-2.5-flash'),
      prompt: 'Explain quantum computing in one paragraph.',
    });

    console.log('Response:');
    console.log(result1.text);
    console.log(`\nTokens used: ${result1.usage?.totalTokens || 'N/A'}`);
    console.log();

    // Example 2: Generation with max tokens
    console.log('Example 2: Controlled Length Response');
    console.log('─'.repeat(50));
    
    const result2 = await generateText({
      model: gemini('gemini-2.5-flash'),
      prompt: 'List 3 benefits of TypeScript',
      maxTokens: 150,
    });

    console.log('Response:');
    console.log(result2.text);
    console.log(`\nPrompt tokens: ${result2.usage?.promptTokens || 'N/A'}`);
    console.log(`Completion tokens: ${result2.usage?.completionTokens || 'N/A'}`);
    console.log();

    // Example 3: Using different models
    console.log('Example 3: Using Flash Model');
    console.log('─'.repeat(50));
    
    const result3 = await generateText({
      model: gemini('gemini-2.5-flash'),
      prompt: 'Write a haiku about programming',
    });

    console.log('Response:');
    console.log(result3.text);
    console.log(`\nModel used: gemini-2.5-flash`);
    console.log(`Total tokens: ${result3.usage?.totalTokens || 'N/A'}`);
    console.log();

    // Example 4: Accessing provider metadata
    console.log('Example 4: Provider Information');
    console.log('─'.repeat(50));
    
    const model = gemini('gemini-2.5-flash');
    console.log(`Provider: ${model.provider}`);
    console.log(`Model ID: ${model.modelId}`);
    console.log(`Specification: ${JSON.stringify(model.specificationVersion)}`);
    
    console.log('\n✅ All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tips:');
    console.log('- Make sure you have authenticated: gemini auth login');
    console.log('- Check your OAuth credentials: ~/.gemini/oauth_creds.json');
    console.log('- Run "node examples/check-auth.mjs" to verify setup');
  }
}

main().catch(console.error);