#!/usr/bin/env node

/**
 * Advanced Object Generation Examples
 * 
 * This example demonstrates real-world, production-ready patterns
 * for generating complex structured data with the Gemini CLI provider.
 */

import { generateObject } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';
import { z } from 'zod';

console.log('🚀 Gemini CLI - Advanced Object Generation\n');

const gemini = createGeminiProvider({
  authType: 'oauth-personal'
});

// Example 1: E-commerce product catalog with variants
async function example1_productCatalog() {
  console.log('1️⃣  E-commerce Product with Variants\n');
  
  const productSchema = z.object({
    product: z.object({
      id: z.string().uuid(),
      sku: z.string().regex(/^[A-Z]{3}-\d{4}-[A-Z0-9]{4}$/),
      name: z.string(),
      brand: z.string(),
      category: z.array(z.string()).describe('Category hierarchy'),
      
      description: z.object({
        short: z.string().max(160),
        long: z.string(),
        features: z.array(z.string()).min(3).max(8),
        specifications: z.record(z.string(), z.string()),
      }),
      
      pricing: z.object({
        currency: z.literal('USD'),
        basePrice: z.number().positive(),
        salePrice: z.number().positive().optional(),
        taxable: z.boolean(),
        shippingClass: z.enum(['standard', 'oversized', 'freight']),
      }),
      
      variants: z.array(z.object({
        variantId: z.string(),
        attributes: z.object({
          color: z.string().optional(),
          size: z.string().optional(),
          material: z.string().optional(),
          style: z.string().optional(),
        }),
        inventory: z.object({
          quantity: z.number().int().nonnegative(),
          reserved: z.number().int().nonnegative(),
          available: z.number().int().nonnegative(),
          warehouse: z.record(z.string(), z.number()),
        }),
        pricing: z.object({
          price: z.number().positive(),
          costOfGoods: z.number().positive(),
          margin: z.number().min(0).max(100),
        }),
        images: z.array(z.object({
          url: z.string().url(),
          alt: z.string(),
          isPrimary: z.boolean(),
        })).min(1),
      })).min(1).max(10),
      
      seo: z.object({
        title: z.string().max(60),
        description: z.string().max(160),
        keywords: z.array(z.string()).max(10),
        canonicalUrl: z.string().url().optional(),
      }),
      
      reviews: z.object({
        average: z.number().min(0).max(5),
        count: z.number().int().nonnegative(),
        distribution: z.object({
          5: z.number().int(),
          4: z.number().int(),
          3: z.number().int(),
          2: z.number().int(),
          1: z.number().int(),
        }),
        featured: z.array(z.object({
          id: z.string(),
          rating: z.number().int().min(1).max(5),
          title: z.string(),
          comment: z.string(),
          author: z.string(),
          verified: z.boolean(),
          helpful: z.number().int(),
          date: z.string(),
        })).max(3),
      }),
    }),
  });

  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: productSchema,
    prompt: 'Generate a detailed product listing for a high-end laptop with 3 variants (different RAM/storage configurations). Include realistic pricing, inventory, and reviews.',
  });

  console.log('Generated product catalog:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 2: Analytics dashboard data
async function example2_analyticsDashboard() {
  console.log('2️⃣  Analytics Dashboard Data\n');
  
  const analyticsSchema = z.object({
    dashboard: z.object({
      period: z.object({
        start: z.string(),
        end: z.string(),
        timezone: z.string(),
      }),
      
      overview: z.object({
        totalRevenue: z.number().positive(),
        revenueGrowth: z.number(),
        totalOrders: z.number().int().positive(),
        averageOrderValue: z.number().positive(),
        conversionRate: z.number().min(0).max(100),
        returningCustomerRate: z.number().min(0).max(100),
      }),
      
      traffic: z.object({
        sessions: z.number().int().positive(),
        users: z.number().int().positive(),
        pageViews: z.number().int().positive(),
        bounceRate: z.number().min(0).max(100),
        averageSessionDuration: z.number().positive(),
        
        sources: z.array(z.object({
          name: z.string(),
          sessions: z.number().int(),
          percentage: z.number().min(0).max(100),
          conversionRate: z.number().min(0).max(100),
          revenue: z.number().nonnegative(),
        })).min(5),
        
        devices: z.object({
          desktop: z.number().min(0).max(100),
          mobile: z.number().min(0).max(100),
          tablet: z.number().min(0).max(100),
        }),
      }),
      
      sales: z.object({
        byCategory: z.array(z.object({
          category: z.string(),
          revenue: z.number().positive(),
          units: z.number().int().positive(),
          growth: z.number(),
        })).min(5),
        
        topProducts: z.array(z.object({
          id: z.string(),
          name: z.string(),
          revenue: z.number().positive(),
          units: z.number().int().positive(),
          trend: z.enum(['up', 'down', 'stable']),
        })).length(10),
        
        hourlyPattern: z.array(z.object({
          hour: z.number().int().min(0).max(23),
          orders: z.number().int(),
          revenue: z.number(),
        })).length(24),
      }),
      
      customers: z.object({
        newCustomers: z.number().int(),
        returningCustomers: z.number().int(),
        churnRate: z.number().min(0).max(100),
        lifetimeValue: z.number().positive(),
        
        segments: z.array(z.object({
          name: z.string(),
          size: z.number().int(),
          averageOrderValue: z.number().positive(),
          orderFrequency: z.number().positive(),
          lastPurchase: z.string(),
        })),
        
        geography: z.array(z.object({
          country: z.string(),
          region: z.string(),
          customers: z.number().int(),
          revenue: z.number(),
          averageOrderValue: z.number(),
        })).min(5),
      }),
      
      alerts: z.array(z.object({
        type: z.enum(['info', 'warning', 'critical']),
        metric: z.string(),
        message: z.string(),
        timestamp: z.string(),
        value: z.number().optional(),
        threshold: z.number().optional(),
      })).max(5),
    }),
  });

  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: analyticsSchema,
    prompt: 'Generate comprehensive e-commerce analytics dashboard data for the last 30 days. Show positive growth trends but include some realistic challenges. Include data for a mid-sized online retailer.',
  });

  console.log('Generated analytics dashboard:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 3: Multi-step form configuration
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
        requiredFieldsIndicator: z.boolean(),
        validationTiming: z.enum(['onBlur', 'onChange', 'onSubmit']),
      }),
      
      steps: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        
        fields: z.array(z.object({
          id: z.string(),
          type: z.enum(['text', 'email', 'number', 'select', 'multiselect', 'radio', 'checkbox', 'textarea', 'date', 'file']),
          label: z.string(),
          placeholder: z.string().optional(),
          helpText: z.string().optional(),
          required: z.boolean(),
          
          validation: z.object({
            rules: z.array(z.object({
              type: z.enum(['minLength', 'maxLength', 'pattern', 'min', 'max', 'email', 'url', 'custom']),
              value: z.union([z.string(), z.number()]).optional(),
              message: z.string(),
            })),
          }).optional(),
          
          options: z.array(z.object({
            value: z.string(),
            label: z.string(),
            disabled: z.boolean().optional(),
          })).optional(),
          
          conditional: z.object({
            dependsOn: z.string(),
            values: z.array(z.string()),
            action: z.enum(['show', 'hide', 'enable', 'disable']),
          }).optional(),
          
          defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
        })).min(1),
        
        navigation: z.object({
          previous: z.object({
            label: z.string(),
            enabled: z.boolean(),
          }),
          next: z.object({
            label: z.string(),
            enabled: z.boolean(),
            validation: z.boolean(),
          }),
        }),
      })).min(2),
      
      submission: z.object({
        endpoint: z.string().url(),
        method: z.enum(['POST', 'PUT']),
        headers: z.record(z.string()),
        successMessage: z.string(),
        errorMessage: z.string(),
        redirectUrl: z.string().url().optional(),
      }),
      
      integrations: z.array(z.object({
        type: z.enum(['analytics', 'crm', 'email', 'webhook']),
        enabled: z.boolean(),
        config: z.record(z.any()),
      })).optional(),
    }),
  });

  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: formSchema,
    prompt: 'Generate a multi-step job application form with 4 steps: Personal Info, Education, Work Experience, and Additional Info. Include conditional fields and proper validation.',
  });

  console.log('Generated form configuration:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 4: API documentation
async function example4_apiDocumentation() {
  console.log('4️⃣  REST API Documentation\n');
  
  const apiSchema = z.object({
    api: z.object({
      name: z.string(),
      version: z.string(),
      baseUrl: z.string().url(),
      description: z.string(),
      
      authentication: z.object({
        type: z.enum(['bearer', 'apiKey', 'oauth2', 'basic']),
        description: z.string(),
        example: z.string(),
        scopes: z.array(z.object({
          name: z.string(),
          description: z.string(),
        })).optional(),
      }),
      
      endpoints: z.array(z.object({
        path: z.string(),
        method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
        summary: z.string(),
        description: z.string(),
        tags: z.array(z.string()),
        
        parameters: z.array(z.object({
          name: z.string(),
          in: z.enum(['path', 'query', 'header', 'body']),
          type: z.string(),
          required: z.boolean(),
          description: z.string(),
          example: z.any(),
          constraints: z.object({
            min: z.number().optional(),
            max: z.number().optional(),
            pattern: z.string().optional(),
            enum: z.array(z.string()).optional(),
          }).optional(),
        })).optional(),
        
        requestBody: z.object({
          contentType: z.string(),
          schema: z.any(),
          example: z.any(),
        }).optional(),
        
        responses: z.array(z.object({
          statusCode: z.number(),
          description: z.string(),
          contentType: z.string().optional(),
          schema: z.any().optional(),
          example: z.any().optional(),
          headers: z.record(z.string()).optional(),
        })).min(1),
        
        examples: z.array(z.object({
          title: z.string(),
          description: z.string().optional(),
          request: z.object({
            headers: z.record(z.string()).optional(),
            params: z.record(z.any()).optional(),
            body: z.any().optional(),
          }),
          response: z.object({
            statusCode: z.number(),
            headers: z.record(z.string()).optional(),
            body: z.any(),
          }),
        })).optional(),
        
        rateLimit: z.object({
          requests: z.number(),
          window: z.string(),
        }).optional(),
      })).min(5),
      
      errors: z.array(z.object({
        code: z.string(),
        statusCode: z.number(),
        message: z.string(),
        description: z.string(),
      })),
      
      sdks: z.array(z.object({
        language: z.string(),
        packageManager: z.string(),
        installCommand: z.string(),
        documentationUrl: z.string().url(),
      })).optional(),
    }),
  });

  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: apiSchema,
    prompt: 'Generate comprehensive API documentation for a task management REST API with endpoints for users, projects, and tasks. Include authentication, examples, and error codes.',
  });

  console.log('Generated API documentation:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Main execution
async function main() {
  try {
    await example1_productCatalog();
    await example2_analyticsDashboard();
    await example3_formConfiguration();
    await example4_apiDocumentation();
    
    console.log('✅ All advanced examples completed successfully!');
    console.log('\n🎯 Advanced object generation tips:');
    console.log('- Use detailed schemas for production-ready data');
    console.log('- Include realistic constraints and relationships');
    console.log('- Provide context in prompts for better results');
    console.log('- Consider breaking very large schemas into steps');
    console.log('- Use gemini-2.5-pro for complex schemas');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 For complex schemas, ensure you have sufficient token limits');
  }
}

main().catch(console.error);