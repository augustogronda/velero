import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
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
  },
  plugins: [
    VitePWA({
      // Usamos el sw.js manual en /public para control total
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/node_modules/**']
      },
      manifest: false, // usamos nuestro manifest.json en /public
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ]
});
