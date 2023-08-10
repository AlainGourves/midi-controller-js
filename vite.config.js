// vite.config.js
/** @type {import('vite').UserConfig} */
import legacy from '@vitejs/plugin-legacy'
import { resolve } from 'path'

export default {
    // config options
    root: './src',

    server: {
        port: 3000,
        host: true,
    },

    plugins: [
        // legacy({
        //     targets: ['defaults', 'not IE 11']
        // }),
    ],

    // empêche esbuild de minifier les noms des fonctions,
    // ça pose des problèmes avec les fonctions de dessin des blocs, dont l'attribut `name` est utilisé pour la gestion des blocs actifs
    esbuild: {
        keepNames: true
    },

    build: {
        emptyOutDir: true,
        outDir: '../dist',
        sourcemap: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html'),
                nested: resolve(__dirname, 'src/examples/example1.html'),
            },
        },
    }
}
