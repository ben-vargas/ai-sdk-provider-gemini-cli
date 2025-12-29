#!/usr/bin/env node

/**
 * Advanced Object Generation Examples
 * 
 * This example demonstrates real-world, production-ready patterns
 * for generating complex structured data with the Gemini CLI provider.
 * 
 * ⚠️ GEMINI SCHEMA STATE LIMITS:
 * Gemini has internal limits on schema complexity. Schemas that produce
 * "too many states" will fail with the error:
 *   "The specified schema produces a constraint that has too many states for serving"
 * 
 * Common causes of this error:
 * - Deeply nested arrays with .min()/.max()/.length() constraints
 * - Numeric ranges like .min(0).max(23) on integers
 * - Complex z.record() patterns (especially nested)
 * - Combining many optional fields with array constraints
 * 
 * Solutions:
 * - Remove .min()/.max()/.length() from arrays - use .describe() hints instead
 * - Remove numeric bounds from integers - validate post-generation if needed
 * - Simplify or remove z.record() - use explicit field names instead
 * - Use .describe() to guide the model instead of strict validators
 * 
 * Note: The AI SDK's generateObject function throws an error with message
 * "No object generated: could not parse the response" when schema validation
 * fails. This is misleading - the JSON was likely parsed successfully but
 * failed validation. The generated object is still available in error.text.
 */

import { generateObject } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';
import { z } from 'zod';

console.log('🚀 Gemini CLI - Advanced Object Generation\n');

const gemini = createGeminiProvider({
  authType: 'oauth-personal'
});

// Example 1: E-commerce product catalog with variants
// Simplified: Removed array .min()/.max(), removed z.record(), removed numeric .min()/.max()
async function example1_productCatalog() {
  console.log('1️⃣  E-commerce Product with Variants\n');
  
  const productSchema = z.object({
    product: z.object({
      id: z.string(),
      sku: z.string(),
      name: z.string(),
      brand: z.string(),
      category: z.array(z.string()).describe('Category hierarchy, e.g. ["Electronics", "Computers", "Laptops"]'),
      
      description: z.object({
        short: z.string().describe('Short description, max 160 characters'),
        long: z.string(),
        features: z.array(z.string()).describe('3-8 key features'),
        // Removed z.record() - use explicit fields or array of key-value pairs instead
        specifications: z.array(z.object({
          name: z.string(),
          value: z.string(),
        })).describe('Technical specifications as name-value pairs'),
      }),
      
      pricing: z.object({
        currency: z.literal('USD'),
        basePrice: z.number().positive(),
        salePrice: z.number().positive().optional(),
        taxable: z.boolean(),
        shippingClass: z.enum(['standard', 'oversized', 'freight']),
      }),
      
      // Simplified variants - removed nested z.record() and array constraints
      variants: z.array(z.object({
        variantId: z.string(),
        color: z.string().optional(),
        size: z.string().optional(),
        material: z.string().optional(),
        quantity: z.number().int().describe('Available inventory count'),
        price: z.number().positive(),
        imageUrl: z.string().describe('Primary image URL'),
      })).describe('1-10 product variants'),
      
      seo: z.object({
        title: z.string().describe('SEO title, max 60 characters'),
        description: z.string().describe('Meta description, max 160 characters'),
        keywords: z.array(z.string()).describe('Up to 10 SEO keywords'),
      }),
      
      // Simplified reviews - removed numeric .min()/.max() constraints
      reviews: z.object({
        average: z.number().describe('Average rating 0-5'),
        count: z.number().int().describe('Total review count'),
        featured: z.array(z.object({
          rating: z.number().int().describe('Rating 1-5'),
          title: z.string(),
          comment: z.string(),
          author: z.string(),
          verified: z.boolean(),
        })).describe('Up to 3 featured reviews'),
      }),
    }),
  });

  try {
    const { object } = await generateObject({
      model: gemini('gemini-3-pro-preview'),
      schema: productSchema,
      prompt: 'Generate a detailed product listing for a high-end laptop with 3 variants (different RAM/storage configurations). Include realistic pricing, inventory, and reviews.',
      maxOutputTokens: 4000,
    });

    console.log('✅ Generated product catalog:');
    console.log(JSON.stringify(object, null, 2));
  } catch (error) {
    console.error('❌ Example 1 failed:', error.message);
    if (error.text) {
      console.log('📝 Partial output available in error.text');
    }
  }
  console.log();
}

