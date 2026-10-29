import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/*
 * Architecture boundaries (see docs/DECISIONS.md, ADR-008).
 * Cross-layer imports must use the `@/` alias, so these patterns can see them; relative imports
 * three or more levels up are banned for the same reason. ESLint does not merge
 * `no-restricted-imports` across config objects, so each layer lists its full set.
 */
const noDeepRelative = {
  group: ['../../../*'],
  message: 'Cross-layer imports must use the "@/" alias.',
};
const noFeatureInternals = {
  group: ['@/features/*/*'],
  message: 'Import another feature through its public index.ts, never its internals.',
};
const noAppOrPages = {
  group: ['@/app', '@/app/*', '@/pages', '@/pages/*'],
  message: 'Features and shared code must not depend on routes or the app shell.',
};
const onlyStoreHooks = {
  regex: '^@/store(?:/(?!(?:hooks|listenerMiddleware)$).*)?$',
  message: 'Features may only use store/hooks and store/listenerMiddleware.',
};

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'blob-report',
    'audit',
    'node_modules',
  ]),

  {
    files: ['**/*.{js,ts,tsx}'],
    extends: [js.configs.recommended],
  },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      jsxA11y.flatConfigs.recommended,
    ],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/no-danger': 'error',
      'react/prop-types': 'off',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.meta.name='import'][property.name='env']",
          message: 'Read configuration through @/shared/config/env only.',
        },
      ],
      'no-restricted-imports': ['error', { patterns: [noDeepRelative] }],
    },
  },

  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noDeepRelative,
            {
              group: [
                '@/features',
                '@/features/*',
                '@/store',
                '@/store/*',
                '@/pages',
                '@/pages/*',
                '@/app',
                '@/app/*',
              ],
              message: 'shared/ must not import from features, store, pages or app.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: ['src/features/cart/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [noDeepRelative, noFeatureInternals, noAppOrPages, onlyStoreHooks] },
      ],
    },
  },

  {
    files: ['src/features/cart/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noDeepRelative,
            noFeatureInternals,
            noAppOrPages,
            onlyStoreHooks,
            {
              group: ['@/features/catalog', '@/features/catalog/*'],
              message: 'cart must not depend on catalog (the dependency runs catalog → cart only).',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noDeepRelative,
            noFeatureInternals,
            { group: ['@/app', '@/app/*'], message: 'Pages must not import the app shell.' },
          ],
        },
      ],
    },
  },

  {
    files: ['src/env.ts', 'src/shared/config/env.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },

  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },

  {
    files: ['e2e/**/*.ts', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },

  prettier,
]);
