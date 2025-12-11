import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setupEnv.ts'],
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/e2e/**',
      'tests/performance/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'coverage/**',
        'dist/**',
        'supabase/**',
        '**/node_modules/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'tests/**',
        'vite.config.ts',
        'vitest.config.ts',
        'postcss.config.js',
        'tailwind.config.ts',
      ],
      include: [
        'server/**/*.ts',
        'client/src/**/*.{ts,tsx}',
        'shared/**/*.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
      },
    },
    testTimeout: 20000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@server': path.resolve(__dirname, './server'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
