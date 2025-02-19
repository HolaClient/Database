# Dynabase

World's fastest TKV (Table-Key-Value) database with KV support for Node.js. Written in TypeScript with both CommonJS and ESM support.

[![Version](https://img.shields.io/npm/v/dynabase.svg)](https://www.npmjs.com/package/dynabase)
[![License](https://img.shields.io/npm/l/dynabase.svg)](https://github.com/HolaClient/dynabase/blob/main/LICENSE)
[![Node Version](https://img.shields.io/node/v/dynabase.svg)](https://nodejs.org)

## Features

- 🚀 Ultra-fast in-memory database with file persistence
- 📦 Supports both KV (Key-Value) and TKV (Table-Key-Value) modes
- 💾 Automatic data persistence
- 🔄 Automatic file descriptor management
- 🔒 Safe process termination handling
- 📁 JSON storage with compression option
- 📦 Both ESM and CommonJS support

## Installation

```bash
npm install dynabase
```

## Quick Start

### Key-Value Mode (KV)

```javascript
const db = require('dynabase');

async function main() {
    // Initialize in KV mode
    await db.init({
        path: "./data",    // Storage directory
        type: "kv",        // Database type
        compress: true     // Enable compression
    });

    // Set values
    db.set('user1', { name: 'John', age: 30 });

    // Get values
    const user = db.get('user1');

    // Delete values
    db.delete('user1');
}
```

### Table-Key-Value Mode (TKV)

```javascript
const db = require('dynabase');

async function main() {
    // Initialize in TKV mode
    await db.init({
        path: "./data",    // Storage directory
        type: "tkv",       // Database type
        compress: true     // Enable compression
    });

    // Set values
    db.set('users', 'user1', { name: 'John', age: 30 });

    // Get values
    const user = db.get('users', 'user1');

    // Delete values
    db.delete('users', 'user1');
}
```

## API Reference

### Initialization

```typescript
interface DatabaseConfig {
    path: string;         // Storage directory path
    type: 'tkv' | 'kv';   // Database type
    compress?: boolean;    // Enable JSON compression
}

await db.init(config: DatabaseConfig): Promise<boolean>
```

### Core Operations

#### KV Mode

- `set(key: string, value: any): boolean`
- `get(key: string): any`
- `delete(key: string): boolean`

#### TKV Mode

- `set(table: string, key: string, value: any): boolean`
- `get(table: string, key: string): any`
- `delete(table: string, key: string): boolean`

### Additional Functions

#### Reset Table/Database

```javascript
// In KV mode: resets entire database
await db.reset('default');

// In TKV mode: resets specific table
await db.reset('tableName');
```

#### Manual Flush

```javascript
// Force write to disk
await db.flush();
```

#### Database Info

```javascript
const info = db.info();
/*
{
    version: string;
    author: string;
    async: boolean;
    initStatus: boolean;
    type: 'tkv' | 'kv';
    compression: boolean;
    storagePath: string;
    functions: string[];
}
*/
```

## Storage

- Data is stored in JSON files in the specified directory
- KV mode uses a single `default.json` file
- TKV mode creates separate JSON files for each table
- Automatic persistence every 5 seconds
- Safe process termination handling

## Best Practices

1. **Initialization**
   - Always await `db.init()` before using other functions
   - Choose appropriate mode (KV/TKV) based on your data structure

2. **Data Types**
   - Values can be any JSON-serializable data
   - Keys must be strings
   - Table names must be strings

3. **Performance**
   - Use compression for large datasets
   - Group related data in tables (TKV mode)
   - Use KV mode for simple key-value storage

4. **Error Handling**
   - All async operations return Promises
   - Check return values for operation success
   - Handle potential errors in async operations

## License

GNU General Public License v3.0

## Authors

[CR072](https://github.com/CR072),  
[HolaClient](https://github.com/HolaClient)
