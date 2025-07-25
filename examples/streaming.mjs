#!/usr/bin/env node

/**
 * Streaming Example
 * 
 * This example demonstrates how to use streaming responses for real-time
 * text generation, providing a more responsive user experience.
 */

import { streamText } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';

console.log('🌊 Gemini CLI Provider - Streaming Example\n');

async function main() {
  try {
    const gemini = createGeminiProvider({
      authType: 'oauth-personal'
    });

    // Example 1: Basic streaming
    console.log('Example 1: Basic Streaming');
    console.log('─'.repeat(50));
    console.log('Generating story...\n');

    const result1 = await streamText({
      model: gemini('gemini-2.5-pro'),
      prompt: 'Write a short story about a robot learning to paint (3 paragraphs)',
    });

    // Stream the text chunks as they arrive
    for await (const chunk of result1.textStream) {
      process.stdout.write(chunk);
    }
    
    // Get the final result
    const { text: finalText1, usage: usage1 } = await result1;
    
    console.log('\n\nTokens used:', usage1?.totalTokens || 'N/A');
    console.log();

    // Example 2: Streaming with system message
    console.log('Example 2: Streaming with System Context');
    console.log('─'.repeat(50));
    console.log('Generating numbered list...\n');

    const result2 = await streamText({
      model: gemini('gemini-2.5-pro'),
      system: 'You are a helpful assistant. Always format lists with emojis.',
      prompt: 'List 5 tips for learning a new programming language',
    });

    for await (const chunk of result2.textStream) {
      process.stdout.write(chunk);
    }
    
    console.log('\n');

    // Example 3: Streaming with abort signal
    console.log('Example 3: Streaming with Timeout');
    console.log('─'.repeat(50));
    console.log('Generating response with 10-second timeout...\n');

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log('\n⏱️  Aborting due to timeout...');
      controller.abort();
    }, 10000);

    try {
      const result3 = await streamText({
        model: gemini('gemini-2.5-pro'),
        prompt: 'Count from 1 to 20 slowly, with a description for each number',
        abortSignal: controller.signal,
      });

      for await (const chunk of result3.textStream) {
        process.stdout.write(chunk);
      }
      
      clearTimeout(timeout);
      console.log('\n✅ Completed before timeout');
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('✅ Successfully aborted the stream');
      } else {
        throw error;
      }
    }
    
    console.log();

    // Example 4: Streaming with real-time processing
    console.log('Example 4: Real-time Stream Processing');
    console.log('─'.repeat(50));
    console.log('Analyzing text as it streams...\n');

    const result4 = await streamText({
      model: gemini('gemini-2.5-pro'), // Using pro model for quality
      prompt: 'List the planets in our solar system with one interesting fact each',
    });

    let wordCount = 0;
    let planetCount = 0;
    
    for await (const chunk of result4.textStream) {
      process.stdout.write(chunk);
      
      // Real-time analysis
      wordCount += chunk.split(/\s+/).filter(w => w.length > 0).length;
      if (chunk.toLowerCase().includes('planet') || chunk.match(/mercury|venus|earth|mars|jupiter|saturn|uranus|neptune/i)) {
        planetCount++;
      }
    }
    
    console.log('\n\nStream Analysis:');
    console.log(`Words streamed: ${wordCount}`);
    console.log(`Planet mentions: ${planetCount}`);
    
    const { usage: usage4 } = await result4;
    console.log(`Tokens used: ${usage4?.totalTokens || 'N/A'}`);
    
    console.log('\n✅ All streaming examples completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication tip: Run "gemini (follow setup prompts)"');
    }
  }
}

// Helper function to add delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);