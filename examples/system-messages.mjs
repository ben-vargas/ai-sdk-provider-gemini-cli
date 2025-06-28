#!/usr/bin/env node

/**
 * System Messages Example
 * 
 * This example demonstrates how to use system messages (instructions)
 * to control the behavior and personality of the Gemini model.
 */

import { generateText, streamText } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';

console.log('🎭 Gemini CLI Provider - System Messages\n');

const gemini = createGeminiProvider({
  authType: 'oauth-personal'
});

async function main() {
  try {
    // Example 1: Basic system instruction
    console.log('Example 1: Basic System Instruction');
    console.log('─'.repeat(50));
    
    const result1 = await generateText({
      model: gemini('gemini-2.5-flash'),
      system: 'You are a helpful assistant who always responds in haiku format.',
      prompt: 'Explain what JavaScript is',
    });
    
    console.log('System: Respond in haiku format');
    console.log('Prompt: Explain what JavaScript is');
    console.log('Response:');
    console.log(result1.text);
    console.log();

    // Example 2: Professional tone
    console.log('Example 2: Professional Technical Writer');
    console.log('─'.repeat(50));
    
    const result2 = await generateText({
      model: gemini('gemini-2.5-flash'),
      system: 'You are a professional technical writer. Be concise, accurate, and use bullet points when appropriate. Avoid casual language.',
      prompt: 'What are the benefits of using TypeScript?',
    });
    
    console.log('Response:');
    console.log(result2.text);
    console.log();

    // Example 3: Code assistant
    console.log('Example 3: Code Assistant');
    console.log('─'.repeat(50));
    
    const result3 = await generateText({
      model: gemini('gemini-2.5-flash'),
      system: 'You are a senior software engineer. Provide code examples when relevant, explain your reasoning, and mention best practices. Use markdown for code blocks.',
      prompt: 'How do I handle errors in async/await?',
    });
    
    console.log('Response:');
    console.log(result3.text);
    console.log();

    // Example 4: Language teacher
    console.log('Example 4: Language Teacher');
    console.log('─'.repeat(50));
    
    const result4 = await generateText({
      model: gemini('gemini-2.5-flash'),
      system: 'You are a friendly language teacher. Explain concepts simply, provide examples, and encourage learning. Use emojis to make responses engaging.',
      prompt: 'Teach me how to say common greetings in Spanish',
    });
    
    console.log('Response:');
    console.log(result4.text);
    console.log();

    // Example 5: System message with conversation
    console.log('Example 5: System Message with Conversation');
    console.log('─'.repeat(50));
    
    const result5 = await generateText({
      model: gemini('gemini-2.5-flash'),
      system: 'You are a pirate captain. Speak in pirate dialect, use nautical terms, and be adventurous in your responses.',
      messages: [
        { role: 'user', content: 'Who are you?' },
        { role: 'assistant', content: 'Ahoy there, matey! I be Captain Blackbeard, the most fearsome pirate to sail the seven seas! Me ship, the Crimson Revenge, has plundered more treasure than ye can imagine! What brings ye to me quarters?' },
        { role: 'user', content: 'I want to learn about navigation' }
      ],
    });
    
    console.log('System: Pirate captain persona');
    console.log('Conversation with pirate captain...');
    console.log('Response:');
    console.log(result5.text);
    console.log();

    // Example 6: Streaming with system message
    console.log('Example 6: Streaming with System Context');
    console.log('─'.repeat(50));
    
    console.log('System: Recipe creator with specific format');
    console.log('Streaming response...\n');
    
    const stream = await streamText({
      model: gemini('gemini-2.5-flash'),
      system: 'You are a professional chef. Format recipes with: 1) Brief introduction 2) Ingredients list with measurements 3) Step-by-step instructions 4) Chef tips. Use clear formatting.',
      prompt: 'Create a recipe for chocolate chip cookies',
    });
    
    for await (const chunk of stream.textStream) {
      process.stdout.write(chunk);
    }
    console.log('\n');

    // Example 7: Multiple system behaviors
    console.log('Example 7: Comparing Different System Instructions');
    console.log('─'.repeat(50));
    
    const prompt = 'How does photosynthesis work?';
    
    const systems = [
      { 
        name: 'Five-year-old explanation',
        instruction: 'Explain everything as if talking to a curious 5-year-old. Use simple words and fun comparisons.'
      },
      {
        name: 'Scientific explanation',
        instruction: 'You are a biology professor. Use scientific terminology and be technically accurate.'
      },
      {
        name: 'Analogy-based explanation',
        instruction: 'Explain concepts using creative analogies and metaphors that relate to everyday life.'
      }
    ];
    
    for (const system of systems) {
      console.log(`\n${system.name}:`);
      const result = await generateText({
        model: gemini('gemini-2.5-flash'), // Using flash for faster comparison
        system: system.instruction,
        prompt,
        maxTokens: 150,
      });
      console.log(result.text);
    }
    
    console.log('\n✅ All system message examples completed!');
    console.log('\n💡 System message tips:');
    console.log('- System messages set the overall behavior and tone');
    console.log('- They persist throughout the conversation');
    console.log('- Be specific about format, style, and constraints');
    console.log('- Can define personas, expertise levels, or output formats');
    console.log('- Combine with conversation history for consistent behavior');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);