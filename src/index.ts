import { promises as fs } from 'fs';
import path from 'path';

interface TableData {
    [key: string]: any;
}

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

const STORE_SIZE: number = 1024;
const data: Int32Array = new Int32Array(STORE_SIZE * STORE_SIZE);
const values: any[] = new Array(STORE_SIZE * STORE_SIZE);
const dirty: Map<string, TableData> = new Map();

let syncInterval: NodeJS.Timeout | undefined;
let isSyncing: boolean = false;
let isLoaded: boolean = false;
let dataChanged: boolean = false;

const MAX_FD: number = 32;
const fdPool: number[] = [];
let currentFd: number = 0;

let dbPath: string;
let dbType: 'tkv' | 'kv' = 'tkv';
let useCompression: boolean = false;

async function getFd(): Promise<number | null> {
    if (fdPool.length < MAX_FD) {
        return Promise.resolve(null);
    }
    return new Promise(resolve => {
        const fd = fdPool[currentFd];
        currentFd = (currentFd + 1) % MAX_FD;
        resolve(fd);
    });
}

function releaseFd(fd: number | null): void {
    if (fd !== null && !fdPool.includes(fd)) {
        fdPool.push(fd);
    }
}

async function safeFileOp<T>(operation: (fd: number | null) => Promise<T>): Promise<T> {
    let fd = await getFd();
    try {
        return await operation(fd);
    } finally {
        if (fd !== null) {
            releaseFd(fd);
        }
    }
}

async function ensureDirExists(dirPath: string): Promise<void> {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

async function writeFileWithFD(filepath: string, data: any): Promise<void> {
    try {
        await safeFileOp<void>(async () => {
            const content = JSON.stringify(
                data,
                null,
                useCompression ? undefined : 2
            );
            await fs.writeFile(filepath, content, { encoding: 'utf8' });
        });
    } catch (e) {
        console.error('Write error:', e);
    }
}

async function readFileWithFD(filepath: string): Promise<any> {
    try {
        const content = await safeFileOp<string>(async () => {
            return await fs.readFile(filepath, { encoding: 'utf8' });
        });
        return JSON.parse(content);
    } catch (e) {
        console.error(`Read error for ${filepath}:`, e);
        return {};
    }
}

async function syncToFiles(): Promise<boolean> {
    if (isSyncing || !dataChanged) return false;
    isSyncing = true;
    
    try {
        for (const [table, tableData] of dirty) {
            if (dbType === 'kv' && table !== 'default') continue;
            const filepath = path.join(dbPath, `${table}.json`);
            await writeFileWithFD(filepath, tableData);
        }
    } finally {
        dataChanged = false;
        isSyncing = false;
    }
    return true;
}

function startSync(): void {
    if (!syncInterval) {
        syncInterval = setInterval(syncToFiles, 5000);
    }
}

function set(key: string, value: any, ignored?: any): boolean {
    if (dbType === 'kv') {
        const tableData = dirty.get('default') || {};
        tableData[key] = value;
        dirty.set('default', tableData);
    } else {
        let tableData = dirty.get(key) || {};
        tableData[value] = ignored;
        dirty.set(key, tableData);
    }
    dataChanged = true;
    return true;
}

function get(key: string, ignored?: any): any {
    if (dbType === 'kv') {
        const tableData = dirty.get('default');
        return tableData ? tableData[key] : null;
    }
    const tableData = dirty.get(key);
    return tableData ? tableData[ignored] : null;
}

function remove(key: string, ignored?: any): boolean {   
    if (dbType === 'kv') {
        const tableData = dirty.get('default');
        if (tableData && key in tableData) {
            delete tableData[key];
            dirty.set('default', tableData);
            dataChanged = true;
            return true;
        }
    } else {
        const tableData = dirty.get(key);
        if (tableData && ignored in tableData) {
            delete tableData[ignored];
            dirty.set(key, tableData);
            dataChanged = true;
            return true;
        }
    }
    return false;
}

async function reset(table: string): Promise<boolean> {   
    try {
        const filepath = path.join(dbPath, `${table}.json`);
        await safeFileOp<void>(async () => {
            try {
                await fs.unlink(filepath);
            } catch {
            }
        });
        dirty.delete(table);
        dataChanged = true;
        return true;
    } catch {
        return false;
    }
}

async function init(config: DatabaseConfig): Promise<boolean> {
    try {
        dbPath = path.resolve(config.path);
        dbType = config.type;
        useCompression = config.compress ?? false;

        await ensureDirExists(dbPath);
        
        const files = await fs.readdir(dbPath);
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            
            try {
                const table = file.slice(0, -5);
                const filepath = path.join(dbPath, file);
                const tableData = await readFileWithFD(filepath);
                
                if (dbType === 'kv') {
                    dirty.set('default', { ...dirty.get('default'), ...tableData });
                } else {
                    dirty.set(table, tableData);
                }
            } catch (e) {
                console.error(`Error loading ${file}:`, e);
            }
        }
        
        startSync();
        isLoaded = true;
        return true;
    } catch (e) {
        console.error('Load error:', e);
        return false;
    }
}

async function flush(): Promise<boolean> {
    return syncToFiles();
}

function info(): DatabaseInfo {
    return {
        version: "1.0.0",
        author: "CR072",
        async: false,
        initStatus: isLoaded,
        type: dbType,
        compression: useCompression,
        storagePath: dbPath,
        functions: ["get", "set", "delete", "reset", "init"]
    };
}

const dynabase = {
    get,
    set,
    delete: remove,
    reset,
    init,
    info,
    flush,
    status: isLoaded
};

['beforeExit', 'SIGINT', 'SIGTERM', 'uncaughtException', 'unhandledRejection'].forEach(i => {
    process.on(i, async (error?: any) => {
        if (i !== 'beforeExit') {
            console.log(`Received ${i}${error ? ':' : '.'} ${error || ''}`);
        }
        await flush();
        if (i !== 'beforeExit') {
            process.exit(i === 'SIGINT' ? 0 : 1);
        }
    });
});

export default dynabase;
export { 
    get,
    set,
    remove as delete,
    reset,
    init,
    info,
    flush,
    isLoaded as status
};