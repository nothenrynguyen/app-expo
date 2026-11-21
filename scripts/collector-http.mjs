// Loaded before collector modules capture their default fetch implementation.
// Replacing a dispatcher alone leaves Node's bundled response parser in use.
import {fetch, Headers, Request, Response, FormData} from 'undici';
import {createRequire} from 'node:module';
Object.assign(globalThis, {fetch, Headers, Request, Response, FormData});
const {version}=createRequire(import.meta.url)('undici/package.json');
console.info(`Collector HTTP client: undici ${version}; ${process.version}`);
