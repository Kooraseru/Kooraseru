import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: 'frontend/src/js',
    sourcemap: true,
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: {
      input: {
        'theme-manager': path.resolve(__dirname, 'frontend/src/ts/theme-manager.ts'),
        'language-system': path.resolve(__dirname, 'frontend/src/ts/language-system.ts'),
        'confetti': path.resolve(__dirname, 'frontend/src/ts/confetti.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        dir: 'frontend/src/js'
      }
    }
  }
});