// Example 2: Analytics dashboard data
// Simplified: Removed .length() constraints, removed numeric .min()/.max()
async function example2_analyticsDashboard() {
  console.log('2️⃣  Analytics Dashboard Data\n');
  
  const analyticsSchema = z.object({
    dashboard: z.object({
      period: z.object({
        start: z.string().describe('ISO date string'),
        end: z.string().describe('ISO date string'),
        timezone: z.string(),
      }),
      
      overview: z.object({
        totalRevenue: z.number().positive(),
        revenueGrowth: z.number().describe('Percentage growth, can be negative'),
        totalOrders: z.number().int().positive(),
        averageOrderValue: z.number().positive(),
        conversionRate: z.number().describe('Percentage 0-100'),
        returningCustomerRate: z.number().describe('Percentage 0-100'),
      }),
      
      traffic: z.object({
        sessions: z.number().int().positive(),
        users: z.number().int().positive(),
        pageViews: z.number().int().positive(),
        bounceRate: z.number().describe('Percentage 0-100'),
        averageSessionDuration: z.number().positive().describe('Duration in seconds'),
        
        // Removed .min(5) constraint
        sources: z.array(z.object({
          name: z.string(),
          sessions: z.number().int(),
          percentage: z.number().describe('Percentage 0-100'),
          revenue: z.number().nonnegative(),
        })).describe('At least 5 traffic sources'),
        
        devices: z.object({
          desktop: z.number().describe('Percentage'),
          mobile: z.number().describe('Percentage'),
          tablet: z.number().describe('Percentage'),
        }),
      }),
      
      sales: z.object({
        // Removed .min(5) and .length(10) constraints
        byCategory: z.array(z.object({
          category: z.string(),
          revenue: z.number().positive(),
          units: z.number().int().positive(),
          growth: z.number(),
        })).describe('5+ categories'),
        
        topProducts: z.array(z.object({
          name: z.string(),
          revenue: z.number().positive(),
          units: z.number().int().positive(),
          trend: z.enum(['up', 'down', 'stable']),
        })).describe('Top 10 products'),
        
        // Removed .length(24) and hour .min(0).max(23) - this was a major cause of state explosion
        hourlyDistribution: z.object({
          peakHour: z.number().int().describe('Hour with most orders (0-23)'),
          peakRevenue: z.number(),
          quietHour: z.number().int().describe('Hour with fewest orders (0-23)'),
        }),
      }),
      
      customers: z.object({
        newCustomers: z.number().int(),
        returningCustomers: z.number().int(),
        churnRate: z.number().describe('Percentage 0-100'),
        lifetimeValue: z.number().positive(),
        
        segments: z.array(z.object({
          name: z.string(),
          size: z.number().int(),
          averageOrderValue: z.number().positive(),
        })).describe('Customer segments'),
        
        // Removed .min(5) constraint
        topCountries: z.array(z.object({
          country: z.string(),
          customers: z.number().int(),
          revenue: z.number(),
        })).describe('Top 5+ countries by revenue'),
      }),
      
      // Removed .max(5) constraint
      alerts: z.array(z.object({
        type: z.enum(['info', 'warning', 'critical']),
        metric: z.string(),
        message: z.string(),
      })).describe('Up to 5 important alerts'),
    }),
  });

  try {
    const { object } = await generateObject({
      model: gemini('gemini-3-pro-preview'),
      schema: analyticsSchema,
      prompt: 'Generate comprehensive e-commerce analytics dashboard data for the last 30 days. Show positive growth trends but include some realistic challenges. Include data for a mid-sized online retailer.',
    });

    console.log('✅ Generated analytics dashboard:');
    console.log(JSON.stringify(object, null, 2));
  } catch (error) {
    console.error('❌ Example 2 failed:', error.message);
    if (error.text) {
      console.log('📝 Partial output available in error.text');
    }
  }
  console.log();
}

