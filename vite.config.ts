import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Production-only Content-Security-Policy (spec §8.5). It is a <meta> tag
// because the same build is served by GitHub Pages and by the Android WebView,
// neither of which lets us set headers. Dev mode needs inline scripts for HMR,
// so the plugin applies to `vite build` only.
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'cosmic-content-security-policy',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

// `base: './'` keeps asset URLs relative so the same build works on GitHub Pages
// (served from a sub-path) and inside the Android WebView (served from the app origin).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), contentSecurityPolicy()],
});
