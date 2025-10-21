/**
 * Disabled Logging Example
 *
 * Run: node examples/logging-disabled.mjs
 *
 * This example demonstrates how to completely disable all logging.
 * When logger: false is set, no logs will be emitted at all.
 *
 * Use this when:
 * - You want completely silent operation
 * - Logs might interfere with output processing
 * - Running in production with external monitoring
 * - You don't need any diagnostic information
 *
 * Expected output:
 * - Zero log messages (no debug, info, warn, or error)
 * - Only explicit console.log statements from your code
 * - Completely silent provider operation
 *
 * ⚠️  Warning: With logging disabled, you won't see:
 * - Warning messages about misconfigurations
 * - Error messages from the provider
 * - Any diagnostic information
 */

import { streamText } from 'ai';
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';

async function main() {
  console.log('=== Logging Disabled Example ===\n');
  console.log('Expected behavior:');
  console.log('- No logs from the provider at all');
  console.log('- Completely silent operation');
  console.log('- Only application output is shown\n');

  try {
    const gemini = createGeminiProvider({
      authType: 'oauth-personal',
    });

    // Disable all logging
    const result = streamText({
      model: gemini('gemini-2.5-flash', {
        logger: false, // Disable all logging
      }),
      prompt: 'Say hello in 5 words',
    });

    // Stream the response
    console.log('Response:');
    for await (const textPart of result.textStream) {
      process.stdout.write(textPart);
    }
    console.log('\n');

    // Get usage info
    const usage = await result.usage;
    console.log('Token usage:', usage);

    console.log('\n✓ Notice: Zero logs from the provider appeared above');
    console.log('  The provider operated completely silently');
    console.log('  Only our explicit console.log statements were shown');

    console.log('\n⚠️  Important:');
    console.log("  With logging disabled, you won't see warnings or errors");
    console.log('  from the provider. Use this mode carefully!');
  } catch (error) {
    // Even with logging disabled, you can still catch and handle errors
    console.error('Error:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Install Gemini CLI: npm install -g @google/gemini-cli');
    console.log('2. Authenticate: gemini (and follow the prompts)');
    console.log('3. Run check-auth.mjs to verify setup');
    console.log('4. Try running without logger: false to see diagnostic logs');
  }
}

main().catch(console.error);
