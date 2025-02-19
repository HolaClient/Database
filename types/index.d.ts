interface DatabaseInfo {
    version: string;
    author: string;
    async: boolean;
    initStatus: boolean;
    functions: string[];
    type: 'tkv' | 'kv';
    compression: boolean;
    storagePath: string;
}
interface DatabaseConfig {
    path: string;
    type: 'tkv' | 'kv';
    compress?: boolean;
}
declare let isLoaded: boolean;
declare function set(key: string, value: any, ignored?: any): boolean;
declare function get(key: string, ignored?: any): any;
declare function remove(key: string, ignored?: any): boolean;
declare function reset(table: string): Promise<boolean>;
declare function init(config: DatabaseConfig): Promise<boolean>;
declare function flush(): Promise<boolean>;
declare function info(): DatabaseInfo;
declare const dynabase: {
    get: typeof get;
    set: typeof set;
    delete: typeof remove;
    reset: typeof reset;
    init: typeof init;
    info: typeof info;
    flush: typeof flush;
    status: boolean;
};
export default dynabase;
export { get, set, remove as delete, reset, init, info, flush, isLoaded as status };
