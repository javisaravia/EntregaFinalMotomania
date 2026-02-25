import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                clubs: resolve(__dirname, 'clubs.html'),
                register: resolve(__dirname, 'register.html'),
                routes: resolve(__dirname, 'routes.html'),
            },
        },
    },
});
