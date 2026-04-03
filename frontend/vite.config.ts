import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: 'all',
  },
  // Polyfill Node.js globals that starknet.js may reference
  define: {
    'process.env': {},
    global: 'globalThis',
  },
});
