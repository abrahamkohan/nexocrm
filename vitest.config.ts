import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'], // Only your code
    exclude: ['**/simulator/**', '**/node_modules/**'], // Skip broken simulator + node_modules
    server: {
      deps: {
        // Externalize supabase and its native deps to avoid broken @exodus/bytes resolution
        external: ['@supabase/supabase-js', '@exodus/bytes', /node_modules\/@supabase/],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
