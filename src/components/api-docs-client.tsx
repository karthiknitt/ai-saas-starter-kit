/**
 * API Documentation Client Component
 *
 * Interactive API documentation with code examples.
 *
 * @module components/api-docs-client
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  queryParams?: Record<string, string>;
  requestBody?: Record<string, unknown>;
  response: Record<string, unknown>;
}

interface ApiCategory {
  category: string;
  endpoints: ApiEndpoint[];
}

const API_ENDPOINTS: ApiCategory[] = [
  {
    category: 'Authentication',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/sign-in/email',
        description: 'Sign in with email and password',
        requestBody: {
          email: 'user@example.com',
          password: 'password123',
        },
        response: {
          user: {
            id: 'user_123',
            email: 'user@example.com',
            name: 'John Doe',
            role: 'member',
          },
        },
      },
      {
        method: 'POST',
        path: '/api/auth/sign-up/email',
        description: 'Create a new account',
        requestBody: {
          email: 'user@example.com',
          password: 'password123',
          name: 'John Doe',
        },
        response: {
          user: {
            id: 'user_123',
            email: 'user@example.com',
            name: 'John Doe',
          },
        },
      },
    ],
  },
  {
    category: 'AI Chat',
    endpoints: [
      {
        method: 'POST',
        path: '/api/chat',
        description: 'Send a message to AI and get streaming response',
        requestBody: {
          messages: [
            {
              role: 'user',
              content: 'Hello, how are you?',
            },
          ],
          model: 'gpt-4o',
        },
        response: {
          stream: true,
          contentType: 'text/event-stream',
        },
      },
      {
        method: 'GET',
        path: '/api/models',
        description: 'Get available AI models for current subscription',
        response: {
          models: [
            {
              id: 'gpt-4o',
              name: 'GPT-4 Turbo',
              provider: 'openai',
            },
          ],
        },
      },
    ],
  },
  {
    category: 'User Management',
    endpoints: [
      {
        method: 'GET',
        path: '/api/user/api-keys',
        description: 'Get user API keys',
        response: {
          apiKeys: {
            openai: 'sk-...',
            openrouter: 'sk-or-v1-...',
          },
          provider: 'openai',
        },
      },
      {
        method: 'POST',
        path: '/api/user/api-keys',
        description: 'Set or update API keys',
        requestBody: {
          apiKey: 'sk-...',
          provider: 'openai',
        },
        response: {
          success: true,
        },
      },
    ],
  },
  {
    category: 'Billing & Subscriptions',
    endpoints: [
      {
        method: 'POST',
        path: '/api/billing/checkout',
        description: 'Create a checkout session',
        requestBody: {
          plan: 'pro',
        },
        response: {
          checkoutUrl: 'https://checkout.polar.sh/...',
        },
      },
      {
        method: 'GET',
        path: '/api/billing/subscription',
        description: 'Get current subscription details',
        response: {
          subscription: {
            id: 'sub_123',
            plan: 'Pro',
            status: 'active',
            currentPeriodEnd: '2025-12-16T00:00:00Z',
          },
        },
      },
      {
        method: 'GET',
        path: '/api/billing/usage',
        description: 'Get usage quota and statistics',
        response: {
          quota: {
            used: 150,
            limit: 1000,
            percentage: 15,
          },
        },
      },
    ],
  },
  {
    category: 'Analytics',
    endpoints: [
      {
        method: 'GET',
        path: '/api/analytics',
        description: 'Get usage analytics and metrics',
        queryParams: {
          period: '30d',
          userId: 'user_123',
        },
        response: {
          metrics: {
            totalRequests: 150,
            errorCount: 2,
            errorRate: 1.33,
            avgResponseTime: 1250,
          },
          charts: {
            byDay: [],
            modelUsage: {},
          },
        },
      },
    ],
  },
  {
    category: 'Session Management',
    endpoints: [
      {
        method: 'GET',
        path: '/api/sessions',
        description: 'Get all active sessions',
        response: {
          sessions: [
            {
              id: 'session_123',
              createdAt: '2025-11-16T00:00:00Z',
              expiresAt: '2025-12-16T00:00:00Z',
              ipAddress: '192.168.1.1',
              isCurrent: true,
            },
          ],
        },
      },
      {
        method: 'DELETE',
        path: '/api/sessions?id=session_123',
        description: 'Revoke a session',
        response: {
          success: true,
        },
      },
    ],
  },
  {
    category: 'Admin',
    endpoints: [
      {
        method: 'GET',
        path: '/api/admin/users',
        description: 'Get all users (admin only)',
        response: {
          users: [
            {
              id: 'user_123',
              name: 'John Doe',
              email: 'john@example.com',
              role: 'member',
            },
          ],
        },
      },
      {
        method: 'PATCH',
        path: '/api/admin/users',
        description: 'Update user role (admin only)',
        requestBody: {
          userId: 'user_123',
          role: 'moderator',
        },
        response: {
          success: true,
        },
      },
      {
        method: 'GET',
        path: '/api/admin/audit-logs',
        description: 'Get audit logs (admin only)',
        response: {
          logs: [
            {
              id: 'log_123',
              action: 'user.role_updated',
              userId: 'user_123',
              timestamp: '2025-11-16T00:00:00Z',
            },
          ],
        },
      },
    ],
  },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-blue-600',
    POST: 'bg-green-600',
    PATCH: 'bg-yellow-600',
    DELETE: 'bg-red-600',
  };

  return (
    <span
      className={`rounded px-2 py-1 text-xs font-mono text-white ${colors[method] || 'bg-gray-600'}`}
    >
      {method}
    </span>
  );
}

export function ApiDocsClient() {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const toggleEndpoint = (key: string) => {
    setExpandedEndpoint(expandedEndpoint === key ? null : key);
  };

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            The AI SaaS API is organized around REST. Our API has predictable
            resource-oriented URLs, accepts JSON-encoded request bodies, returns
            JSON-encoded responses, and uses standard HTTP response codes.
          </p>

          <h3 className="text-lg font-semibold mt-4">Base URL</h3>
          <code className="block bg-gray-100 p-2 rounded">
            {typeof window !== 'undefined'
              ? window.location.origin
              : 'https://your-domain.com'}
            /api
          </code>

          <h3 className="text-lg font-semibold mt-4">Authentication</h3>
          <p>
            Most API endpoints require authentication. The API uses
            session-based authentication via cookies. Sign in first to receive a
            session cookie.
          </p>

          <h3 className="text-lg font-semibold mt-4">Rate Limiting</h3>
          <p>
            API requests are rate limited to prevent abuse. Free plan: 100
            requests/hour, Pro: 1000 requests/hour, Startup: Unlimited.
          </p>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      {API_ENDPOINTS.map((category) => (
        <div key={category.category}>
          <h2 className="text-2xl font-bold mb-4">{category.category}</h2>

          <div className="space-y-4">
            {category.endpoints.map((endpoint, idx) => {
              const key = `${category.category}-${idx}`;
              const isExpanded = expandedEndpoint === key;

              return (
                <Card key={key}>
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleEndpoint(key)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MethodBadge method={endpoint.method} />
                        <code className="text-sm font-mono">
                          {endpoint.path}
                        </code>
                      </div>
                      <span className="text-sm font-normal text-gray-600">
                        {isExpanded ? '−' : '+'}
                      </span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                      {endpoint.description}
                    </p>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4 border-t pt-4">
                      {endpoint.queryParams && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">
                            Query Parameters
                          </h4>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(endpoint.queryParams, null, 2)}
                          </pre>
                        </div>
                      )}

                      {endpoint.requestBody && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">
                            Request Body
                          </h4>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(endpoint.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold text-sm mb-2">Response</h4>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(endpoint.response, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          Example Request
                        </h4>
                        <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                          {`curl -X ${endpoint.method} \\
  ${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}${endpoint.path} \\
  -H "Content-Type: application/json" \\${
    endpoint.requestBody
      ? `\n  -d '${JSON.stringify(endpoint.requestBody)}'`
      : ''
  }`}
                        </pre>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Error Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Error Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Code</th>
                <th className="text-left p-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-mono">200</td>
                <td className="p-2">Success</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-mono">201</td>
                <td className="p-2">Created</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-mono">400</td>
                <td className="p-2">Bad Request - Invalid parameters</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-mono">401</td>
                <td className="p-2">Unauthorized - Authentication required</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-mono">403</td>
                <td className="p-2">Forbidden - Insufficient permissions</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-mono">404</td>
                <td className="p-2">Not Found</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-mono">429</td>
                <td className="p-2">Too Many Requests - Rate limit exceeded</td>
              </tr>
              <tr>
                <td className="p-2 font-mono">500</td>
                <td className="p-2">Internal Server Error</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
