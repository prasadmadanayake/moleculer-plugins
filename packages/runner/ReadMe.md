# Vite Plugin for moleculer-esm-runner

## Why
- This is created as a quick solution for problems I encountered during setting up `esm typescript moleculer project`. This was a quick  and dirty solution which I later refined a bit as a node module.

## What is this ?
- This is a plugin to easily run [moleculer](https://github.com/moleculerjs/moleculer) applications using moleculer-runner.
  - for further information check https://github.com/moleculerjs/moleculer repository 
- This wraps around moleculer esm runner and use `ViteDevServer` HMR to easily reload the services.


## Usage
- create vanilla vite project using `npx create-vite@latest`, Choose `Vanilla + Typescript`
-  
- install runner as dev dependency
  - `npm i -D @booru/vite-plugin-moleculer-runner`
  - you may also need to install following to fully setup moleculer app
    - dependencies
      - `moleculer`
      - `moleculer-repl` 
    - devDependencies 
      - `glob`
      - `dotenv`
      - `ts-node` 
- add vite.config.ts file with below content 
```ts
import {defineConfig} from 'vite'
import {resolve} from 'path'
import {MoleculerRunner} from '@booru/vite-plugin-moleculer-runner'
import glob from 'glob'

export default defineConfig({
    plugins: [
        MoleculerRunner.init({})
    ],
    build: {
        ssr: true,
        target: 'ESNext',
        lib: {
            entry: [
                ...glob.sync("**/*.service.ts", { absolute: false, cwd: '.' }).map(o=>resolve(__dirname, o)),
                resolve(__dirname, 'moleculer.config.ts')
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
    resolve: {alias: {"src": resolve('src/')}},

})


```
- if required update `tsconfig.json` if required
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ESNext"],
    "skipLibCheck": true,

    "moduleResolution": "Node",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,

    "esModuleInterop": true,
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": [
    "**.ts"
  ],
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  },
  "exclude": ["node_modules"]
}
``` 
- Now you can run application in dev mode using `npm run dev`
