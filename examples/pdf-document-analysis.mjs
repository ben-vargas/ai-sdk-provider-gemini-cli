#!/usr/bin/env node

/**
 * PDF Document Analysis Example
 *
 * This example demonstrates how to use the multimodal file support
 * to analyze PDF documents with Gemini. It shows how to pass a PDF
 * (such as an SEC 10-Q filing) for financial analysis and summarization.
 *
 * New in v1.5.0: Support for PDF, audio, and video files.
 */

import { generateText } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📄 Gemini CLI Provider - PDF Document Analysis\n');

async function main() {
  try {
    // Create provider with OAuth authentication
    const gemini = createGeminiProvider({
      authType: 'oauth-personal'
    });

    // Read the PDF file and convert to base64
    const pdfPath = join(__dirname, 'NOW-Q3-2025-10-Q.pdf');
    console.log(`Loading PDF: ${pdfPath}`);

    const pdfBuffer = readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    console.log(`PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    console.log('─'.repeat(60));
    console.log();

    // Example 1: Executive Summary
    console.log('Example 1: Executive Summary of 10-Q Filing');
    console.log('─'.repeat(60));
    console.log('Analyzing document...\n');

    const result1 = await generateText({
      model: gemini('gemini-3-pro-preview'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a financial analyst reviewing this SEC 10-Q quarterly filing.

Please provide an executive summary that includes:
1. Company name and reporting period
2. Total revenue and year-over-year growth
3. Net income and key profitability metrics
4. Any significant risks or concerns mentioned
5. Key highlights from management's discussion

Keep the summary concise but informative.`
            },
            {
              type: 'file',
              data: pdfBase64,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
    });

    console.log('Executive Summary:');
    console.log('─'.repeat(40));
    console.log(result1.content[0]?.text || 'No response generated');
    console.log();
    console.log(`Input tokens: ${result1.usage?.inputTokens || 'N/A'}`);
    console.log(`Output tokens: ${result1.usage?.outputTokens || 'N/A'}`);
    console.log();

    // Example 2: Specific Financial Metrics
    console.log('Example 2: Key Financial Metrics Extraction');
    console.log('─'.repeat(60));
    console.log('Extracting metrics...\n');

    const result2 = await generateText({
      model: gemini('gemini-3-pro-preview'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract the following specific financial metrics from this 10-Q filing and present them in a structured format:

- Total Revenue (current quarter and YoY comparison)
- Subscription Revenue (if applicable)
- Operating Income/Loss
- Net Income/Loss
- Cash and Cash Equivalents
- Total Debt
- Free Cash Flow (if available)
- Remaining Performance Obligations (RPO) if mentioned

For each metric, include the actual numbers and any percentage changes mentioned.`
            },
            {
              type: 'file',
              data: pdfBase64,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
    });

    console.log('Financial Metrics:');
    console.log('─'.repeat(40));
    console.log(result2.content[0]?.text || 'No response generated');
    console.log();
    console.log(`Tokens used: ${result2.usage?.totalTokens || 'N/A'}`);
    console.log();

    // Example 3: Risk Analysis
    console.log('Example 3: Risk Factor Analysis');
    console.log('─'.repeat(60));
    console.log('Analyzing risks...\n');

    const result3 = await generateText({
      model: gemini('gemini-3-pro-preview'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Review the risk factors section of this 10-Q filing and provide:

1. Top 3 most significant risks mentioned
2. Any NEW risks added since the previous filing (if mentioned)
3. Any risks specifically related to:
   - Macroeconomic conditions
   - Competition
   - Technology/AI disruption
   - Regulatory/compliance

Summarize each risk in 1-2 sentences.`
            },
            {
              type: 'file',
              data: pdfBase64,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
    });

    console.log('Risk Analysis:');
    console.log('─'.repeat(40));
    console.log(result3.content[0]?.text || 'No response generated');
    console.log();

    console.log('✅ PDF analysis completed successfully!');
    console.log();
    console.log('💡 Tips for working with PDFs:');
    console.log('   - PDFs are processed using Gemini\'s native vision capabilities');
    console.log('   - Maximum PDF size: 50MB or 1000 pages');
    console.log('   - Each page uses approximately 258 tokens');
    console.log('   - For best results, use high-quality PDFs with selectable text');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('- Make sure you have authenticated: run "gemini" and follow setup');
    console.log('- Verify the PDF file exists in the examples directory');
    console.log('- Check that the PDF is not corrupted or password-protected');
    console.log('- For large PDFs, consider splitting into smaller sections');

    if (error.code === 'ENOENT') {
      console.log('\n📁 PDF file not found. Expected location:');
      console.log('   examples/NOW-Q3-2025-10-Q.pdf');
    }
  }
}

main().catch(console.error);
