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
    hmr: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
    include: ['react', 'react-dom', 'three', '@react-three/fiber'],
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
