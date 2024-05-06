import {defineConfig, Plugin} from 'vite'
import dts from 'vite-plugin-dts'
import {resolve} from 'path'

export default defineConfig({
    plugins: [
        dts()
    ],
    build: {
        ssr: true,
        target: 'ESNext',
        lib: {
            entry: [
                resolve(__dirname, 'src/main.ts'),
            ]
        },
        rollupOptions:{
            output:[
                {
                    dir: 'dist',
                    format: 'es',
                    preserveModules: false,
                    entryFileNames: '[name].mjs',
                }
            ]

        },
        copyPublicDir: false
    },
    resolve: {alias: {"src": resolve('src')}},

})
