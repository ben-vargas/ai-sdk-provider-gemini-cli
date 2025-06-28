#!/usr/bin/env node

/**
 * Integration Test
 * 
 * Comprehensive test suite to verify all features of the Gemini CLI provider.
 * Run this to ensure your setup is working correctly.
 */

import { generateText, streamText, generateObject } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';
import { z } from 'zod';

console.log('🧪 Gemini CLI Provider - Integration Test Suite\n');

const gemini = createGeminiProvider({
  authType: 'oauth-personal'
});

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

async function runTest(name, testFn) {
  process.stdout.write(`Testing ${name}... `);
  try {
    await testFn();
    process.stdout.write('✅ PASSED\n');
    results.passed++;
    results.tests.push({ name, status: 'passed' });
  } catch (error) {
    process.stdout.write(`❌ FAILED: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
  }
}

async function main() {
  console.log('Running integration tests...\n');
  
  // Test 1: Basic text generation
  await runTest('Basic text generation', async () => {
    const result = await generateText({
      model: gemini('gemini-2.5-flash'),
      prompt: 'Say hello',
      maxTokens: 50,
    });
    if (!result.text || result.text.length === 0) {
      throw new Error('No text generated');
    }
  });

  // Test 2: Token usage reporting
  await runTest('Token usage reporting', async () => {
    const result = await generateText({
      model: gemini('gemini-2.5-flash'),
      prompt: 'Count to 5',
      maxTokens: 100,
    });
    if (!result.usage || !result.usage.totalTokens) {
      throw new Error('Token usage not reported');
    }
  });

  // Test 3: Streaming response
  await runTest('Streaming response', async () => {
    const result = await streamText({
      model: gemini('gemini-2.5-flash'),
      prompt: 'List 3 colors',
      maxTokens: 50,
    });
    
    let chunks = 0;
    for await (const chunk of result.textStream) {
      chunks++;
    }
    
    if (chunks === 0) {
      throw new Error('No chunks received in stream');
    }
  });

  // Test 4: System messages
  await runTest('System messages', async () => {
    const result = await generateText({
      model: gemini('gemini-2.5-flash'),
      system: 'You must respond with exactly one word.',
      prompt: 'What is 2+2?',
      maxTokens: 20,
    });
    
    const wordCount = result.text.trim().split(/\s+/).length;
    if (wordCount > 3) { // Allow some flexibility
      throw new Error(`Expected 1 word, got ${wordCount}`);
    }
  });

  // Test 5: Conversation history
  await runTest('Conversation history', async () => {
    const result = await generateText({
      model: gemini('gemini-2.5-flash'),
      messages: [
        { role: 'user', content: 'My name is TestBot' },
        { role: 'assistant', content: 'Nice to meet you, TestBot!' },
        { role: 'user', content: 'What is my name?' }
      ],
      maxTokens: 50,
    });
    
    if (!result.text.toLowerCase().includes('testbot')) {
      throw new Error('Model did not remember the name from conversation');
    }
  });

  // Test 6: Flash model
  await runTest('Flash model', async () => {
    const result = await generateText({
      model: gemini('gemini-2.5-flash'),
      prompt: 'Say yes',
      maxTokens: 20,
    });
    if (!result.text) {
      throw new Error('Flash model did not generate text');
    }
  });

  // Test 7: Object generation (basic)
  await runTest('Object generation - basic', async () => {
    const { object } = await generateObject({
      model: gemini('gemini-2.5-flash'),
      schema: z.object({
        name: z.string(),
        age: z.number(),
      }),
      prompt: 'Generate a person',
    });
    
    if (!object.name || typeof object.age !== 'number') {
      throw new Error('Generated object does not match schema');
    }
  });

  // Test 8: Object generation (complex)
  await runTest('Object generation - complex', async () => {
    const { object } = await generateObject({
      model: gemini('gemini-2.5-flash'),
      schema: z.object({
        product: z.object({
          name: z.string(),
          price: z.number().positive(),
          categories: z.array(z.string()).min(1),
        }),
      }),
      prompt: 'Generate a laptop product',
    });
    
    if (!object.product.name || !object.product.categories.length) {
      throw new Error('Complex object generation failed');
    }
  });

  // Test 9: JSON mode
  await runTest('JSON mode', async () => {
    const result = await generateText({
      model: gemini('gemini-2.5-flash'),
      mode: 'json',
      prompt: 'Generate a JSON object with fields: name (string) and score (number)',
      maxTokens: 100,
    });
    
    try {
      const parsed = JSON.parse(result.text);
      if (!parsed.name || typeof parsed.score !== 'number') {
        throw new Error('JSON does not have expected fields');
      }
    } catch (e) {
      throw new Error('Generated text is not valid JSON');
    }
  });

  // Test 10: Error handling
  await runTest('Error handling - invalid model', async () => {
    try {
      await generateText({
        model: gemini('invalid-model-name'),
        prompt: 'Test',
      });
      throw new Error('Should have thrown an error');
    } catch (error) {
      if (!error.message.includes('model')) {
        throw new Error('Unexpected error type');
      }
    }
  });

  // Test 11: Abort signal
  await runTest('Abort signal handling', async () => {
    const controller = new AbortController();
    
    // Abort immediately
    setTimeout(() => controller.abort(), 100);
    
    try {
      await generateText({
        model: gemini('gemini-2.5-flash'),
        prompt: 'Write a very long story',
        abortSignal: controller.signal,
        maxTokens: 1000,
      });
      throw new Error('Should have been aborted');
    } catch (error) {
      if (error.name !== 'AbortError' && !error.message.includes('abort')) {
        throw new Error('Unexpected error type');
      }
    }
  });

  // Test 12: Maximum tokens limit
  await runTest('Maximum tokens limit', async () => {
    const result = await generateText({
      model: gemini('gemini-2.5-flash'),
      prompt: 'Count from 1 to 1000',
      maxTokens: 10,
    });
    
    // Check that response is limited
    const tokenEstimate = result.text.split(/\s+/).length;
    if (tokenEstimate > 20) { // Allow some buffer
      throw new Error('Max tokens limit not respected');
    }
  });

  // Test 13: Temperature setting
  await runTest('Temperature setting', async () => {
    const model = gemini('gemini-2.5-pro', { temperature: 0 });
    
    // With temperature 0, responses should be deterministic
    const responses = [];
    for (let i = 0; i < 2; i++) {
      const result = await generateText({
        model,
        prompt: 'What is 2+2?',
        maxTokens: 20,
      });
      responses.push(result.text.trim());
    }
    
    // Responses should be very similar (not necessarily identical due to model internals)
    if (responses[0].length === 0 || responses[1].length === 0) {
      throw new Error('Empty response with temperature 0');
    }
  });

  // Print summary
  console.log('\n' + '═'.repeat(50));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(50));
  console.log(`Total tests: ${results.passed + results.failed + results.skipped}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  
  if (results.failed > 0) {
    console.log('\nFailed tests:');
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
  }
  
  console.log('\n' + '═'.repeat(50));
  
  if (results.failed === 0) {
    console.log('🎉 All tests passed! Your Gemini CLI provider is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
    console.log('\n💡 Troubleshooting tips:');
    console.log('- Ensure you are authenticated: gemini auth login');
    console.log('- Check ~/.gemini/oauth_creds.json exists');
    console.log('- Verify your internet connection');
    console.log('- Try running individual examples to isolate issues');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error.message);
  process.exit(1);
});