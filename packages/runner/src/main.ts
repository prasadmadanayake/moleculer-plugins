import {HmrContext, ModuleNode, Plugin, ViteDevServer} from 'vite'
import {pathToFileURL} from "node:url";
import {register, createRequire} from "node:module";
import {join, dirname} from 'path'
import {Middleware, ServiceBroker} from 'moleculer'
import {globSync as sync} from "glob";

export interface Options {
    env: boolean,
    hot: boolean
    repl: boolean
    config: string,
    files: string,
    tsconfig: string,
    middleware: (server: ViteDevServer) => Middleware[]
    esm: boolean
}

export const defaultOpts: Options = {
    env: true,
    hot: true,
    esm: true,
    repl: true,
    config: "moleculer.config.ts",//'moleculer.config.mjs',
    tsconfig: '',
    files: "**/*.service.ts",//'**/*.service.mjs',
    middleware: (server) => ([])
}


export interface MoleculerDevServer extends ViteDevServer {
    broker?: ServiceBroker
}


class MolRunner implements Partial<Plugin> {
    name: string = "mol_runner"
    apply: 'serve' | 'build' = "serve"
    private static options: Options = defaultOpts
    private static runner: any & { broker?: ServiceBroker };

    async init(opts: Partial<Options> = {}): Promise<Plugin> {
        MolRunner.options = {...MolRunner.options, ...opts}
        register("ts-node/esm", pathToFileURL("./"));
        const require = createRequire(import.meta.url);
        const dir = require.resolve('moleculer')
        const path = join(dirname(dir), 'src', 'runner-esm.mjs')
        const {default: Runner} = await import(path.startsWith('/') ? path : "/" + path)
        MolRunner.runner = new Runner();
        return this as Plugin;
    }

    async buildEnd(error?: Error) {
        await MolRunner.runner.broker.stop();
    }

    async configureServer(server: ViteDevServer) {


        if (MolRunner.runner.broker) {
            await MolRunner.runner.restartBroker()
        } else {
            let args = [];
            if (MolRunner.options.env) args.push("--env");
            if (MolRunner.options.repl) args.push("--repl");
            ServiceBroker.defaultOptions.middlewares = MolRunner.options.middleware(server)
            args.push("--config", MolRunner.options.config)
            await MolRunner.runner.start([...process.argv.slice(0, 2), ...args])
        }

        return async () => {
            const files = sync(MolRunner.options.files, {absolute: true});
            let mods = files.map(async f => {
                let ref = await server.moduleGraph.getModuleByUrl(f, true)
                if (ref)
                    server.moduleGraph.invalidateModule(ref)
                const mod = await server.ssrLoadModule(f)
                const s = MolRunner.runner.broker.createService(mod.default)
                s.__filename = f;
            })
            await Promise.all(mods)
        }

    }

    async handleHotUpdate({file, server, modules, timestamp, ...args}: HmrContext) {
        let items: string[] = []
        items = MolRunner.findRecursively(modules, items, "service.ts")

        let services = MolRunner.runner.broker?.services || []
        const current = items.reduce((acc: any[], cur: string) => {
            const svc: any = services.find((x: any) => x.__filename === cur);
            if (svc) return [...acc, svc]
            return acc;
        }, [] as any[])

        MolRunner.runner.broker?.logger.warn(`Hot Reload ${items.length} services. restarting ${current.length} services`)
        const dest = current.map(async (o: any) => MolRunner.runner.broker?.destroyService(o))
        await Promise.all(dest)
        const create = [...new Set(items)].map(async (o: string) => {
            //@ts-ignore
            let mod: ModuleNode = await server.moduleGraph.getModuleByUrl(o, true)
            if (mod)
                server.moduleGraph.invalidateModule(mod)
            let mod2 = await server.ssrLoadModule(o)
            //@ts-ignore
            const s = MolRunner.runner.broker?.createService?.(mod2.default)
            s.__filename = o;
            return true;
        })
        await Promise.all(create);
        return modules;

    }

    private static findRecursively(set: Array<ModuleNode> | Set<ModuleNode>, files: string[], suffix: string): string[] {
        for (let key of set) {
            if (key.file && key.file.endsWith(suffix))
                files.push(key.file)
            else
                files = [...files, ...MolRunner.findRecursively(key.importers, files, suffix)];
        }
        return files

    }
}

export const MoleculerRunner = new MolRunner()

