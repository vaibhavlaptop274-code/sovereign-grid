import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'keep-alive-stdin',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          setImmediate(() => {
            process.stdin.removeAllListeners('end');
          });
        });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Transpile React Three Fiber packages — they ship untranspiled JSX/ESM
  // that Vite's pre-bundler can choke on in production builds.
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
