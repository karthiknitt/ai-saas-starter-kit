import { describe, expect, it } from 'vitest';
import { openApiSpec } from '../../src/lib/openapi-spec';

describe('OpenAPI Specification', () => {
  describe('Spec Structure', () => {
    it('should have valid OpenAPI 3.0.3 version', () => {
      expect(openApiSpec.openapi).toBe('3.0.3');
    });

    it('should have complete info section', () => {
      expect(openApiSpec.info).toBeDefined();
      expect(openApiSpec.info.title).toBe('AI SaaS Starter Kit API');
      expect(openApiSpec.info.version).toBe('1.0.0');
      expect(openApiSpec.info.description).toBeDefined();
      expect(openApiSpec.info.contact).toBeDefined();
      expect(openApiSpec.info.contact.name).toBe('API Support');
      expect(openApiSpec.info.contact.email).toBe('support@example.com');
      expect(openApiSpec.info.license).toBeDefined();
      expect(openApiSpec.info.license.name).toBe('MIT');
    });

    it('should have servers configuration', () => {
      expect(openApiSpec.servers).toBeDefined();
      expect(Array.isArray(openApiSpec.servers)).toBe(true);
      expect(openApiSpec.servers.length).toBeGreaterThan(0);
      expect(openApiSpec.servers[0].url).toBe('/api');
      expect(openApiSpec.servers[0].description).toBe('API Server');
    });

    it('should have security schemes configured', () => {
      expect(openApiSpec.components).toBeDefined();
      expect(openApiSpec.components.securitySchemes).toBeDefined();
      expect(openApiSpec.components.securitySchemes.cookieAuth).toBeDefined();
      expect(openApiSpec.components.securitySchemes.cookieAuth.type).toBe(
        'apiKey',
      );
      expect(openApiSpec.components.securitySchemes.cookieAuth.in).toBe(
        'cookie',
      );
      expect(openApiSpec.components.securitySchemes.cookieAuth.name).toBe(
        'better-auth.session_token',
      );
    });

    it('should have global security configuration', () => {
      expect(openApiSpec.security).toBeDefined();
      expect(Array.isArray(openApiSpec.security)).toBe(true);
      expect(openApiSpec.security[0]).toHaveProperty('cookieAuth');
    });
  });

  describe('API Tags', () => {
    it('should define all API tags', () => {
      expect(openApiSpec.tags).toBeDefined();
      expect(Array.isArray(openApiSpec.tags)).toBe(true);

      const tagNames = openApiSpec.tags.map((tag) => tag.name);
      expect(tagNames).toContain('Authentication');
      expect(tagNames).toContain('Chat');
      expect(tagNames).toContain('Billing');
      expect(tagNames).toContain('Analytics');
      expect(tagNames).toContain('Workspaces');
      expect(tagNames).toContain('Admin');
    });

    it('should have descriptions for all tags', () => {
      openApiSpec.tags.forEach((tag) => {
        expect(tag.name).toBeDefined();
        expect(tag.description).toBeDefined();
        expect(tag.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('API Paths', () => {
    it('should define chat endpoint', () => {
      expect(openApiSpec.paths['/chat']).toBeDefined();
      expect(openApiSpec.paths['/chat'].post).toBeDefined();

      const chatPost = openApiSpec.paths['/chat'].post;
      expect(chatPost.tags).toContain('Chat');
      expect(chatPost.summary).toBe('Send AI chat message');
      expect(chatPost.requestBody).toBeDefined();
      expect(chatPost.responses).toBeDefined();
      expect(chatPost.responses['200']).toBeDefined();
      expect(chatPost.responses['401']).toBeDefined();
      expect(chatPost.responses['403']).toBeDefined();
    });

    it('should define models endpoint', () => {
      expect(openApiSpec.paths['/models']).toBeDefined();
      expect(openApiSpec.paths['/models'].get).toBeDefined();

      const modelsGet = openApiSpec.paths['/models'].get;
      expect(modelsGet.tags).toContain('Chat');
      expect(modelsGet.summary).toBe('Get available AI models');
      expect(modelsGet.responses).toBeDefined();
      expect(modelsGet.responses['200']).toBeDefined();
      expect(modelsGet.responses['401']).toBeDefined();
    });

    it('should define analytics endpoint', () => {
      expect(openApiSpec.paths['/analytics']).toBeDefined();
      expect(openApiSpec.paths['/analytics'].get).toBeDefined();

      const analyticsGet = openApiSpec.paths['/analytics'].get;
      expect(analyticsGet.tags).toContain('Analytics');
      expect(analyticsGet.summary).toBe('Get analytics data');
      expect(analyticsGet.parameters).toBeDefined();
      expect(Array.isArray(analyticsGet.parameters)).toBe(true);

      // Check period parameter
      const periodParam = analyticsGet.parameters.find(
        (p: any) => p.name === 'period',
      );
      expect(periodParam).toBeDefined();
      expect(periodParam.in).toBe('query');
      expect(periodParam.schema.enum).toContain('7d');
      expect(periodParam.schema.enum).toContain('30d');
      expect(periodParam.schema.enum).toContain('90d');
      expect(periodParam.schema.enum).toContain('all');
    });

    it('should define billing endpoints', () => {
      expect(openApiSpec.paths['/billing/subscription']).toBeDefined();
      expect(openApiSpec.paths['/billing/subscription'].get).toBeDefined();
      expect(openApiSpec.paths['/billing/usage']).toBeDefined();
      expect(openApiSpec.paths['/billing/usage'].get).toBeDefined();

      const subscriptionGet = openApiSpec.paths['/billing/subscription'].get;
      expect(subscriptionGet.tags).toContain('Billing');
      expect(subscriptionGet.summary).toBe('Get current subscription');
    });

    it('should define workspace endpoints', () => {
      expect(openApiSpec.paths['/workspaces']).toBeDefined();
      expect(openApiSpec.paths['/workspaces'].get).toBeDefined();
      expect(openApiSpec.paths['/workspaces'].post).toBeDefined();

      const workspacesPost = openApiSpec.paths['/workspaces'].post;
      expect(workspacesPost.tags).toContain('Workspaces');
      expect(workspacesPost.requestBody).toBeDefined();
      expect(workspacesPost.requestBody.required).toBe(true);

      // Check required fields
      const schema =
        workspacesPost.requestBody.content['application/json'].schema;
      expect(schema.required).toContain('name');
      expect(schema.required).toContain('plan');
    });

    it('should define admin endpoints', () => {
      expect(openApiSpec.paths['/admin/users']).toBeDefined();
      expect(openApiSpec.paths['/admin/users'].get).toBeDefined();

      const adminUsersGet = openApiSpec.paths['/admin/users'].get;
      expect(adminUsersGet.tags).toContain('Admin');
      expect(adminUsersGet.responses['403']).toBeDefined();
      expect(adminUsersGet.responses['403'].description).toContain('Admin');
    });
  });

  describe('Request/Response Schemas', () => {
    it('should have proper chat request schema', () => {
      const chatPost = openApiSpec.paths['/chat'].post;
      const requestSchema =
        chatPost.requestBody.content['application/json'].schema;

      expect(requestSchema.type).toBe('object');
      expect(requestSchema.required).toContain('messages');
      expect(requestSchema.required).toContain('model');
      expect(requestSchema.properties.messages).toBeDefined();
      expect(requestSchema.properties.messages.type).toBe('array');
      expect(requestSchema.properties.model).toBeDefined();
      expect(requestSchema.properties.model.type).toBe('string');
    });

    it('should have proper message schema in chat request', () => {
      const chatPost = openApiSpec.paths['/chat'].post;
      const requestSchema =
        chatPost.requestBody.content['application/json'].schema;
      const messageSchema = requestSchema.properties.messages.items;

      expect(messageSchema.type).toBe('object');
      expect(messageSchema.properties.role).toBeDefined();
      expect(messageSchema.properties.role.enum).toContain('user');
      expect(messageSchema.properties.role.enum).toContain('assistant');
      expect(messageSchema.properties.role.enum).toContain('system');
      expect(messageSchema.properties.content).toBeDefined();
    });

    it('should have proper models response schema', () => {
      const modelsGet = openApiSpec.paths['/models'].get;
      const responseSchema =
        modelsGet.responses['200'].content['application/json'].schema;

      expect(responseSchema.type).toBe('object');
      expect(responseSchema.properties.models).toBeDefined();
      expect(responseSchema.properties.models.type).toBe('array');

      const modelSchema = responseSchema.properties.models.items;
      expect(modelSchema.properties.id).toBeDefined();
      expect(modelSchema.properties.name).toBeDefined();
      expect(modelSchema.properties.provider).toBeDefined();
    });

    it('should have proper analytics response schema', () => {
      const analyticsGet = openApiSpec.paths['/analytics'].get;
      const responseSchema =
        analyticsGet.responses['200'].content['application/json'].schema;

      expect(responseSchema.type).toBe('object');
      expect(responseSchema.properties.metrics).toBeDefined();
      expect(responseSchema.properties.charts).toBeDefined();

      const metricsSchema = responseSchema.properties.metrics;
      expect(metricsSchema.properties.totalRequests).toBeDefined();
      expect(metricsSchema.properties.errorCount).toBeDefined();
      expect(metricsSchema.properties.errorRate).toBeDefined();
      expect(metricsSchema.properties.avgResponseTime).toBeDefined();

      const chartsSchema = responseSchema.properties.charts;
      expect(chartsSchema.properties.byResourceType).toBeDefined();
      expect(chartsSchema.properties.byDay).toBeDefined();
      expect(chartsSchema.properties.modelUsage).toBeDefined();
    });

    it('should have proper workspace creation schema', () => {
      const workspacesPost = openApiSpec.paths['/workspaces'].post;
      const requestSchema =
        workspacesPost.requestBody.content['application/json'].schema;

      expect(requestSchema.type).toBe('object');
      expect(requestSchema.required).toContain('name');
      expect(requestSchema.required).toContain('plan');
      expect(requestSchema.properties.name.minLength).toBe(2);
      expect(requestSchema.properties.name.maxLength).toBe(50);
      expect(requestSchema.properties.plan.enum).toContain('Free');
      expect(requestSchema.properties.plan.enum).toContain('Pro');
      expect(requestSchema.properties.plan.enum).toContain('Startup');
    });
  });

  describe('Error Responses', () => {
    it('should define 401 responses for authenticated endpoints', () => {
      const authenticatedEndpoints = [
        '/chat',
        '/models',
        '/analytics',
        '/billing/subscription',
        '/billing/usage',
        '/workspaces',
        '/admin/users',
      ];

      authenticatedEndpoints.forEach((path) => {
        const endpoint = openApiSpec.paths[path];
        const methods = Object.keys(endpoint);

        methods.forEach((method) => {
          const operation = endpoint[method];
          expect(operation.responses['401']).toBeDefined();
        });
      });
    });

    it('should define 403 responses for admin endpoints', () => {
      const adminUsersGet = openApiSpec.paths['/admin/users'].get;
      expect(adminUsersGet.responses['403']).toBeDefined();
      expect(adminUsersGet.responses['403'].description).toBeDefined();
    });
  });
});
