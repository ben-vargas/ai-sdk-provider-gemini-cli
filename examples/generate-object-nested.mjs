#!/usr/bin/env node

/**
 * Nested Object Generation Examples
 * 
 * This example demonstrates how to generate complex nested structures
 * using the Gemini CLI provider.
 * 
 * Topics covered:
 * - Deeply nested objects
 * - Arrays of objects
 * - Complex data relationships
 * - Hierarchical structures
 */

import { generateObject } from 'ai';
import { createGeminiProvider } from '../dist/index.mjs';
import { z } from 'zod';

console.log('🏗️  Gemini CLI - Nested Object Generation\n');

const gemini = createGeminiProvider({
  authType: 'oauth-personal'
});

// Example 1: Company organization structure
async function example1_organizationStructure() {
  console.log('1️⃣  Organization Structure\n');
  
  const orgSchema = z.object({
    organization: z.object({
      name: z.string().describe('Company name'),
      founded: z.number().describe('Year founded'),
      headquarters: z.object({
        address: z.string(),
        city: z.string(),
        country: z.string(),
        coordinates: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
      }),
      leadership: z.object({
        ceo: z.object({
          name: z.string(),
          tenure: z.string().describe('Time in position'),
        }),
        cto: z.object({
          name: z.string(),
          background: z.string().describe('Professional background'),
        }),
      }),
      departments: z.array(z.object({
        name: z.string(),
        headCount: z.number(),
        budget: z.string().describe('Annual budget'),
        teams: z.array(z.object({
          name: z.string(),
          size: z.number(),
          focus: z.string().describe('Team focus area'),
        })),
      })).describe('Major departments'),
    }),
  });

  const { object } = await generateObject({
    model: gemini('gemini-3-pro-preview'),
    schema: orgSchema,
    prompt: 'Generate a structure for a mid-sized AI research company with 3 departments.',
  });

  console.log('Generated organization:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 2: E-commerce product catalog
async function example2_productCatalog() {
  console.log('2️⃣  E-commerce Product Catalog\n');
  
  const catalogSchema = z.object({
    catalog: z.object({
      name: z.string(),
      lastUpdated: z.string().describe('ISO 8601 date'),
      categories: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        products: z.array(z.object({
          id: z.string(),
          name: z.string(),
          brand: z.string(),
          price: z.object({
            amount: z.number(),
            currency: z.string(),
            discount: z.object({
              percentage: z.number().optional(),
              validUntil: z.string().optional(),
            }).optional(),
          }),
          inventory: z.object({
            inStock: z.boolean(),
            quantity: z.number(),
            warehouse: z.array(z.object({
              location: z.string(),
              units: z.number(),
            })),
          }),
          attributes: z.object({
            color: z.array(z.string()).optional(),
            size: z.array(z.string()).optional(),
            material: z.string().optional(),
          }),
          ratings: z.object({
            average: z.number().min(0).max(5),
            count: z.number(),
            distribution: z.object({
              five: z.number(),
              four: z.number(),
              three: z.number(),
              two: z.number(),
              one: z.number(),
            }),
          }),
        })).min(2).max(3),
      })).min(2),
    }),
  });

  const { object } = await generateObject({
    model: gemini('gemini-3-pro-preview'),
    schema: catalogSchema,
    prompt: 'Generate a product catalog for an electronics store with 2 categories, each having 2-3 products.',
  });

  console.log('Generated catalog:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 3: Educational course structure
async function example3_courseStructure() {
  console.log('3️⃣  Educational Course Structure\n');
  
  const courseSchema = z.object({
    course: z.object({
      title: z.string(),
      code: z.string().describe('Course code'),
      credits: z.number(),
      level: z.enum(['beginner', 'intermediate', 'advanced']),
      instructor: z.object({
        name: z.string(),
        title: z.string(),
        department: z.string(),
        contact: z.object({
          email: z.string().email(),
          office: z.string(),
          hours: z.string(),
        }),
      }),
      modules: z.array(z.object({
        number: z.number(),
        title: z.string(),
        description: z.string(),
        duration: z.string().describe('Estimated time to complete'),
        lessons: z.array(z.object({
          title: z.string(),
          type: z.enum(['video', 'reading', 'quiz', 'assignment']),
          duration: z.number().describe('Duration in minutes'),
          resources: z.array(z.object({
            name: z.string(),
            type: z.string(),
            url: z.string().url().optional(),
          })).optional(),
        })),
        assessment: z.object({
          type: z.string(),
          weight: z.number().describe('Percentage of final grade'),
          dueDate: z.string().optional(),
        }),
      })),
      prerequisites: z.array(z.object({
        code: z.string(),
        title: z.string(),
        required: z.boolean(),
      })).optional(),
    }),
  });

  const { object } = await generateObject({
    model: gemini('gemini-3-pro-preview'),
    schema: courseSchema,
    prompt: 'Generate a computer science course on "Introduction to Machine Learning" with 3 modules.',
  });

  console.log('Generated course:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 4: API response with nested data
async function example4_apiResponse() {
  console.log('4️⃣  API Response Structure\n');
  
  const apiResponseSchema = z.object({
    status: z.number().describe('HTTP status code'),
    success: z.boolean(),
    data: z.object({
      user: z.object({
        id: z.string().uuid(),
        profile: z.object({
          username: z.string(),
          displayName: z.string(),
          bio: z.string().optional(),
          avatar: z.object({
            url: z.string().url(),
            thumbnail: z.string().url(),
          }),
          verified: z.boolean(),
        }),
        stats: z.object({
          posts: z.number(),
          followers: z.number(),
          following: z.number(),
          engagement: z.object({
            likes: z.number(),
            comments: z.number(),
            shares: z.number(),
          }),
        }),
        recentPosts: z.array(z.object({
          id: z.string(),
          content: z.string().max(280),
          media: z.array(z.object({
            type: z.enum(['image', 'video']),
            url: z.string().url(),
          })).optional(),
          metrics: z.object({
            likes: z.number(),
            comments: z.number(),
            shares: z.number(),
          }),
          timestamp: z.string(),
        })).max(3),
        settings: z.object({
          privacy: z.object({
            profileVisibility: z.enum(['public', 'friends', 'private']),
            messageRequests: z.boolean(),
            showActivity: z.boolean(),
          }),
          notifications: z.object({
            email: z.boolean(),
            push: z.boolean(),
            sms: z.boolean(),
            preferences: z.array(z.string()),
          }),
        }),
      }),
    }),
    meta: z.object({
      requestId: z.string(),
      timestamp: z.string(),
      version: z.string(),
    }),
  });

  const { object } = await generateObject({
    model: gemini('gemini-3-pro-preview'),
    schema: apiResponseSchema,
    prompt: 'Generate a social media API response for fetching a user profile with recent posts.',
  });

  console.log('Generated API response:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Example 5: Configuration file with nested settings
async function example5_configFile() {
  console.log('5️⃣  Application Configuration\n');
  
  const configSchema = z.object({
    app: z.object({
      name: z.string(),
      version: z.string().describe('Semantic version'),
      environment: z.enum(['development', 'staging', 'production']),
      server: z.object({
        host: z.string(),
        port: z.number(),
        ssl: z.object({
          enabled: z.boolean(),
          cert: z.string().optional(),
          key: z.string().optional(),
        }),
        cors: z.object({
          enabled: z.boolean(),
          origins: z.array(z.string()),
          methods: z.array(z.string()),
        }),
      }),
      database: z.object({
        primary: z.object({
          type: z.enum(['postgres', 'mysql', 'mongodb']),
          host: z.string(),
          port: z.number(),
          name: z.string(),
          pool: z.object({
            min: z.number(),
            max: z.number(),
            idle: z.number(),
          }),
        }),
        cache: z.object({
          type: z.string(),
          host: z.string(),
          port: z.number(),
          ttl: z.number().describe('TTL in seconds'),
        }),
      }),
      features: z.object({
        authentication: z.object({
          providers: z.array(z.string()),
          session: z.object({
            timeout: z.number(),
            rolling: z.boolean(),
          }),
          twoFactor: z.object({
            enabled: z.boolean(),
            methods: z.array(z.string()),
          }),
        }),
        rateLimit: z.object({
          enabled: z.boolean(),
          window: z.number().describe('Window in milliseconds'),
          max: z.number().describe('Max requests per window'),
          skipSuccessfulRequests: z.boolean(),
        }),
      }),
      logging: z.object({
        level: z.enum(['debug', 'info', 'warn', 'error']),
        outputs: z.array(z.object({
          type: z.enum(['console', 'file', 'syslog']),
          level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
          format: z.string().optional(),
          path: z.string().optional(),
        })),
      }),
    }),
  });

  const { object } = await generateObject({
    model: gemini('gemini-3-pro-preview'),
    schema: configSchema,
    prompt: 'Generate a production configuration for a SaaS web application.',
  });

  console.log('Generated configuration:');
  console.log(JSON.stringify(object, null, 2));
  console.log();
}

// Main execution
async function main() {
  try {
    await example1_organizationStructure();
    await example2_productCatalog();
    await example3_courseStructure();
    await example4_apiResponse();
    await example5_configFile();
    
    console.log('✅ All nested structure examples completed!');
    console.log('\n💡 Key takeaways:');
    console.log('- Break complex structures into logical sub-objects');
    console.log('- Use descriptive field names and descriptions');
    console.log('- Arrays of objects work well for repeated structures');
    console.log('- Consider depth limits to avoid overly complex schemas');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Complex nested schemas may require more capable models like gemini-3-pro-preview');
  }
}

main().catch(console.error);