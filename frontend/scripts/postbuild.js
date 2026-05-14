import { renameSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log(`Running frontend post build script...`)
renameSync(path.resolve(__dirname, '../dist/index.html'), path.resolve(__dirname, '../dist/_index.html'));
console.log(`index.html renamed to _index.html so SSR of the index page can be assumed.`);
// NOTE: do NOT stamp ?v= on /index.js — the runtime MetaGenerator emits the
// script tag at request time, and adding a query param creates a duplicate
// module URL that breaks React (error #321: dual React instances).
// Cache invalidation is handled via Cache-Control: no-cache on /index.js
// served by the patched server/index.js static middleware.
