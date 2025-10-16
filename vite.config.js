import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // rutas relativas para deploy
  build: {
    outDir: 'dist', // carpeta de salida
    rollupOptions: {
      output: {
        // mantener nombres legibles de assets
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  }
});
