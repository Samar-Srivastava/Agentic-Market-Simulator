import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // CRUCIAL: Import path module for alias resolution

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Configure Vite to resolve the @/ alias
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Map @/ to the src directory
    },
  },
});