// Example 3: Multi-step form configuration
// Simplified: Removed z.record(), removed array constraints, simplified nested unions
async function example3_formConfiguration() {
  console.log('3️⃣  Dynamic Multi-Step Form Configuration\n');
  
  const formSchema = z.object({
    form: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      version: z.string(),
      
      settings: z.object({
        theme: z.enum(['light', 'dark', 'auto']),
        progressBar: z.boolean(),
        saveProgress: z.boolean(),
        validationTiming: z.enum(['onBlur', 'onChange', 'onSubmit']),
      }),
      
      // Simplified steps - removed nested complexity
      steps: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        
        fields: z.array(z.object({
          id: z.string(),
          type: z.enum(['text', 'email', 'number', 'select', 'radio', 'checkbox', 'textarea', 'date']),
          label: z.string(),
          placeholder: z.string().optional(),
          helpText: z.string().optional(),
          required: z.boolean(),
          // Simplified: removed complex validation rules and z.record()
          validationMessage: z.string().optional().describe('Error message if validation fails'),
          // Simplified options to string array
          options: z.array(z.string()).optional().describe('Options for select/radio/checkbox fields'),
          // Simplified conditional logic
          showWhen: z.string().optional().describe('Field ID that must be truthy to show this field'),
        })).describe('1+ fields per step'),
        
        nextButtonLabel: z.string(),
        previousButtonLabel: z.string().optional(),
      })).describe('2-6 form steps'),
      
      submission: z.object({
        endpoint: z.string().describe('API endpoint URL'),
        method: z.enum(['POST', 'PUT']),
        successMessage: z.string(),
        errorMessage: z.string(),
      }),
    }),
  });

  try {
    const { object } = await generateObject({
      model: gemini('gemini-3-pro-preview'),
      schema: formSchema,
      prompt: 'Generate a multi-step job application form with 4 steps: Personal Info, Education, Work Experience, and Additional Info. Include conditional fields and proper validation messages.',
    });

    console.log('✅ Generated form configuration:');
    console.log(JSON.stringify(object, null, 2));
  } catch (error) {
    console.error('❌ Example 3 failed:', error.message);
    if (error.text) {
      console.log('📝 Partial output available in error.text');
    }
  }
  console.log();
}

// Example 4: API documentation
// Simplified: Removed z.record(), removed z.any(), simplified nested structures
async function example4_apiDocumentation() {
  console.log('4️⃣  REST API Documentation\n');
  
  const apiSchema = z.object({
    api: z.object({
      name: z.string(),
      version: z.string(),
      baseUrl: z.string().describe('Base URL like https://api.example.com/v1'),
      description: z.string(),
      
      authentication: z.object({
        type: z.enum(['bearer', 'apiKey', 'oauth2', 'basic']),
        description: z.string(),
        headerName: z.string().describe('e.g., Authorization or X-API-Key'),
        example: z.string().describe('Example auth header value'),
      }),
      
      // Simplified endpoints - removed z.any() and z.record()
      endpoints: z.array(z.object({
        path: z.string(),
        method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
        summary: z.string(),
        description: z.string(),
        tags: z.array(z.string()),
        
        parameters: z.array(z.object({
          name: z.string(),
          location: z.enum(['path', 'query', 'header']),
          type: z.string().describe('Data type like string, integer, boolean'),
          required: z.boolean(),
          description: z.string(),
          example: z.string(),
        })).describe('Path, query, and header parameters'),
        
        requestBodyExample: z.string().optional().describe('JSON example of request body'),
        
        responses: z.array(z.object({
          statusCode: z.number().int(),
          description: z.string(),
          example: z.string().optional().describe('JSON example of response body'),
        })).describe('Expected responses with status codes'),
      })).describe('5+ API endpoints'),
      
      errors: z.array(z.object({
        code: z.string(),
        statusCode: z.number().int(),
        message: z.string(),
        description: z.string(),
      })).describe('Common error codes'),
      
      sdks: z.array(z.object({
        language: z.string(),
        installCommand: z.string(),
      })).describe('Available SDKs'),
    }),
  });

  try {
    const { object } = await generateObject({
      model: gemini('gemini-3-pro-preview'),
      schema: apiSchema,
      prompt: 'Generate comprehensive API documentation for a task management REST API with endpoints for users, projects, and tasks. Include authentication, examples, and error codes.',
    });

    console.log('✅ Generated API documentation:');
    console.log(JSON.stringify(object, null, 2));
  } catch (error) {
    console.error('❌ Example 4 failed:', error.message);
    if (error.text) {
      console.log('📝 Partial output available in error.text');
    }
  }
  console.log();
}

// Main execution
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Note: Schemas simplified to avoid Gemini state limit errors   ║');
  console.log('║  See file header comments for details on schema constraints    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  // Each example has its own try/catch so all run even if some fail
  await example1_productCatalog();
  await example2_analyticsDashboard();
  await example3_formConfiguration();
  await example4_apiDocumentation();
  
  console.log('\n🎯 Advanced object generation tips:');
  console.log('- Avoid .min()/.max()/.length() on arrays - use .describe() hints');
  console.log('- Avoid .min()/.max() numeric ranges - validate post-generation');
  console.log('- Avoid z.record() - use explicit fields or array of key-value pairs');
  console.log('- Use .describe() to guide the model instead of strict validators');
  console.log('- If schema fails with "too many states", simplify constraints');
}

main().catch(console.error);
