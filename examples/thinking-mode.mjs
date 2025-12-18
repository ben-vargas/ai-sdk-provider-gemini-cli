/**
 * Thinking Mode Examples
 *
 * Demonstrates how to use Gemini's thinking/reasoning mode with thinkingConfig.
 * - thinkingLevel for Gemini 3 models (gemini-3-pro-preview, gemini-3-flash-preview)
 * - thinkingBudget for Gemini 2.5 models
 *
 * ThinkingLevel values for Gemini 3:
 * - 'low': Minimizes latency and cost. Best for simple tasks.
 * - 'medium': Balanced thinking for most tasks. (Gemini 3 Flash only)
 * - 'high': Maximizes reasoning depth. May take longer for first token.
 * - 'minimal': Matches "no thinking" for most queries. (Gemini 3 Flash only)
 *
 * Run: node examples/thinking-mode.mjs
 */

import { generateText, streamText } from 'ai';
import { createGeminiProvider, ThinkingLevel } from '../dist/index.mjs';

const gemini = createGeminiProvider({
  authType: 'oauth-personal',
});

// Helper to format output
function printSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

function printResult(label, text, tokens) {
  console.log(`${label}:`);
  console.log('-'.repeat(40));
  console.log(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
  if (tokens) {
    console.log(`\nTokens: ${tokens.inputTokens} in / ${tokens.outputTokens} out`);
  }
  console.log();
}

async function main() {
  console.log('Thinking Mode Examples for Gemini 3 Flash');
  console.log('Using gemini-3-flash-preview with various thinkingLevel settings\n');

  // ============================================================
  // Example 1: Using thinkingLevel with string (case-insensitive)
  // ============================================================
  printSection('1. ThinkingLevel as String (Case-Insensitive)');

  const reasoningProblem = `
    A farmer has 17 sheep. All but 9 run away. How many sheep does the farmer have left?
    Think through this step by step.
  `;

  try {
    // Using lowercase string
    const result1 = await generateText({
      model: gemini('gemini-3-flash-preview', {
        thinkingConfig: {
          thinkingLevel: 'high', // lowercase works
        },
      }),
      prompt: reasoningProblem,
    });

    printResult('With thinkingLevel: "high" (string)', result1.text, result1.usage);
  } catch (error) {
    console.log('Error:', error.message);
  }

  // ============================================================
  // Example 2: Using ThinkingLevel enum for type safety
  // ============================================================
  printSection('2. ThinkingLevel Enum (Type-Safe)');

  try {
    const result2 = await generateText({
      model: gemini('gemini-3-flash-preview', {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH, // Using enum
        },
      }),
      prompt: 'What is 15% of 240? Show your reasoning.',
    });

    printResult('With ThinkingLevel.HIGH (enum)', result2.text, result2.usage);
  } catch (error) {
    console.log('Error:', error.message);
  }

  // ============================================================
  // Example 3: Comparing low vs high thinkingLevel
  // ============================================================
  printSection('3. Comparing Low vs High ThinkingLevel');

  const complexProblem = `
    If a train leaves Station A at 9:00 AM traveling at 60 mph, and another train
    leaves Station B (which is 180 miles away) at 10:00 AM traveling toward
    Station A at 80 mph, at what time will they meet?
  `;

  // Test just two contrasting levels to avoid rate limiting
  const levels = ['low', 'high'];

  for (const level of levels) {
    try {
      console.log(`Testing thinkingLevel: "${level}"...`);
      const startTime = Date.now();

      const result = await generateText({
        model: gemini('gemini-3-flash-preview', {
          thinkingConfig: {
            thinkingLevel: level,
          },
        }),
        prompt: complexProblem,
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`  Duration: ${duration}s`);
      console.log(`  Tokens: ${result.usage?.inputTokens ?? 'N/A'} in / ${result.usage?.outputTokens ?? 'N/A'} out`);
      console.log(`  Answer preview: ${result.text?.slice(0, 100) || '(empty response)'}...`);
      console.log();

      // Small delay between requests to avoid rate limiting
      if (level !== levels[levels.length - 1]) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error) {
      console.log(`  Error with ${level}: ${error.message}\n`);
    }
  }

  // ============================================================
  // Example 4: Streaming with thinkingConfig
  // ============================================================
  printSection('4. Streaming with ThinkingConfig');

  try {
    console.log('Streaming response with thinkingLevel: "high"...\n');

    const result = streamText({
      model: gemini('gemini-3-flash-preview', {
        thinkingConfig: {
          thinkingLevel: 'high',
        },
      }),
      prompt: 'Explain why the sky is blue in simple terms.',
    });

    process.stdout.write('Response: ');
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }

    // Await usage separately (AI SDK v5 pattern)
    const usage = await result.usage;
    console.log(`\n\nTokens: ${usage?.inputTokens ?? 'N/A'} in / ${usage?.outputTokens ?? 'N/A'} out`);
  } catch (error) {
    console.log('Error:', error.message);
  }

  // ============================================================
  // Example 5: thinkingConfig in model settings (default for all calls)
  // ============================================================
  printSection('5. ThinkingConfig in Model Settings');

  try {
    // Create a model with default thinkingConfig
    const thinkingModel = gemini('gemini-3-flash-preview', {
      thinkingConfig: {
        thinkingLevel: 'medium',
      },
    });

    console.log('Using model with default thinkingLevel: "medium"');

    const result = await generateText({
      model: thinkingModel,
      prompt: 'What is the capital of France?',
    });

    printResult('Simple question with medium thinking', result.text, result.usage);
  } catch (error) {
    console.log('Error:', error.message);
  }

  // ============================================================
  // Example 6: Code generation with high thinking
  // ============================================================
  printSection('6. Code Generation with High Thinking');

  try {
    const result = await generateText({
      model: gemini('gemini-3-flash-preview', {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      }),
      prompt: `
        Write a TypeScript function that finds the longest palindromic substring
        in a given string. Include comments explaining the algorithm.
      `,
    });

    printResult('Code with high reasoning', result.text, result.usage);
  } catch (error) {
    console.log('Error:', error.message);
  }

  // ============================================================
  // Example 7: Gemini 2.5 with thinkingBudget (for comparison)
  // ============================================================
  printSection('7. Gemini 2.5 with thinkingBudget (Alternative)');

  try {
    console.log('Using gemini-2.5-flash with thinkingBudget: 4096');

    const result = await generateText({
      model: gemini('gemini-2.5-flash', {
        thinkingConfig: {
          thinkingBudget: 4096, // Token budget for Gemini 2.5
        },
      }),
      prompt: 'What is 25 * 17? Show your work.',
    });

    printResult('Gemini 2.5 with thinkingBudget', result.text, result.usage);
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  All thinking mode examples completed!');
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
