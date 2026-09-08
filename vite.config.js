import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: '/simulador.html'
  },
  build: {
    rollupOptions: {
      input: {
        simulador: resolve(__dirname, 'simulador.html'),
        nomenclatura: resolve(__dirname, 'index.html')
      }
    }
  }
});
