import { renameSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log(`Running frontend post build script...`)
renameSync(path.resolve(__dirname, '../dist/index.html'), path.resolve(__dirname, '../dist/_index.html'));
console.log(`index.html renamed to _index.html so SSR of the index page can be assumed.`);

// Stamp index.js with a build timestamp for cache busting
const indexPath = path.resolve(__dirname, '../dist/_index.html');
const html = readFileSync(indexPath, 'utf8');
const stamped = html.replace('src="/index.js"', `src="/index.js?v=${Date.now()}"`);
writeFileSync(indexPath, stamped);
console.log('Stamped index.js with build version');