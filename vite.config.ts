import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, strictPort: true, host: 'localhost' },
  // Render (web-service mode) supplies PORT and needs a non-localhost bind.
  preview: { port: Number(process.env.PORT) || 3000, strictPort: true, host: true, allowedHosts: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
});
