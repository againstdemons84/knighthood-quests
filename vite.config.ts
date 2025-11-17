/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Configure for GitHub Pages deployment
  base: '/knighthood-quests/',
  
  // Build configuration
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['chart.js', 'react-chartjs-2']
        }
      }
    }
  },
  
  // Public directory configuration
  publicDir: 'public',
  
  // Development server configuration
  server: {
    port: 3000,
    open: true
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  
  // CSS configuration - use Vite defaults for CSS modules
  
  // Optimize dependencies to avoid Chart.js issues
  optimizeDeps: {
    include: ['chart.js', 'react-chartjs-2']
  },
  
  // Test configuration
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
      '**/tests/e2e/**',  // Exclude Playwright tests
      '**/playwright-report/**',
      '**/test-results/**'
    ]
  }
});