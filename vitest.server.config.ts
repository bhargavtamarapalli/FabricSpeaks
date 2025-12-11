import { defineConfig } from "vitest/config";
import path from 'path';

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "server/__tests__/**/*.test.{ts,tsx}",
    ],
    exclude: [
      "client/**",
      "tests/integration/**",
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
});
