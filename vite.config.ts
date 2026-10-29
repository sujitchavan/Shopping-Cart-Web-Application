import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Production security headers. `vite preview` sends them so the E2E suite runs under the
 * same CSP as production. Keep in sync with `public/_headers` and `vercel.json`.
 */
const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' https://fakestoreapi.com; connect-src 'self' https://fakestoreapi.com; script-src 'self'; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'X-Frame-Options': 'DENY',
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Vendor chunks change far less often than app code, so they stay cached across deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (id.includes('react-router')) return 'router';
          if (/@reduxjs|immer|redux|reselect/.test(id)) return 'redux';
          if (id.includes('zod')) return 'zod';
          return 'vendor';
        },
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    headers: securityHeaders,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    unstubEnvs: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/**/*.d.ts',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/index.ts',
        'src/**/types.ts',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        branches: 75,
        functions: 80,
        'src/features/cart/model/**': { lines: 95, branches: 90 },
        'src/features/cart/persistence/**': { lines: 95, branches: 90 },
        'src/features/catalog/model/**': { lines: 95, branches: 90 },
        'src/features/catalog/api/productSchema.ts': { lines: 95, branches: 90 },
        'src/shared/lib/**': { lines: 95, branches: 90 },
      },
    },
  },
});
