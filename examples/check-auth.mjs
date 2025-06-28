#!/usr/bin/env node

/**
 * Check Authentication Status
 * 
 * This script verifies that Google Cloud Code authentication is properly configured
 * and tests the connection to the Gemini CLI Core library.
 */

import { createContentGenerator, createContentGeneratorConfig, AuthType } from '@google/gemini-cli-core';
import { createGeminiProvider } from '../dist/index.mjs';
import fs from 'fs';
import os from 'os';
import path from 'path';

console.log('🔍 Gemini CLI Authentication Check\n');

// 1. Check OAuth credentials
console.log('1. OAuth Credentials Status');
console.log('─'.repeat(50));

const credsPath = path.join(os.homedir(), '.gemini', 'oauth_creds.json');
const hasOAuthCreds = fs.existsSync(credsPath);

console.log(`OAuth credentials path: ${credsPath}`);
console.log(`Credentials exist: ${hasOAuthCreds ? '✅ Yes' : '❌ No'}`);

if (hasOAuthCreds) {
  try {
    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    const expiryDate = new Date(creds.expiry_date);
    const isExpired = Date.now() > creds.expiry_date;
    
    console.log(`Token expires: ${expiryDate.toLocaleString()}`);
    console.log(`Token status: ${isExpired ? '❌ Expired (will auto-refresh)' : '✅ Valid'}`);
    
    if (creds.scope) {
      console.log('Scopes:');
      creds.scope.split(' ').forEach(scope => console.log(`  - ${scope}`));
    }
  } catch (e) {
    console.log('⚠️  Could not parse credentials file:', e.message);
  }
} else {
  console.log('\n💡 To authenticate, run: gemini auth login');
}

console.log();

// 2. Test direct Gemini CLI Core connection
console.log('2. Gemini CLI Core Connection Test');
console.log('─'.repeat(50));

try {
  const config = await createContentGeneratorConfig('gemini-2.5-pro', AuthType.LOGIN_WITH_GOOGLE_PERSONAL);
  console.log('✅ Successfully created config');
  console.log(`Model: ${config.model}`);
  console.log(`Auth Type: ${config.authType}`);
  console.log(`Endpoint: ${process.env.CODE_ASSIST_ENDPOINT || 'https://cloudcode-pa.googleapis.com'}`);
  
  const generator = await createContentGenerator(config);
  console.log('✅ Content generator initialized');
} catch (error) {
  console.error('❌ Failed to initialize:', error.message);
  console.log('\n💡 Try running: gemini auth login');
}

console.log();

// 3. Test AI SDK Provider
console.log('3. AI SDK Provider Test');
console.log('─'.repeat(50));

try {
  const gemini = createGeminiProvider({
    authType: 'oauth-personal'
  });
  
  console.log('✅ Provider created successfully');
  console.log('Available models: gemini-2.5-pro, gemini-2.5-flash');
  
  // Quick connection test
  console.log('\nTesting connection with a simple request...');
  const { generateText } = await import('ai');
  const { text } = await generateText({
    model: gemini('gemini-2.5-flash'),
    prompt: 'Say "hello"',
    maxTokens: 10
  });
  
  console.log('✅ Connection successful!');
  console.log(`Response: ${text}`);
} catch (error) {
  console.error('❌ Provider test failed:', error.message);
}

console.log();

// 4. Environment information
console.log('4. Environment Information');
console.log('─'.repeat(50));
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Home directory: ${os.homedir()}`);

// Check for environment variables
const envVars = [
  'GOOGLE_API_KEY',
  'CODE_ASSIST_ENDPOINT',
  'GEMINI_API_KEY'
];

console.log('\nEnvironment variables:');
envVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✅ Set' : '❌ Not set'}`);
});

console.log('\n' + '─'.repeat(50));
console.log('Authentication check complete!');

if (!hasOAuthCreds) {
  console.log('\n⚠️  Action required: Run "gemini auth login" to authenticate');
} else {
  console.log('\n✅ You are ready to use the Gemini CLI AI SDK Provider!');
}