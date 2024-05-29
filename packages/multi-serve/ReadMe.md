# Plugin to serve multiple roots from moleculer-web applications

## Why
- This is to serve multiple static roots using different paths. This uses serve-static under the hood to serve static files.


## Usage
- install moleculer-multi-serve as dev dependency
  - `npm i @booru/moleculer-multi-serve`
  - you may also need to install following to fully setup moleculer app
    - dependencies
      - `moleculer`
      - `moleculer-web` 
- add roots to serve as
``` ts
settings: ServiceSettingSchema ={
    serve: {
      '/fe1/x': {folder: 'dist/fe1'},
      '/fe2/y': {folder: 'dist/fe2'},
      '/fe3/z': {folder: 'dist/fe3'},
      '/fe4/q': {folder: 'dist/fe4'},

    }
  }
``` 
- full sample
```ts
import {ServiceSchema, ServiceSettingSchema} from "moleculer";
import APIGateway from 'moleculer-web'
import {ServeMixin} from '@booru/moleculer-multi-serve'

export class MainServiceSchema implements Partial<ServiceSchema>{
  name:string  =  "main3"
  mixins: Partial<ServiceSchema>[] =  [ APIGateway, new ServeMixin()]
  settings: ServiceSettingSchema = {
    serve: {
      '/fe1/x': {folder: 'dist/fe1'},
      '/fe2/y': {folder: 'dist/fe2'},
      '/fe3/z': {folder: 'dist/fe3'},
      '/fe4/q': {folder: 'dist/fe4'},

    },
    port: process.env.PORT || 3000,
    routes: [
      {
        path: "/api/v2",
        whitelist: [
          "**",
        ],
        authorization: false,
        autoAliases: true,
        mappingPolicy: 'restrict',
        cors: true,
        bodyParsers: {
          json: {
            strict: false,
          },
          urlencoded: {
            extended: false,
          },
        },
      }
    ]
  }
}

```
