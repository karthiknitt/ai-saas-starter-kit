/**
 * API Documentation Page
 *
 * Comprehensive API reference for developers.
 *
 * @module app/api-docs
 */

import { ApiDocsClient } from '@/components/api-docs-client';

export const metadata = {
  title: 'API Documentation | AI SaaS',
  description: 'Complete API reference and documentation',
};

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">API Documentation</h1>
        <p className="text-gray-600 mt-2">
          Complete API reference for AI SaaS Starter Kit
        </p>
      </div>

      <ApiDocsClient />
    </div>
  );
}
