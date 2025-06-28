#!/usr/bin/env node

/**
 * Object Generation with Constraints
 * 
 * This example demonstrates how to use advanced validation constraints
 * with Zod schemas to ensure generated data meets specific business rules.
 */

import { generateObject } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';
import { z } from 'zod';

console.log('🎨 Gemini CLI - Object Generation with Constraints\n');

const gemini = createGeminiProvider({
  authType: 'oauth-personal'
});

// Example 1: String constraints
async function example1_stringConstraints() {
  console.log('1️⃣  String Constraints\n');
  
  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      user: z.object({
        username: z.string()
          .min(3, 'At least 3 characters')
          .max(20, 'At most 20 characters')
          .regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric and underscore'),
        
        email: z.string()
          .email('Must be valid email'),
        
        password: z.string()
          .min(8, 'At least 8 characters')
          .regex(/[A-Z]/, 'Must contain uppercase')
          .regex(/[a-z]/, 'Must contain lowercase')
          .regex(/[0-9]/, 'Must contain number')
          .describe('Strong password following security rules'),
        
        bio: z.string()
          .max(500, 'Maximum 500 characters')
          .optional()
          .describe('User biography'),
        
        website: z.string()
          .url('Must be valid URL')
          .startsWith('https://', 'Must use HTTPS')
          .optional(),
        
        phoneNumber: z.string()
          .regex(/^\+\d{1,3}-\d{3}-\d{3}-\d{4}$/, 'Format: +1-555-123-4567')
          .describe('International phone format'),
      }),
    }),
    prompt: 'Generate a secure user account with all fields populated.',
  });

  console.log('Generated user with string constraints:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 2: Number constraints
async function example2_numberConstraints() {
  console.log('2️⃣  Number Constraints\n');
  
  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      product: z.object({
        id: z.number().int().positive(),
        
        price: z.number()
          .positive('Must be positive')
          .multipleOf(0.01, 'Max 2 decimal places')
          .min(0.99, 'Minimum price $0.99')
          .max(99999.99, 'Maximum price $99,999.99'),
        
        quantity: z.number()
          .int('Must be whole number')
          .nonnegative('Cannot be negative')
          .max(1000, 'Maximum stock 1000'),
        
        rating: z.number()
          .min(0, 'Minimum rating 0')
          .max(5, 'Maximum rating 5')
          .multipleOf(0.5, 'Half-star increments'),
        
        discount: z.number()
          .int()
          .min(0, 'No negative discount')
          .max(100, 'Maximum 100% discount')
          .describe('Discount percentage'),
        
        weight: z.number()
          .positive()
          .describe('Weight in kilograms'),
        
        dimensions: z.object({
          length: z.number().positive().max(200, 'Max 200cm'),
          width: z.number().positive().max(200, 'Max 200cm'),
          height: z.number().positive().max(200, 'Max 200cm'),
        }),
      }),
    }),
    prompt: 'Generate a laptop product with realistic constraints.',
  });

  console.log('Generated product with number constraints:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 3: Enum and literal constraints
async function example3_enumConstraints() {
  console.log('3️⃣  Enum and Literal Constraints\n');
  
  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      order: z.object({
        status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
        
        priority: z.enum(['low', 'normal', 'high', 'urgent'])
          .describe('Order priority level'),
        
        paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay']),
        
        shippingSpeed: z.enum(['standard', 'express', 'overnight'])
          .describe('Shipping speed selection'),
        
        customerType: z.literal('premium')
          .describe('This must be exactly "premium"'),
        
        region: z.enum(['north_america', 'europe', 'asia', 'oceania', 'south_america', 'africa'])
          .describe('Delivery region'),
        
        preferences: z.object({
          notifications: z.enum(['email', 'sms', 'push', 'none']),
          packaging: z.enum(['standard', 'gift', 'eco_friendly']),
          signature: z.enum(['required', 'not_required']),
        }),
      }),
    }),
    prompt: 'Generate a premium customer order with express shipping to Europe.',
  });

  console.log('Generated order with enum constraints:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 4: Array constraints
async function example4_arrayConstraints() {
  console.log('4️⃣  Array Constraints\n');
  
  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      playlist: z.object({
        name: z.string().min(1).max(100),
        
        songs: z.array(z.object({
          title: z.string(),
          artist: z.string(),
          duration: z.number().int().positive().max(600), // Max 10 minutes
        }))
          .min(5, 'At least 5 songs')
          .max(10, 'At most 10 songs')
          .describe('Playlist songs'),
        
        tags: z.array(z.string())
          .min(3, 'At least 3 tags')
          .max(7, 'At most 7 tags')
          .describe('Genre and mood tags'),
        
        collaborators: z.array(z.string().email())
          .max(5, 'Maximum 5 collaborators')
          .optional()
          .describe('Email addresses of collaborators'),
        
        featuredArtists: z.array(z.string())
          .nonempty('Must have at least one artist')
          .describe('Artists featured in this playlist'),
        
        ratings: z.array(z.number().int().min(1).max(5))
          .length(5, 'Exactly 5 ratings required')
          .describe('User ratings from 5 different users'),
      }),
    }),
    prompt: 'Generate a summer vibes playlist with 7 songs and appropriate tags.',
  });

  console.log('Generated playlist with array constraints:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 5: Date and time constraints
async function example5_dateConstraints() {
  console.log('5️⃣  Date and Time Constraints\n');
  
  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      event: z.object({
        name: z.string(),
        
        startDate: z.string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD')
          .describe('Event start date'),
        
        startTime: z.string()
          .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format: HH:MM (24-hour)')
          .describe('Event start time'),
        
        endDateTime: z.string()
          .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, 'ISO 8601 format')
          .describe('Event end date and time in UTC'),
        
        registrationDeadline: z.string()
          .describe('Registration deadline (must be before event start)'),
        
        schedule: z.array(z.object({
          time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '24-hour format'),
          activity: z.string(),
          duration: z.number().int().positive().max(180), // Max 3 hours
        }))
          .min(3)
          .describe('Event schedule'),
        
        timezone: z.enum(['UTC', 'EST', 'PST', 'GMT', 'CET'])
          .describe('Event timezone'),
      }),
    }),
    prompt: 'Generate a tech conference event happening next month with a detailed schedule.',
  });

  console.log('Generated event with date constraints:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 6: Complex business rules
async function example6_businessRules() {
  console.log('6️⃣  Complex Business Rules\n');
  
  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: z.object({
      insurance: z.object({
        policyNumber: z.string()
          .regex(/^POL-\d{4}-[A-Z]{2}-\d{6}$/, 'Format: POL-YYYY-XX-NNNNNN'),
        
        holder: z.object({
          age: z.number().int().min(18).max(100),
          smokingStatus: z.enum(['never', 'former', 'current']),
          healthScore: z.number().int().min(0).max(100),
        }),
        
        coverage: z.object({
          type: z.enum(['basic', 'standard', 'premium', 'platinum']),
          
          deductible: z.number()
            .positive()
            .multipleOf(100)
            .describe('Must be multiple of $100'),
          
          annualLimit: z.number()
            .min(100000)
            .max(5000000)
            .describe('Annual coverage limit'),
          
          copayPercentage: z.number()
            .int()
            .min(0)
            .max(50)
            .describe('Copay percentage after deductible'),
        }),
        
        premium: z.object({
          monthly: z.number()
            .positive()
            .multipleOf(0.01),
          
          paymentDay: z.number()
            .int()
            .min(1)
            .max(28)
            .describe('Day of month for payment'),
        }),
        
        beneficiaries: z.array(z.object({
          name: z.string(),
          relationship: z.enum(['spouse', 'child', 'parent', 'sibling', 'other']),
          percentage: z.number().int().min(1).max(100),
        }))
          .min(1)
          .max(5)
          .refine(
            (beneficiaries) => {
              const total = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
              return total === 100;
            },
            'Beneficiary percentages must total 100%'
          ),
        
        riders: z.array(z.enum(['dental', 'vision', 'disability', 'critical_illness']))
          .optional()
          .describe('Additional coverage riders'),
      }),
    }),
    prompt: 'Generate a premium health insurance policy for a 35-year-old non-smoker with 2 beneficiaries.',
  });

  console.log('Generated insurance policy with business rules:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Main execution
async function main() {
  try {
    await example1_stringConstraints();
    await example2_numberConstraints();
    await example3_enumConstraints();
    await example4_arrayConstraints();
    await example5_dateConstraints();
    await example6_businessRules();
    
    console.log('✅ All constraint examples completed successfully!');
    console.log('\n💡 Key takeaways:');
    console.log('- Use specific constraints to ensure data quality');
    console.log('- Combine multiple constraints for complex validation');
    console.log('- Provide clear descriptions for better generation');
    console.log('- Use refine() for custom business logic validation');
    console.log('- Constraints help the model generate more accurate data');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Complex constraints may require the more capable gemini-2.5-pro model');
  }
}

main().catch(console.error);