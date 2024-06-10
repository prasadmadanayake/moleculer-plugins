import {IncomingMessage, ServerResponse} from "http";
import path from "path";
import serveStatic from "serve-static";
import {ServiceSchema, ServiceSettingSchema, ServiceSyncLifecycleHandler} from "moleculer";
import {pathToRegexp} from "path-to-regexp";
import {HttpError} from "http-errors";

export type PathTransform = (prefix: string,url: string, opts: {req: IncomingMessage, res: ServerResponse})=>string;

export const KeepPrefix: PathTransform = (p, r, q)=> path.join(p, r)
export const StripPrefix: PathTransform = (p, r, q)=> r


export interface Serve extends serveStatic.ServeStaticOptions{
    folder: string,
    transformPath?: PathTransform
}

export interface ServeSettings extends ServiceSettingSchema{
    serve?: {[key:string]: Serve}
}

export interface StaticRoot{
    serve: serveStatic.RequestHandler<ServerResponse>
    re: RegExp,
    path: string,
    transformPath: PathTransform,
    priority: number
}

export class MultiRoots implements Partial<ServiceSchema<ServeSettings>>{

    serve?: serveStatic.RequestHandler<ServerResponse>;
    $static: StaticRoot[] = [];
    settings : ServeSettings = { }

    created: ServiceSyncLifecycleHandler<ServeSettings> = function (){
        if(this.settings.serve){
            const segRe = new RegExp(/\//g)
            this.$static = Object.entries(this.settings.serve).map(([k,v]: [string, Serve])=>{
                const {folder, transformPath, ...args } = v as Serve;
                let fullPath = k;
                if (fullPath !== "/" && fullPath.endsWith("/")) {
                    fullPath = fullPath.slice(0, -1);
                }
                return {
                    path: fullPath,
                    re: pathToRegexp(`${fullPath}(.*)`),
                    transformPath: transformPath || StripPrefix,
                    serve: serveStatic(folder, args),
                    priority: (fullPath.match(segRe) || []).length
                } as StaticRoot
            })
            this.$static.sort((a:StaticRoot,b:StaticRoot)=>b.priority - a.priority);
            this.serve =  function (request: IncomingMessage, response: ServerResponse, next: (err?: HttpError) => void) {
                if(request.url != null){
                    for(let s of this.$static){
                        const m = s.re.exec(request.url)
                        if(!m) continue;
                        const p = request.url
                        let url = request.url.substring(s.path.length);
                        if (url.length == 0 || url[0] !== "/")
                            url = "/" + url;
                        request.url = s.transformPath(s.path, url, {req: request, res: response})
                        s.serve(request, response, next)
                        return;
                    }
                }
                next()
            }
        }

    }

}
