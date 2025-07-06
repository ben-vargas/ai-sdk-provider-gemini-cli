#!/usr/bin/env node

/**
 * Basic Object Generation Examples
 * 
 * This example demonstrates fundamental object generation patterns using
 * the Gemini CLI provider with JSON schema validation.
 * 
 * Topics covered:
 * - Simple objects with primitive types
 * - Basic arrays
 * - Optional fields
 * - Schema descriptions for better generation
 */

import { generateObject } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';
import { z } from 'zod';

console.log('🎯 Gemini CLI - Basic Object Generation\n');

const gemini = createGeminiProvider({
  authType: 'oauth-personal'
});

// Example 1: Simple object with primitives
async function example1_simpleObject() {
  console.log('1️⃣  Simple Object with Primitives\n');
  
  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      name: z.string().describe('Full name of the person'),
      age: z.number().describe('Age in years'),
      email: z.string().email().describe('Valid email address'),
      isActive: z.boolean().describe('Whether the account is active'),
    }),
    prompt: 'Generate a JSON object with exactly these fields: name (string) = "Alex Smith", age (number) = 30, email (string) = "alex@example.com", isActive (boolean) = true',
  });

  console.log('Generated profile:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 2: Object with arrays
async function example2_arrays() {
  console.log('2️⃣  Object with Arrays\n');
  
  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      projectName: z.string().describe('Name of the software project'),
      languages: z.array(z.string()).describe('Programming languages used'),
      contributors: z.array(z.string()).describe('List of contributor names'),
      stars: z.number().describe('GitHub stars count'),
      topics: z.array(z.string()).describe('Repository topics/tags'),
    }),
    prompt: 'Generate data for an open-source machine learning project.',
  });

  console.log('Generated project:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 3: Optional fields
async function example3_optionalFields() {
  console.log('3️⃣  Object with Optional Fields\n');
  
  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      title: z.string().describe('Book title'),
      author: z.string().describe('Author name'),
      isbn: z.string().describe('ISBN number'),
      publishedYear: z.number().describe('Year of publication'),
      genre: z.string().describe('Primary genre'),
      series: z.string().optional().describe('Series name if part of a series'),
      awards: z.array(z.string()).optional().describe('Literary awards won'),
      rating: z.number().min(0).max(5).optional().describe('Average rating'),
    }),
    prompt: 'Generate metadata for a science fiction novel.',
  });

  console.log('Generated book:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 4: Different data types
async function example4_dataTypes() {
  console.log('4️⃣  Various Data Types\n');
  
  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      // Strings with constraints
      id: z.string().uuid().describe('Unique identifier'),
      username: z.string().min(3).max(20).describe('Username'),
      
      // Numbers with constraints  
      score: z.number().int().min(0).max(100).describe('Test score'),
      price: z.number().positive().describe('Product price in USD'),
      
      // Enums
      status: z.enum(['pending', 'active', 'suspended']).describe('Account status'),
      role: z.enum(['user', 'admin', 'moderator']).describe('User role'),
      
      // Dates as strings
      createdAt: z.string().describe('ISO 8601 creation date'),
      
      // URLs
      website: z.string().url().optional().describe('Personal website'),
    }),
    prompt: 'Generate a user account with various field types.',
  });

  console.log('Generated account:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 5: Building complexity gradually  
async function example5_gradualComplexity() {
  console.log('5️⃣  Building Complexity Gradually\n');
  
  // Start simple
  console.log('Step 1 - Basic product:');
  const { object: basicProduct } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      name: z.string(),
      price: z.number(),
    }),
    prompt: 'Generate a laptop product.',
  });
  console.log(JSON.stringify(basicProduct, null, 2));
  
  // Add more fields
  console.log('\nStep 2 - Enhanced product:');
  const { object: enhancedProduct } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      name: z.string(),
      price: z.number(),
      description: z.string(),
      specs: z.object({
        processor: z.string(),
        ram: z.string(),
        storage: z.string(),
      }),
      availability: z.object({
        inStock: z.boolean(),
        quantity: z.number().optional(),
      }),
    }),
    prompt: 'Generate a detailed laptop product listing.',
  });
  console.log(JSON.stringify(enhancedProduct, null, 2));
  console.log();
}

// Example 6: Best practices  
async function example6_bestPractices() {
  console.log('6️⃣  Best Practices\n');
  
  // Good: Clear descriptions guide the model
  const { object: good } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      headline: z.string().describe('Engaging article headline'),
      summary: z.string().describe('Brief 2-3 sentence summary'),
      category: z.enum(['tech', 'science', 'business', 'health']).describe('Article category'),
      readingTime: z.number().int().positive().describe('Estimated reading time in minutes'),
      tags: z.array(z.string()).describe('Relevant topic tags').min(3).max(5),
      publishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Publication date in YYYY-MM-DD format'),
      featured: z.boolean().describe('Is this a featured article?'),
      author: z.object({
        name: z.string().describe('Author full name'),
        role: z.string().describe('Author role or title'),
      }).describe('Article author information'),
    }),
    prompt: 'Generate metadata for a technology article about AI advancements in healthcare. Make it professional and engaging. The article discusses recent breakthroughs in diagnostic AI, personalized treatment plans, and the future of AI-assisted surgery.',
  });

  console.log('Well-structured generation:');
  console.log(JSON.stringify(good, null, 2));
  console.log('\n✨ Best practices for object generation:');
  console.log('   • Use clear, descriptive field descriptions');
  console.log('   • Provide context in your prompt');
  console.log('   • Use appropriate validation (regex for formats, enums for fixed choices)');
  console.log('   • Structure nested objects for better organization');
  console.log('   • Keep constraints reasonable - very strict limits can be challenging');
  console.log();
}

// Main execution
async function main() {
  try {
    await example1_simpleObject();
    await example2_arrays();
    await example3_optionalFields();
    await example4_dataTypes();
    await example5_gradualComplexity();
    await example6_bestPractices();
    
    console.log('✅ All basic examples completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('- Try generate-object-nested.mjs for complex structures');
    console.log('- See generate-object-constraints.mjs for validation examples');
    console.log('- Check generate-object-advanced.mjs for real-world patterns');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Make sure you\'re authenticated with: gemini (follow setup prompts)');
  }
}

main().catch(console.error);