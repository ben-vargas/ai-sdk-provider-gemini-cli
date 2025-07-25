#!/usr/bin/env node

/**
 * Error Handling Example
 * 
 * This example demonstrates proper error handling patterns when using
 * the Gemini CLI provider, including authentication errors, rate limits,
 * and retry strategies.
 */

import { generateText, streamText } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';
import fs from 'fs';
import path from 'path';
import os from 'os';

console.log('🛡️  Gemini CLI Provider - Error Handling\n');

// Helper function to check if error is authentication related
function isAuthError(error) {
  return error.message.toLowerCase().includes('auth') || 
         error.message.toLowerCase().includes('credentials') ||
         error.message.includes('401') ||
         error.message.includes('403');
}

// Helper function for retry with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`  Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

async function main() {
  // Example 1: Authentication error handling
  console.log('Example 1: Authentication Error Handling');
  console.log('─'.repeat(50));
  
  // Check if credentials exist
  const credsPath = path.join(os.homedir(), '.gemini', 'oauth_creds.json');
  if (!fs.existsSync(credsPath)) {
    console.log('❌ OAuth credentials not found');
    console.log('💡 Solution: Run "gemini (follow setup prompts)" to authenticate');
    console.log();
  } else {
    console.log('✅ OAuth credentials found');
    
    try {
      const gemini = createGeminiProvider({
        authType: 'oauth-personal'
      });
      
      await generateText({
        model: gemini('gemini-2.5-pro'),
        prompt: 'Test auth',
        maxOutputTokens: 10,
      });
      
      console.log('✅ Authentication successful');
    } catch (error) {
      if (isAuthError(error)) {
        console.log('❌ Authentication failed:', error.message);
        console.log('💡 Try refreshing credentials: gemini (follow setup prompts)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
  }
  console.log();

  // Example 2: Model not found error
  console.log('Example 2: Invalid Model Error');
  console.log('─'.repeat(50));
  
  try {
    const gemini = createGeminiProvider({
      authType: 'oauth-personal'
    });
    
    await generateText({
      model: gemini('gemini-99-ultra'), // Invalid model
      prompt: 'Test',
      maxOutputTokens: 10,
    });
  } catch (error) {
    console.log('✅ Expected error caught:', error.message);
    console.log('💡 Available models: gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-pro-exp, and more');
  }
  console.log();

  // Example 3: Timeout handling
  console.log('Example 3: Timeout Handling');
  console.log('─'.repeat(50));
  
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 3000); // 3 second timeout
  
  try {
    const gemini = createGeminiProvider({
      authType: 'oauth-personal'
    });
    
    console.log('Making request with 3-second timeout...');
    
    const result = await generateText({
      model: gemini('gemini-2.5-pro'),
      prompt: 'Write a detailed essay about quantum computing',
      maxOutputTokens: 1000,
      abortSignal: controller.signal,
    });
    
    clearTimeout(timeout);
    console.log('✅ Completed within timeout');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('✅ Request aborted due to timeout');
      console.log('💡 Consider increasing timeout for complex requests');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
  console.log();

  // Example 4: Rate limit handling with retry
  console.log('Example 4: Rate Limit Handling');
  console.log('─'.repeat(50));
  
  try {
    const gemini = createGeminiProvider({
      authType: 'oauth-personal'
    });
    
    console.log('Attempting request with retry logic...');
    
    const result = await retryWithBackoff(async () => {
      return await generateText({
        model: gemini('gemini-2.5-pro'),
        prompt: 'Say hello',
        maxOutputTokens: 20,
      });
    }, 3, 1000);
    
    console.log('✅ Request successful:', result.content[0]?.text || 'Generated successfully');
  } catch (error) {
    console.log('❌ All retries failed:', error.message);
    
    if (error.message.includes('429') || error.message.includes('rate')) {
      console.log('💡 You\'ve hit the rate limit. Wait a bit before trying again.');
    }
  }
  console.log();

  // Example 5: Stream error handling
  console.log('Example 5: Stream Error Handling');
  console.log('─'.repeat(50));
  
  try {
    const gemini = createGeminiProvider({
      authType: 'oauth-personal'
    });
    
    console.log('Starting stream...');
    
    const stream = await streamText({
      model: gemini('gemini-2.5-pro'),
      prompt: 'Count to 10',
      maxOutputTokens: 100,
    });
    
    let chunkCount = 0;
    let processedText = '';
    try {
      for await (const chunk of stream.textStream) {
        chunkCount++;
        processedText += chunk;
        process.stdout.write(chunk);
        
        // Simulate an error condition after receiving some text
        if (processedText.length > 10) {
          throw new Error('Simulated stream processing error');
        }
      }
      console.log('\n✅ Stream completed successfully');
    } catch (streamError) {
      console.log(`\n⚠️  Stream error after ${chunkCount} chunks:`, streamError.message);
      console.log('💡 Partial content was received before the error');
    }
  } catch (error) {
    console.log('❌ Failed to start stream:', error.message);
  }
  console.log('\n');

  // Example 6: Input validation errors
  console.log('Example 6: Input Validation');
  console.log('─'.repeat(50));
  
  const gemini = createGeminiProvider({
    authType: 'oauth-personal'
  });
  
  // Test various invalid inputs
  const invalidInputs = [
    {
      name: 'Empty prompt',
      config: { prompt: '', maxOutputTokens: 10 },
    },
    {
      name: 'Negative max tokens',
      config: { prompt: 'Test', maxOutputTokens: -10 },
    },
    {
      name: 'Invalid temperature',
      config: { 
        prompt: 'Test', 
        maxOutputTokens: 10,
        temperature: 2.5, // Out of valid range (0-2)
      },
    },
  ];
  
  for (const test of invalidInputs) {
    try {
      if (test.name === 'Empty prompt') {
        // Empty prompt may need retries due to API behavior
        await retryWithBackoff(async () => {
          return await generateText({
            model: gemini('gemini-2.5-pro'),
            ...test.config,
          });
        }, 3, 500);
      } else {
        await generateText({
          model: gemini('gemini-2.5-pro'),
          ...test.config,
        });
      }
      console.log(`${test.name}: ⚠️  No validation error (may be valid)`);
    } catch (error) {
      console.log(`${test.name}: ✅ Caught error - ${error.message}`);
    }
  }
  console.log();

  // Example 7: Graceful degradation
  console.log('Example 7: Graceful Degradation');
  console.log('─'.repeat(50));
  
  async function generateWithFallback(prompt) {
    const models = ['gemini-2.5-pro', 'gemini-2.0-pro-exp'];
    
    for (const modelName of models) {
      try {
        console.log(`Trying ${modelName}...`);
        const result = await generateText({
          model: gemini(modelName),
          prompt,
          maxOutputTokens: 50,
        });
        console.log(`✅ Success with ${modelName}`);
        return result;
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message}`);
        if (modelName === models[models.length - 1]) {
          throw error; // Re-throw if all models failed
        }
      }
    }
  }
  
  try {
    const result = await generateWithFallback('Say hello');
    console.log('Result:', result.content[0].text);
  } catch (error) {
    console.log('❌ All models failed');
  }
  
  console.log('\n✅ Error handling examples completed!');
  console.log('\n💡 Error handling best practices:');
  console.log('- Always check for authentication before making requests');
  console.log('- Implement retry logic for transient failures');
  console.log('- Use AbortController for timeout management');
  console.log('- Provide clear error messages to users');
  console.log('- Consider fallback strategies for critical operations');
  console.log('- Log errors appropriately for debugging');
}

main().catch(error => {
  console.error('\n💥 Unhandled error:', error);
  process.exit(1);
});