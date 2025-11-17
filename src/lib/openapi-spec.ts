/**
 * OpenAPI 3.0 Specification for AI SaaS Starter Kit API
 *
 * Comprehensive API documentation for all endpoints.
 *
 * @module lib/openapi-spec
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AI SaaS Starter Kit API',
    version: '1.0.0',
    description:
      'REST API for AI SaaS application with authentication, billing, analytics, and workspace management',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and session management',
    },
    {
      name: 'Chat',
      description: 'AI chat operations',
    },
    {
      name: 'Billing',
      description: 'Subscription and billing management',
    },
    {
      name: 'Analytics',
      description: 'Usage analytics and metrics',
    },
    {
      name: 'Workspaces',
      description: 'Workspace and team management',
    },
    {
      name: 'Admin',
      description: 'Administrative operations',
    },
  ],
  paths: {
    '/chat': {
      post: {
        tags: ['Chat'],
        summary: 'Send AI chat message',
        description: 'Send a message to AI and receive streaming response',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages', 'model'],
                properties: {
                  messages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        role: {
                          type: 'string',
                          enum: ['system', 'user', 'assistant'],
                        },
                        content: {
                          type: 'string',
                        },
                      },
                    },
                  },
                  model: {
                    type: 'string',
                    example: 'gpt-4o',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful response stream',
            content: {
              'text/event-stream': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - User not authenticated',
          },
          '403': {
            description: 'Forbidden - Quota exceeded',
          },
        },
      },
    },
    '/models': {
      get: {
        tags: ['Chat'],
        summary: 'Get available AI models',
        description:
          'Retrieve list of available AI models based on user subscription',
        responses: {
          '200': {
            description: 'List of available models',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    models: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          provider: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/billing/subscription': {
      get: {
        tags: ['Billing'],
        summary: 'Get current subscription',
        description: 'Retrieve user subscription details',
        responses: {
          '200': {
            description: 'Subscription details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    subscription: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        plan: { type: 'string' },
                        status: { type: 'string' },
                        currentPeriodStart: {
                          type: 'string',
                          format: 'date-time',
                        },
                        currentPeriodEnd: {
                          type: 'string',
                          format: 'date-time',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/billing/usage': {
      get: {
        tags: ['Billing'],
        summary: 'Get usage quota',
        description: 'Retrieve current usage and quota limits',
        responses: {
          '200': {
            description: 'Usage statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    used: { type: 'integer' },
                    limit: { type: 'integer' },
                    resetAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/analytics': {
      get: {
        tags: ['Analytics'],
        summary: 'Get analytics data',
        description: 'Retrieve usage analytics and metrics',
        parameters: [
          {
            name: 'period',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['7d', '30d', '90d', 'all'],
              default: '30d',
            },
            description: 'Time period for analytics',
          },
        ],
        responses: {
          '200': {
            description: 'Analytics data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    metrics: {
                      type: 'object',
                      properties: {
                        totalRequests: { type: 'integer' },
                        errorCount: { type: 'integer' },
                        errorRate: { type: 'number' },
                        avgResponseTime: { type: 'number' },
                      },
                    },
                    charts: {
                      type: 'object',
                      properties: {
                        byResourceType: { type: 'object' },
                        byDay: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              date: { type: 'string' },
                              count: { type: 'integer' },
                            },
                          },
                        },
                        modelUsage: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/workspaces': {
      get: {
        tags: ['Workspaces'],
        summary: 'List workspaces',
        description: 'Get all workspaces user has access to',
        responses: {
          '200': {
            description: 'List of workspaces',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    workspaces: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          slug: { type: 'string' },
                          plan: { type: 'string' },
                          userRole: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
      post: {
        tags: ['Workspaces'],
        summary: 'Create workspace',
        description: 'Create a new workspace',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'plan'],
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 50 },
                  plan: {
                    type: 'string',
                    enum: ['Free', 'Pro', 'Startup'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Workspace created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    workspace: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        slug: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users',
        description: 'Get all users (admin only)',
        responses: {
          '200': {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          email: { type: 'string' },
                          role: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
          '403': {
            description: 'Forbidden - Admin access required',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
      },
    },
  },
  security: [
    {
      cookieAuth: [],
    },
  ],
};
