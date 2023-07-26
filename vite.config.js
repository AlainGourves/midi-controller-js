// vite.config.js
/** @type {import('vite').UserConfig} */
import legacy from '@vitejs/plugin-legacy'
import svgicons from 'rollup-plugin-svg-icons'

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
        svgicons({
            // folder with svg-icons
            inputFolder: 'src/icons',  // it is default value

            // path for the sprite file
            output: 'dist/sprite.svg', // it is default value

            // Also you can use any Svgstore options:
            // https://github.com/svgstore/svgstore#svgstore-options
            //
            cleanDefs: true,
            // cleanSymbols
            // svgAttrs
            // symbolAttrs
            // copyAttrs
            // renameDefs: true,
            // .. and inline option for `svgstore.toSting()` method
            inline: true,

          }),
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
