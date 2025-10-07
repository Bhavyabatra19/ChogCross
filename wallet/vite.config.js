import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis', // Add global polyfill
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: false,
    minify: false, // Disable minification for debugging
    rollupOptions: {
      input: "./index.jsx",
      output: {
        entryFileNames: "wallet.bundle.js",
        format: "iife",
        inlineDynamicImports: true, // Bundle everything together
      },
      plugins: [
        // Inject Buffer polyfill at build time
        {
          name: 'buffer-polyfill',
          generateBundle(options, bundle) {
            const bundleFile = bundle['wallet.bundle.js'];
            if (bundleFile && bundleFile.type === 'chunk') {
              bundleFile.code = `
                // Buffer polyfill injection
                if (typeof global === 'undefined') {
                  var global = globalThis;
                }
                if (typeof window !== 'undefined' && !window.Buffer) {
                  try {
                    const bufferModule = require('buffer');
                    window.Buffer = bufferModule.Buffer;
                    global.Buffer = bufferModule.Buffer;
                  } catch (e) {
                    console.warn('Buffer polyfill injection failed:', e);
                  }
                }
                ${bundleFile.code}
              `;
            }
          }
        }
      ]
    }
  }
});
