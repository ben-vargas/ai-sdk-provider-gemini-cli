#!/usr/bin/env node

/**
 * Conversation History Example
 * 
 * This example demonstrates how to maintain context across multiple messages
 * in a conversation, essential for building chatbots and conversational AI.
 */

import { generateText, streamText } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';

console.log('💬 Gemini CLI Provider - Conversation History\n');

async function main() {
  try {
    const gemini = createGeminiProvider({
      authType: 'oauth-personal'
    });

    // Example 1: Basic conversation
    console.log('Example 1: Simple Conversation');
    console.log('─'.repeat(50));

    const messages1 = [
      { role: 'user', content: 'My name is Sarah and I love astronomy.' },
      { role: 'assistant', content: 'Nice to meet you, Sarah! Astronomy is fascinating. What aspect of astronomy interests you most?' },
      { role: 'user', content: 'I love learning about exoplanets. What can you tell me about them?' }
    ];

    const result1 = await generateText({
      model: gemini('gemini-2.5-flash'),
      messages: messages1,
    });

    console.log('Conversation:');
    messages1.forEach(msg => {
      console.log(`${msg.role === 'user' ? '👤 User' : '🤖 Assistant'}: ${msg.content}`);
    });
    console.log(`🤖 Assistant: ${result1.text}`);
    console.log();

    // Example 2: Building context incrementally
    console.log('Example 2: Building Context Step by Step');
    console.log('─'.repeat(50));

    const conversation = [];
    
    // First message
    conversation.push({ role: 'user', content: 'I need help planning a trip to Japan.' });
    let response = await generateText({
      model: gemini('gemini-2.5-flash'),
      messages: conversation,
    });
    conversation.push({ role: 'assistant', content: response.text });
    console.log('👤 User:', conversation[0].content);
    console.log('🤖 Assistant:', response.text);
    console.log();

    // Second message
    conversation.push({ role: 'user', content: 'I have 10 days and I love nature and technology.' });
    response = await generateText({
      model: gemini('gemini-2.5-flash'),
      messages: conversation,
    });
    conversation.push({ role: 'assistant', content: response.text });
    console.log('👤 User:', conversation[2].content);
    console.log('🤖 Assistant:', response.text);
    console.log();

    // Third message - referencing earlier context
    conversation.push({ role: 'user', content: 'What was the first thing you suggested?' });
    response = await generateText({
      model: gemini('gemini-2.5-flash'),
      messages: conversation,
    });
    console.log('👤 User:', conversation[4].content);
    console.log('🤖 Assistant:', response.text);
    console.log();

    // Example 3: Conversation with system message
    console.log('Example 3: Conversation with System Context');
    console.log('─'.repeat(50));

    const result3 = await generateText({
      model: gemini('gemini-2.5-flash'),
      system: 'You are a helpful coding tutor. Keep explanations concise and include code examples.',
      messages: [
        { role: 'user', content: 'What is a closure in JavaScript?' },
        { role: 'assistant', content: 'A closure is a function that has access to variables in its outer scope, even after the outer function returns. Here\'s an example:\n\n```javascript\nfunction outer(x) {\n  return function inner(y) {\n    return x + y; // inner function can access x\n  };\n}\n\nconst add5 = outer(5);\nconsole.log(add5(3)); // 8\n```' },
        { role: 'user', content: 'Can you show me a practical use case?' }
      ],
    });

    console.log('System: You are a helpful coding tutor...');
    console.log('👤 User: What is a closure in JavaScript?');
    console.log('🤖 Assistant: [Previous explanation with code]');
    console.log('👤 User: Can you show me a practical use case?');
    console.log(`🤖 Assistant: ${result3.text}`);
    console.log();

    // Example 4: Streaming with conversation history
    console.log('Example 4: Streaming Conversation');
    console.log('─'.repeat(50));

    const streamMessages = [
      { role: 'user', content: 'I want to learn Python.' },
      { role: 'assistant', content: 'Great choice! Python is beginner-friendly and versatile. What\'s your programming experience level?' },
      { role: 'user', content: 'I know JavaScript well. What are the main differences?' }
    ];

    console.log('Previous conversation:');
    streamMessages.slice(0, -1).forEach(msg => {
      console.log(`${msg.role === 'user' ? '👤' : '🤖'}: ${msg.content}`);
    });
    console.log(`👤: ${streamMessages[streamMessages.length - 1].content}`);
    console.log('🤖: ');

    const stream = await streamText({
      model: gemini('gemini-2.5-flash'),
      messages: streamMessages,
    });

    for await (const chunk of stream.textStream) {
      process.stdout.write(chunk);
    }
    console.log('\n');

    // Example 5: Token usage in conversations
    console.log('Example 5: Monitoring Token Usage');
    console.log('─'.repeat(50));

    const tokenTestMessages = [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello! How can I help you today?' },
      { role: 'user', content: 'Tell me a fun fact' },
    ];

    const tokenResult = await generateText({
      model: gemini('gemini-2.5-flash'),
      messages: tokenTestMessages,
    });

    console.log('Conversation length:', tokenTestMessages.length, 'messages');
    console.log('Response:', tokenResult.text);
    console.log('\nToken usage:');
    console.log('- Prompt tokens:', tokenResult.usage?.promptTokens || 'N/A');
    console.log('- Completion tokens:', tokenResult.usage?.completionTokens || 'N/A');
    console.log('- Total tokens:', tokenResult.usage?.totalTokens || 'N/A');
    
    console.log('\n✅ All conversation examples completed!');
    console.log('\n💡 Tips:');
    console.log('- Messages array preserves full conversation context');
    console.log('- Include both user and assistant messages for continuity');
    console.log('- System messages set the overall behavior');
    console.log('- Monitor token usage as conversations grow');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);