// vite.config.js
/** @type {import('vite').UserConfig} */
import legacy from '@vitejs/plugin-legacy'

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
    }
}
