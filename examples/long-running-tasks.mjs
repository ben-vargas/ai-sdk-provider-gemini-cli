#!/usr/bin/env node

/**
 * Long-Running Tasks Example
 * 
 * This example demonstrates how to handle complex, long-running tasks
 * with proper timeout management, progress tracking, and cancellation.
 * 
 * Key patterns shown:
 * 1. Timeout management with AbortController
 * 2. Real-time progress tracking with streaming
 * 3. User-initiated cancellation (Ctrl+C)
 * 4. Chunked processing for very large tasks
 * 
 * LIMITATION: The underlying gemini-cli-core does not support request
 * cancellation. While abort signals are handled correctly and will throw
 * AbortError, the actual Gemini API request continues in the background.
 */

import { generateText, streamText } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';

console.log('⏱️  Gemini CLI Provider - Long-Running Tasks\n');

const gemini = createGeminiProvider({
  authType: 'oauth-personal'
});

// Progress indicator
let activeProgress = null;

function createProgressIndicator(message) {
  // Stop any existing progress indicator
  if (activeProgress) {
    activeProgress.stop();
  }
  
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  let stopped = false;
  
  const interval = setInterval(() => {
    if (!stopped) {
      process.stdout.write(`\r${frames[i]} ${message}`);
      i = (i + 1) % frames.length;
    }
  }, 100);
  
  const progress = {
    stop: () => {
      if (!stopped) {
        stopped = true;
        clearInterval(interval);
        // Clear the entire line more thoroughly
        process.stdout.write('\r\x1b[K');
        if (activeProgress === progress) {
          activeProgress = null;
        }
      }
    }
  };
  
  activeProgress = progress;
  return progress;
}

