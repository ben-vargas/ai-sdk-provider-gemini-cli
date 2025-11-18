#!/usr/bin/env node

/**
 * Check Authentication Status
 * 
 * This script verifies that authentication is properly configured
 * and tests the connection to the Gemini API through the AI SDK provider.
 */

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
  console.log('\n💡 To authenticate, run: gemini (then follow setup prompts)');
}

console.log();

// 2. Test API Key Authentication (if set)
console.log('2. API Key Authentication Test');
console.log('─'.repeat(50));

if (process.env.GEMINI_API_KEY) {
  try {
    const geminiWithApiKey = createGeminiProvider({
      authType: 'api-key',
      apiKey: process.env.GEMINI_API_KEY
    });
    
    console.log('✅ API key provider created successfully');
    
    // Quick test
    const { generateText } = await import('ai');
    const result = await generateText({
      model: geminiWithApiKey('gemini-3-pro-preview'),
      prompt: 'Say "API key works" in 3 words'
    });
    
    console.log('✅ API key authentication successful!');
    console.log(`Response: ${result.content[0]?.text || 'No response'}`);
  } catch (error) {
    console.error('❌ API key test failed:', error.message);
  }
} else {
  console.log('ℹ️  No API key found in GEMINI_API_KEY environment variable');
  console.log('   OAuth authentication will be used instead');
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
  console.log('Available models: gemini-3-pro-preview, gemini-2.5-flash, gemini-2.0-pro-exp, and more');
  
  // Quick connection test
  console.log('\nTesting connection with a simple request...');
  const { generateText } = await import('ai');
  const result = await generateText({
    model: gemini('gemini-3-pro-preview'),
    prompt: 'Say hello in one word'
  });
  
  console.log('✅ Connection successful!');
  console.log(`Response: ${result.content[0]?.text || 'No response'}`);
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
  'GEMINI_API_KEY',
  'CODE_ASSIST_ENDPOINT'
];

console.log('\nEnvironment variables:');
envVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✅ Set' : '❌ Not set'}`);
});

console.log('\n' + '─'.repeat(50));
console.log('Authentication check complete!');

if (!hasOAuthCreds) {
  console.log('\n⚠️  Action required: Run "gemini" and follow setup prompts to authenticate');
} else {
  console.log('\n✅ You are ready to use the Gemini CLI AI SDK Provider!');
}