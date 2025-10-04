// eslint.config.mjs

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
//import unicorn from 'eslint-plugin-unicorn';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
// import simpleImportSort from 'eslint-plugin-simple-import-sort';
import playwright from 'eslint-plugin-playwright';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    ignores: [
      'next-env.d.ts',
      '.next/*',
      'node_modules',
      'src/components/ui/*',
      'src/components/ai-elements/*',
    ],
  },
  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // React support
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
    },
  },

  // Next.js plugin
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'warn',
      '@next/next/no-img-element': 'warn',
      '@next/next/no-sync-scripts': 'warn',
    },
  },

  /*
  // Unicorn plugin settings
  {
    plugins: {
      unicorn,
    },
    rules: {
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: {
            e2e: true,
          },
          replacements: {
            props: false,
            ref: false,
            params: false,
          },
        },
      ],
    },
  },*/

  // Import plugin (optional: add import/resolver support if needed)
  {
    plugins: {
      import: importPlugin,
    },
  },

  // Simple import sort plugin
  /*
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  */

  // Prettier (disables formatting conflicts)
  prettier,

  // Playwright plugin for tests
  {
    files: ['**/tests/**/*.ts', '**/tests/**/*.tsx'],
    plugins: {
      playwright,
    },
    rules: {
      ...(playwright.configs?.recommended?.rules ?? {}),
    },
  },
];
