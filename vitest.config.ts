import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      '__tests__/**/*.test.ts',
      '__tests__/**/*.spec.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/index.ts',
        'src/**/types/**',
        'src/**/__tests__/**',
      ],
    },
    setupFiles: ['./__tests__/setup.ts'],
  },
});
