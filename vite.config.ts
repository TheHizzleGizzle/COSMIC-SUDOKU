import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `base: './'` keeps asset URLs relative so the same build works on GitHub Pages
// (served from a sub-path) and inside the Android WebView (served from the app origin).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
