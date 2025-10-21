/**
 * Custom Logger Example
 *
 * Run: node examples/logging-custom-logger.mjs
 *
 * This example demonstrates how to integrate a custom logger with the Gemini provider.
 * This is useful when you want to:
 * - Route logs to an external logging service
 * - Format logs in a specific way
 * - Filter or transform log messages
 * - Integrate with existing logging infrastructure
 *
 * Expected output:
 * - Custom prefixed log messages (e.g., "[CUSTOM-DEBUG]")
 * - All log levels when verbose: true
 * - Full control over log formatting and routing
 */

import { streamText } from 'ai';
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';

// Custom logger that prefixes each level and adds timestamps
const customLogger = {
  debug: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[CUSTOM-DEBUG] ${timestamp} - ${message}`);
  },
  info: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[CUSTOM-INFO] ${timestamp} - ${message}`);
  },
  warn: (message) => {
    const timestamp = new Date().toISOString();
    console.warn(`[CUSTOM-WARN] ${timestamp} - ${message}`);
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    console.error(`[CUSTOM-ERROR] ${timestamp} - ${message}`);
  },
};

async function main() {
  console.log('=== Custom Logger Example ===\n');
  console.log('This example shows how to integrate your own logging system.');
  console.log('All logs will be prefixed with [CUSTOM-*] and include timestamps.\n');

  try {
    const gemini = createGeminiProvider({
      authType: 'oauth-personal',
    });

    // Use custom logger with verbose mode enabled
    const result = streamText({
      model: gemini('gemini-2.5-flash', {
        verbose: true, // Enable verbose logging to see debug/info
        logger: customLogger, // Use our custom logger
      }),
      prompt: 'Say hello in 5 words',
    });

    // Stream the response
    console.log('\nResponse:');
    for await (const textPart of result.textStream) {
      process.stdout.write(textPart);
    }
    console.log('\n');

    // Get usage info
    const usage = await result.usage;
    console.log('Token usage:', usage);

    console.log('\n✓ Custom logger successfully integrated!');
    console.log('  All logs above are formatted with custom prefixes and timestamps');
    console.log('  You can route these to any logging service (Datadog, Sentry, etc.)');
  } catch (error) {
    console.error('Error:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Install Gemini CLI: npm install -g @google/gemini-cli');
    console.log('2. Authenticate: gemini (and follow the prompts)');
    console.log('3. Run check-auth.mjs to verify setup');
  }
}

main().catch(console.error);

// Example: Integration with popular logging libraries
console.log('\n📚 Integration Examples:\n');
console.log('// Winston integration:');
console.log('const logger = {');
console.log('  debug: (msg) => winston.debug(msg),');
console.log('  info: (msg) => winston.info(msg),');
console.log('  warn: (msg) => winston.warn(msg),');
console.log('  error: (msg) => winston.error(msg),');
console.log('};\n');

console.log('// Pino integration:');
console.log('const logger = {');
console.log('  debug: (msg) => pino.debug(msg),');
console.log('  info: (msg) => pino.info(msg),');
console.log('  warn: (msg) => pino.warn(msg),');
console.log('  error: (msg) => pino.error(msg),');
console.log('};\n');
