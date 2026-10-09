
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, configDir, '');

  const backendUrl =
    env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': configDir,
      },
    },

    server: {
      port: 3000,
      host: '0.0.0.0',

      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/docs': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/openapi.json': {
          target: backendUrl,
          changeOrigin: true,
        },
      },

      hmr: process.env.DISABLE_HMR !== 'true',
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {},
    },
  };
});
