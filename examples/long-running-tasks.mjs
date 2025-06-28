#!/usr/bin/env node

/**
 * Long-Running Tasks Example
 * 
 * This example demonstrates how to handle complex, long-running tasks
 * with proper timeout management, progress tracking, and cancellation.
 */

import { generateText, streamText } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';

console.log('⏱️  Gemini CLI Provider - Long-Running Tasks\n');

const gemini = createGeminiProvider({
  authType: 'oauth-personal'
});

// Progress indicator
function createProgressIndicator(message) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[i]} ${message}`);
    i = (i + 1) % frames.length;
  }, 100);
  
  return {
    stop: () => {
      clearInterval(interval);
      process.stdout.write('\r' + ' '.repeat(message.length + 3) + '\r');
    }
  };
}

async function main() {
  try {
    // Example 1: Simple timeout management
    console.log('Example 1: Task with Custom Timeout');
    console.log('─'.repeat(50));
    
    const controller1 = new AbortController();
    const timeout1 = setTimeout(() => controller1.abort(), 10000); // 10 seconds
    
    console.log('Running analysis with 10-second timeout...');
    const progress1 = createProgressIndicator('Analyzing code patterns');
    
    try {
      const result = await generateText({
        model: gemini('gemini-2.5-flash'),
        prompt: 'Analyze the architectural patterns in a typical microservices application. Include pros, cons, and best practices.',
        maxTokens: 500,
        abortSignal: controller1.signal,
      });
      
      clearTimeout(timeout1);
      progress1.stop();
      
      console.log('✅ Analysis completed!');
      console.log(`Response length: ${result.text.length} characters`);
      console.log(`Tokens used: ${result.usage?.totalTokens || 'N/A'}`);
    } catch (error) {
      progress1.stop();
      if (error.name === 'AbortError') {
        console.log('⏱️  Task timed out after 10 seconds');
      } else {
        throw error;
      }
    }
    console.log();

    // Example 2: Progress tracking with streaming
    console.log('Example 2: Progress Tracking with Streaming');
    console.log('─'.repeat(50));
    
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 30000); // 30 seconds
    
    console.log('Generating detailed documentation...');
    
    const stream = await streamText({
      model: gemini('gemini-2.5-flash'),
      prompt: 'Write comprehensive documentation for a REST API with 10 endpoints. Include descriptions, parameters, responses, and examples.',
      maxTokens: 1000,
      abortSignal: controller2.signal,
    });
    
    let totalChars = 0;
    let sections = 0;
    const startTime = Date.now();
    
    try {
      for await (const chunk of stream.textStream) {
        totalChars += chunk.length;
        
        // Track sections (rough estimate)
        if (chunk.includes('###') || chunk.includes('## ')) {
          sections++;
        }
        
        // Update progress
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        process.stdout.write(`\r📝 Generated: ${totalChars} chars | Sections: ${sections} | Time: ${elapsed}s`);
      }
      
      clearTimeout(timeout2);
      console.log('\n✅ Documentation generated successfully!');
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('\n⏱️  Stream timed out');
      } else {
        throw error;
      }
    }
    console.log();

    // Example 3: User-initiated cancellation
    console.log('Example 3: User-Initiated Cancellation');
    console.log('─'.repeat(50));
    
    const controller3 = new AbortController();
    
    console.log('Press Ctrl+C to cancel the task...');
    console.log('Generating comprehensive business plan...\n');
    
    // Handle Ctrl+C
    let cancelled = false;
    process.on('SIGINT', () => {
      if (!cancelled) {
        cancelled = true;
        console.log('\n\n🛑 Cancelling task...');
        controller3.abort();
      }
    });
    
    const progress3 = createProgressIndicator('Working on business plan');
    
    try {
      const result = await generateText({
        model: gemini('gemini-2.5-flash'),
        prompt: 'Create a detailed business plan for a sustainable technology startup, including market analysis, financial projections, and growth strategy.',
        maxTokens: 2000,
        abortSignal: controller3.signal,
      });
      
      progress3.stop();
      console.log('✅ Business plan completed!');
      console.log(`Generated ${result.text.split(/\s+/).length} words`);
    } catch (error) {
      progress3.stop();
      if (error.name === 'AbortError') {
        console.log('✅ Task cancelled by user');
      } else {
        throw error;
      }
    }
    
    // Reset SIGINT handler
    process.removeAllListeners('SIGINT');
    console.log();

    // Example 4: Chunked processing for very long tasks
    console.log('Example 4: Chunked Processing');
    console.log('─'.repeat(50));
    
    const chapters = [
      'Introduction to Machine Learning',
      'Supervised Learning Algorithms',
      'Unsupervised Learning Techniques',
      'Deep Learning Fundamentals',
      'Practical Applications'
    ];
    
    console.log('Generating a 5-chapter technical book...\n');
    
    const controller4 = new AbortController();
    const timeout4 = setTimeout(() => controller4.abort(), 60000); // 1 minute total
    
    const bookContent = [];
    
    try {
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        console.log(`📖 Chapter ${i + 1}: ${chapter}`);
        
        const progress = createProgressIndicator(`Writing chapter ${i + 1} of ${chapters.length}`);
        
        const result = await generateText({
          model: gemini('gemini-2.5-flash'), // Using faster model for chunks
          prompt: `Write Chapter ${i + 1}: "${chapter}" for a technical book on machine learning. Make it detailed but concise (about 200 words).`,
          maxTokens: 300,
          abortSignal: controller4.signal,
        });
        
        progress.stop();
        bookContent.push({
          chapter: chapter,
          content: result.text,
          tokens: result.usage?.totalTokens || 0
        });
        
        console.log(`   ✅ Completed (${result.usage?.totalTokens || 0} tokens)\n`);
      }
      
      clearTimeout(timeout4);
      
      const totalTokens = bookContent.reduce((sum, ch) => sum + ch.tokens, 0);
      console.log('✅ Book generation completed!');
      console.log(`Total tokens used: ${totalTokens}`);
      console.log(`Total chapters: ${bookContent.length}`);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('\n⏱️  Task timed out');
        console.log(`Completed ${bookContent.length} of ${chapters.length} chapters`);
      } else {
        throw error;
      }
    }
    console.log();

    // Example 5: Adaptive timeout based on complexity
    console.log('Example 5: Adaptive Timeout');
    console.log('─'.repeat(50));
    
    const tasks = [
      { prompt: 'Say hello', complexity: 'simple', timeoutMs: 5000 },
      { prompt: 'Explain quantum computing in one paragraph', complexity: 'medium', timeoutMs: 15000 },
      { prompt: 'Write a detailed comparison of 5 programming paradigms with examples', complexity: 'complex', timeoutMs: 30000 }
    ];
    
    for (const task of tasks) {
      console.log(`\n🎯 Task (${task.complexity}): "${task.prompt.substring(0, 50)}..."`);
      console.log(`   Timeout: ${task.timeoutMs / 1000} seconds`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), task.timeoutMs);
      
      const startTime = Date.now();
      const progress = createProgressIndicator('Processing');
      
      try {
        const result = await generateText({
          model: gemini('gemini-2.5-flash'),
          prompt: task.prompt,
          maxTokens: task.complexity === 'complex' ? 1000 : 200,
          abortSignal: controller.signal,
        });
        
        clearTimeout(timeout);
        progress.stop();
        
        const duration = Date.now() - startTime;
        console.log(`   ✅ Completed in ${(duration / 1000).toFixed(1)}s`);
        console.log(`   Response length: ${result.text.length} chars`);
      } catch (error) {
        progress.stop();
        if (error.name === 'AbortError') {
          console.log(`   ⏱️  Timed out after ${task.timeoutMs / 1000}s`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ All long-running task examples completed!');
    console.log('\n💡 Best practices for long-running tasks:');
    console.log('- Always use AbortController for cancellation');
    console.log('- Set appropriate timeouts based on task complexity');
    console.log('- Provide visual feedback for progress');
    console.log('- Consider chunking very large tasks');
    console.log('- Use faster models (flash) when appropriate');
    console.log('- Handle cancellation gracefully');
    console.log('- Save partial results when possible');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);