async function main() {
  try {
    // Example 1: Timeout Management
    console.log('Example 1: Timeout Management');
    console.log('─'.repeat(50));
    console.log('Demonstrating both successful completion and timeout scenarios.');
    console.log('NOTE: Due to gemini-cli limitations, requests continue in background');
    console.log('even after timeout. The timeout only affects when YOU get the result.\n');
    
    // First, show a task that completes successfully
    const controller1 = new AbortController();
    const timeout1 = setTimeout(() => controller1.abort(), 60000); // 60 seconds
    
    console.log('📝 Task 1: Simple request (60-second timeout)...');
    console.log('   (Gemini CLI requests typically take 10-30 seconds)');
    const progress1 = createProgressIndicator('Processing');
    
    try {
      const result = await generateText({
        model: gemini('gemini-3-pro-preview'),
        prompt: 'Write a brief haiku about timeouts',
        abortSignal: controller1.signal,
      });
      
      clearTimeout(timeout1);
      progress1.stop();
      
      console.log('✅ Completed successfully!');
      console.log(`   Response: "${result.content[0].text.trim()}"`);
    } catch (error) {
      progress1.stop();
      if (error.name === 'AbortError') {
        console.log('⏱️  Task timed out');
      } else {
        throw error;
      }
    }
    
    // Now show a task that will timeout
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 1000); // Only 1 second!
    
    console.log('\n📝 Task 2: Complex request (1-second timeout)...');
    console.log('   (Will timeout after 1s, but request continues in background)');
    const progress2 = createProgressIndicator('Attempting complex analysis');
    
    try {
      const result = await generateText({
        model: gemini('gemini-3-pro-preview'),
        prompt: 'Write a comprehensive 1000-word analysis of quantum computing, covering history, current state, applications, challenges, and future prospects.',
        abortSignal: controller2.signal,
      });
      
      clearTimeout(timeout2);
      progress2.stop();
      
      console.log('✅ Surprisingly completed within 1 second!');
    } catch (error) {
      progress2.stop();
      if (error.name === 'AbortError') {
        console.log('⏱️  Task timed out after 1 second (as expected)');
      } else {
        throw error;
      }
    }
    console.log();

    // Example 2: Progress tracking with streaming
    console.log('Example 2: Real-time Progress Tracking');
    console.log('─'.repeat(50));
    console.log('Streaming responses with live progress updates.\n');
    
    const controller3 = new AbortController();
    const timeout3 = setTimeout(() => controller3.abort(), 30000); // 30 seconds
    
    console.log('Generating documentation...');
    
    const stream = await streamText({
      model: gemini('gemini-3-pro-preview'),
      prompt: 'Write comprehensive documentation for a REST API with 5 endpoints. Include descriptions, parameters, and examples.',
      maxOutputTokens: 500,
      abortSignal: controller3.signal,
    });
    
    let totalChars = 0;
    const startTime = Date.now();
    
    try {
      for await (const chunk of stream.textStream) {
        totalChars += chunk.length;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        process.stdout.write(`\r📝 Generated: ${totalChars} chars | Time: ${elapsed}s`);
      }
      
      clearTimeout(timeout3);
      const finalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`\r📝 Generated: ${totalChars} chars | Time: ${finalElapsed}s\n`);
      console.log('✅ Documentation generated successfully!');
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
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    
    const controller4 = new AbortController();
    
    // Handle Ctrl+C
    let cancelled = false;
    const sigintHandler = () => {
      if (!cancelled) {
        cancelled = true;
        console.log('\n\n🛑 Cancelling task...');
        controller4.abort();
      }
    };
    process.on('SIGINT', sigintHandler);
    
    // Auto-complete after 5 seconds if not cancelled
    const autoComplete = setTimeout(() => {
      if (!cancelled) {
        process.removeListener('SIGINT', sigintHandler);
      }
    }, 5000);
    
    const progress4 = createProgressIndicator('Generating content (5 seconds to cancel)');
    
    try {
      const result = await generateText({
        model: gemini('gemini-3-pro-preview'),
        prompt: 'Write a short story about a robot learning to paint.',
        abortSignal: controller4.signal,
      });
      
      clearTimeout(autoComplete);
      progress4.stop();
      
      if (!cancelled) {
        console.log('✅ Completed! (You didn\'t cancel)');
        console.log(`   Generated ${result.content[0].text.split(/\s+/).length} words`);
      }
    } catch (error) {
      progress4.stop();
      if (error.name === 'AbortError') {
        console.log('✅ Successfully cancelled by user');
      } else {
        throw error;
      }
    } finally {
      // Ensure progress is stopped
      progress4.stop();
    }
    
    // Clean up
    process.removeListener('SIGINT', sigintHandler);
    clearTimeout(autoComplete);
    console.log();

    // Example 4: Chunked processing
    console.log('Example 4: Chunked Processing');
    console.log('─'.repeat(50));
    console.log('Breaking large tasks into smaller chunks.\n');
    
    const sections = [
      'Introduction',
      'Core Concepts',
      'Best Practices',
      'Conclusion'
    ];
    
    const controller5 = new AbortController();
    const timeout5 = setTimeout(() => controller5.abort(), 180000); // 180 seconds (3 minutes) total
    
    const results = [];
    
    try {
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        console.log(`📖 Section ${i + 1}/${sections.length}: ${section}`);
        
        const progress = createProgressIndicator(`Writing ${section}`);
        
        const result = await generateText({
          model: gemini('gemini-3-pro-preview'),
          prompt: `Write a brief section titled "${section}" for a guide about effective API design. Keep it concise (2-3 paragraphs).`,
          abortSignal: controller5.signal,
        });
        
        progress.stop();
        results.push({
          section: section,
          wordCount: result.content[0].text.split(/\s+/).length,
          tokens: result.usage?.totalTokens || 0
        });
        
        console.log(`   ✅ Completed (${result.usage?.totalTokens || 0} tokens)\n`);
      }
      
      clearTimeout(timeout5);
      
      const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
      const totalWords = results.reduce((sum, r) => sum + r.wordCount, 0);
      
      console.log('✅ All sections completed!');
      console.log(`   Total: ${totalWords} words, ${totalTokens} tokens`);
    } catch (error) {
      // Ensure any active progress indicator is stopped
      process.stdout.write('\r\x1b[K');
      if (error.name === 'AbortError') {
        console.log('⏱️  Task timed out');
        console.log(`   Completed ${results.length} of ${sections.length} sections`);
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ All examples completed!');
    console.log('\n💡 Key takeaways:');
    console.log('- Use AbortController with setTimeout for timeouts');
    console.log('- Track progress with streaming for better UX');
    console.log('- Handle Ctrl+C gracefully for user cancellation');
    console.log('- Break large tasks into chunks for reliability');
    console.log('- Remember: Gemini requests continue in background even after abort');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Clean up any active progress indicator
    if (activeProgress) {
      activeProgress.stop();
    }
  }
}

main().catch(console.error).finally(() => {
  // Final cleanup
  if (activeProgress) {
    activeProgress.stop();
  }
  process.stdout.write('\r\x1b[K');
});