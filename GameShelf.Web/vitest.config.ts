import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';

const mockStaticFiles: Plugin = {
    name: 'mock-static-files',
    resolveId(id) {
        if (/\.(module\.css|css|svg|png|jpg|jpeg|gif)$/.test(id)) {
            return '\0' + id;
        }
    },
    load(id) {
        if (!id.startsWith('\0')) return;
        const raw = id.slice(1);
        if (raw.endsWith('.module.css')) {
            return 'export default new Proxy({}, { get: (_, prop) => prop });';
        }
        if (raw.endsWith('.css')) {
            return '';
        }
        if (/\.(svg|png|jpg|jpeg|gif)$/.test(raw)) {
            return 'export default "";';
        }
    },
};

export default defineConfig({
    plugins: [react(), mockStaticFiles],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        globals: true,
    },
});
