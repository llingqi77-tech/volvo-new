import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/volvo-new/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.DEEPSEEK_API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY ?? ''),
      'process.env.DEEPSEEK_MODEL': JSON.stringify(env.DEEPSEEK_MODEL ?? ''),
      // Backward compatibility (if you still have OPENROUTER_* set)
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY ?? ''),
      'process.env.OPENROUTER_MODEL': JSON.stringify(env.OPENROUTER_MODEL ?? ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };
});
