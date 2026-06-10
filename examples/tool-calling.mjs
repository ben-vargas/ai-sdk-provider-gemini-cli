#!/usr/bin/env node

/**
 * Tool Calling Example
 *
 * This example demonstrates how to expose a local tool to Gemini through the
 * Vercel AI SDK and let the model use the tool result in its final answer.
 */

import { generateText, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { createGeminiProvider } from '../dist/index.mjs';

console.log('Gemini CLI Provider - Tool Calling Example\n');

const weatherByLocation = {
  santiago: {
    location: 'Santiago, Chile',
    condition: 'clear',
    temperatureC: 14,
    windKph: 8,
  },
  london: {
    location: 'London, UK',
    condition: 'rain',
    temperatureC: 11,
    windKph: 18,
  },
  tokyo: {
    location: 'Tokyo, Japan',
    condition: 'humid',
    temperatureC: 24,
    windKph: 6,
  },
};

async function main() {
  try {
    const gemini = createGeminiProvider({
      authType: 'oauth-personal',
    });

    const result = await generateText({
      model: gemini('gemini-3-flash-preview'),
      prompt:
        'Use the getWeather tool to check Santiago, then tell me whether I should bring a jacket.',
      tools: {
        getWeather: tool({
          description: 'Get the current weather for a supported city.',
          inputSchema: z.object({
            location: z
              .string()
              .describe('City name, for example Santiago, London, or Tokyo'),
          }),
          execute: async ({ location }) => {
            const key = location.toLowerCase().split(',')[0].trim();
            return (
              weatherByLocation[key] ?? {
                location,
                condition: 'unknown',
                temperatureC: 18,
                windKph: 10,
              }
            );
          },
        }),
      },
      stopWhen: stepCountIs(2),
    });

    console.log('Final answer:');
    console.log(result.text || 'No final text generated');

    console.log('\nTool calls:');
    for (const call of result.toolCalls) {
      console.log(`- ${call.toolName}: ${JSON.stringify(call.input)}`);
    }

    console.log('\nTool results:');
    for (const toolResult of result.toolResults) {
      console.log(
        `- ${toolResult.toolName}: ${JSON.stringify(toolResult.output)}`
      );
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nTips:');
    console.log('- Build the provider first: npm run build');
    console.log('- Authenticate with Gemini CLI: gemini');
    console.log('- Verify authentication: node examples/check-auth.mjs');
  }
}

main().catch(console.error);
