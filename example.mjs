import * as db from './dist/esm/index.mjs';

let johnDoe = { name: 'John Doe', age: 30 };
let jameSmith = { name: 'Jane Smith', age: 25 };

async function KV() {
    await db.init({
        "path": "./data",
        "type": "kv",
        "compress": true
    });

    // Set key-value pairs
    db.set('user1', johnDoe);
    db.set('user2', jameSmith);

    // Get value by key
    const user1 = db.get('user1');
    console.log('User 1:', user1);

    // Delete key-value pair
    db.delete('user2');

    // Reset the database
    db.reset("default");

    // Flush changes to disk, not necessary to add in your code.
    await db.flush();
}
KV();

async function TKV() {
    await db.init({
        "path": "./data",
        "type": "tkv",
        "compress": true
    });

    // Set key-value pairs
    db.set('users', 'user1', johnDoe);
    db.set('users', 'user2', jameSmith);

    // Get value by table and key
    const user1 = db.get('users', 'user1');
    console.log('User 1:', user1);

    // Delete key-value pair
    db.delete('users', 'user2');

    // Reset the users table
    db.reset("users");

    // Flush changes to disk, not necessary to add in your code.
    await db.flush();
}
TKV();