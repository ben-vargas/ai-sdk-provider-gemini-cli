# Gemini CLI Provider for AI SDK v5 Guide

This guide covers how to use the Gemini CLI Provider with Vercel AI SDK v5.

## Table of Contents

- [Installation](#installation)
- [Authentication](#authentication)
- [Basic Usage](#basic-usage)
- [Streaming](#streaming)
- [Conversation History](#conversation-history)
- [System Messages](#system-messages)
- [Structured Output](#structured-output)
- [Error Handling](#error-handling)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)

## Installation

```bash
# Install the beta versions
npm install ai-sdk-provider-gemini-cli@beta ai@beta

# Install and set up Gemini CLI
npm install -g @google/gemini-cli
gemini  # Follow authentication setup
```

## Authentication

### OAuth Authentication (Recommended)

```typescript
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';

const gemini = createGeminiProvider({
  authType: 'oauth-personal',
});
```

### API Key Authentication

```typescript
const gemini = createGeminiProvider({
  authType: 'api-key',
  apiKey: process.env.GEMINI_API_KEY,
});
```

## Basic Usage

### Text Generation

```typescript
import { generateText } from 'ai';
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';

const gemini = createGeminiProvider({
  authType: 'oauth-personal',
});

async function generate() {
  const result = await generateText({
    model: gemini('gemini-2.5-pro'),
    prompt: 'Write a haiku about coding',
  });

  console.log(result.text);
  console.log(`Tokens used: ${result.usage?.totalTokens}`);
}
```

### Model Configuration

```typescript
const model = gemini('gemini-2.5-pro', {
  temperature: 0.7,        // Creativity (0-2)
  maxOutputTokens: 1000,   // Max tokens to generate
  topP: 0.95,             // Nucleus sampling
  topK: 40,               // Top-k sampling
});
```

## Streaming

### Basic Streaming

```typescript
import { streamText } from 'ai';

async function stream() {
  const result = await streamText({
    model: gemini('gemini-2.5-pro'),
    prompt: 'Tell me a story about a robot',
  });

  // Stream chunks as they arrive
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  // Access full text after streaming
  const fullText = await result.text;
  console.log('\n\nFull text length:', fullText.length);
}
```

### Progress Tracking

```typescript
async function streamWithProgress() {
  const result = await streamText({
    model: gemini('gemini-2.5-pro'),
    prompt: 'Write a detailed article about AI',
  });

  let charCount = 0;
  const startTime = Date.now();

  for await (const chunk of result.textStream) {
    charCount += chunk.length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`\r📝 Generated: ${charCount} chars | Time: ${elapsed}s`);
  }

  console.log('\n✅ Complete!');
}
```

## Conversation History

### Multi-turn Conversations

```typescript
async function conversation() {
  const result = await generateText({
    model: gemini('gemini-2.5-pro'),
    messages: [
      { role: 'user', content: 'My name is Alice' },
      { role: 'assistant', content: 'Nice to meet you, Alice! How can I help you today?' },
      { role: 'user', content: 'What is my name?' },
    ],
  });

  console.log(result.text); // Should remember "Alice"
}
```

### Building Conversation Context

```typescript
const messages = [];

function addUserMessage(content: string) {
  messages.push({ role: 'user', content });
}

function addAssistantMessage(content: string) {
  messages.push({ role: 'assistant', content });
}

async function continueConversation(userInput: string) {
  addUserMessage(userInput);
  
  const result = await generateText({
    model: gemini('gemini-2.5-pro'),
    messages,
  });

  addAssistantMessage(result.text);
  return result.text;
}
```

## System Messages

### Setting Model Behavior

```typescript
async function withSystemMessage() {
  const result = await generateText({
    model: gemini('gemini-2.5-pro'),
    system: 'You are a helpful coding assistant. Always include code examples in your responses.',
    prompt: 'How do I read a file in Node.js?',
  });

  console.log(result.text); // Will include code examples
}
```

### Complex System Instructions

```typescript
const system = `You are an expert TypeScript developer.
- Always use modern ES6+ syntax
- Include type annotations
- Follow best practices
- Explain your code clearly`;

const result = await generateText({
  model: gemini('gemini-2.5-pro'),
  system,
  prompt: 'Create a generic cache class',
});
```

## Structured Output

### Basic Object Generation

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

async function generateProduct() {
  const result = await generateObject({
    model: gemini('gemini-2.5-pro'),
    schema: z.object({
      name: z.string().describe('Product name'),
      price: z.number().describe('Price in USD'),
      inStock: z.boolean().describe('Availability'),
    }),
    prompt: 'Generate a laptop product',
  });

  console.log(result.object);
  // { name: "UltraBook Pro", price: 1299.99, inStock: true }
}
```

### Nested Structures

```typescript
const CompanySchema = z.object({
  name: z.string(),
  founded: z.number(),
  employees: z.array(z.object({
    name: z.string(),
    role: z.string(),
    department: z.string(),
  })),
  metrics: z.object({
    revenue: z.number(),
    growth: z.number(),
  }),
});

const result = await generateObject({
  model: gemini('gemini-2.5-pro'),
  schema: CompanySchema,
  prompt: 'Generate a tech startup company profile',
});
```

### Handling Validation

```typescript
try {
  const result = await generateObject({
    model: gemini('gemini-2.5-pro'),
    schema: z.object({
      description: z.string().max(100), // Strict limit
    }),
    prompt: 'Describe quantum computing',
  });
} catch (error) {
  // Note: Error may say "could not parse" but usually means
  // validation failed (e.g., string too long)
  console.error('Validation failed:', error.message);
}
```

## Error Handling

### Basic Error Handling

```typescript
try {
  const result = await generateText({
    model: gemini('gemini-2.5-pro'),
    prompt: 'Hello',
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
  } else if (error.message.includes('quota')) {
    console.log('Rate limit exceeded');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Timeout Management

```typescript
async function withTimeout() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10 seconds

  try {
    const result = await generateText({
      model: gemini('gemini-2.5-pro'),
      prompt: 'Write a detailed analysis',
      abortSignal: controller.signal,
    });
    
    clearTimeout(timeout);
    return result.text;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request timed out');
    }
    throw error;
  }
}
```

**Note**: Due to gemini-cli-core limitations, aborted requests continue in the background even though the SDK throws AbortError.

## Advanced Features

### Multimodal Input (Images)

```typescript
import { readFileSync } from 'fs';

async function analyzeImage() {
  const imageBuffer = readFileSync('diagram.png');
  const base64Image = imageBuffer.toString('base64');

  const result = await generateText({
    model: gemini('gemini-2.5-pro'),
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'What is shown in this image?' },
        { type: 'image', data: base64Image },
      ],
    }],
  });

  console.log(result.text);
}
```

### Token Usage Monitoring

```typescript
async function trackUsage() {
  const results = [];
  
  for (const prompt of prompts) {
    const result = await generateText({
      model: gemini('gemini-2.5-pro'),
      prompt,
    });
    
    results.push({
      prompt: prompt.substring(0, 50),
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
      totalTokens: result.usage?.totalTokens || 0,
    });
  }
  
  const totalTokens = results.reduce((sum, r) => sum + r.totalTokens, 0);
  console.log('Total tokens used:', totalTokens);
}
```

## Best Practices

### 1. Model Selection

- Use **gemini-2.5-pro** for complex tasks requiring high quality output
- Use **gemini-2.5-flash** for simpler tasks where speed is important
- Note: gemini-2.5-pro may return empty responses with `maxOutputTokens` set

### 2. Prompt Engineering

```typescript
// Be specific and clear
const goodPrompt = `Write a Python function that:
1. Takes a list of integers as input
2. Returns the sum of even numbers
3. Includes type hints
4. Has a docstring`;

// Avoid vague prompts
const badPrompt = 'Write a function';
```

### 3. Error Recovery

```typescript
async function generateWithRetry(prompt: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await generateText({
        model: gemini('gemini-2.5-pro'),
        prompt,
      });
      return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

### 4. Memory Management

For long conversations, consider truncating message history:

```typescript
function truncateMessages(messages: any[], maxMessages = 20) {
  if (messages.length <= maxMessages) return messages;
  
  // Keep system message (if any) and recent messages
  const systemMsg = messages.find(m => m.role === 'system');
  const recentMessages = messages.slice(-maxMessages);
  
  return systemMsg ? [systemMsg, ...recentMessages] : recentMessages;
}
```

### 5. Streaming Best Practices

```typescript
// Clean up resources on error
async function safeStream() {
  let result;
  
  try {
    result = await streamText({
      model: gemini('gemini-2.5-pro'),
      prompt: 'Tell me a story',
    });
    
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
  } catch (error) {
    console.error('Stream error:', error);
    // Ensure stream is properly closed
    if (result?.textStream) {
      result.textStream.return?.();
    }
  }
}
```

## Next Steps

- Explore the [examples](../../examples/) directory for more patterns
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Review [BREAKING_CHANGES.md](./BREAKING_CHANGES.md) if migrating from v4