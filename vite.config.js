import { defineConfig } from 'vite';

export default defineConfig({
    // برای Miden Web SDK که WASM و Web Worker استفاده می‌کنه
    optimizeDeps: {
        exclude: ['@miden-sdk/miden-sdk']
    },
    build: {
        target: 'esnext',
        outDir: 'dist',
        rollupOptions: {
            output: {
                manualChunks: {
                    'miden': ['@miden-sdk/miden-sdk']
                }
            }
        }
    },
    server: {
        headers: {
            // برای Web Worker و SharedArrayBuffer
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin'
        }
    },
    worker: {
        format: 'es'
    }
});
