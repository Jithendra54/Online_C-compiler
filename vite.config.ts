import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves this repository under /Online_C-compiler/.
  base: '/Online_C-compiler/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
