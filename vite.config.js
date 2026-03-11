import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js', // Crearemos este archivo ahora
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'lcov'], // 'lcov' es vital para Sonar
    },
  },
})
