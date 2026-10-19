import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export function offlinePlugin() {
  return { name: 'orbit-offline', apply: 'build', async closeBundle() {
    const assets = (await readdir('dist/assets')).map(name => 'assets/' + name);
    const files = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'about.html', ...assets];
    const version = createHash('sha256').update(await readFile('dist/index.html')).digest('hex').slice(0,12);
    const source = `const CACHE = 'orbit-${version}';
const FILES = ${JSON.stringify(files)};
const url = path => new URL(path, self.registration.scope).href;
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(url)))));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if(key.startsWith('orbit-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('message', event => { if(event.data === 'ACTIVATE') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if(request.mode === 'navigate') return (await cache.match(request, {ignoreSearch:true, ignoreVary:true})) || (await cache.match(url('index.html'))) || fetch(request);
    const saved = await cache.match(request, { ignoreVary: true });
    if(saved) return saved;
    const response = await fetch(request);
    if(response.ok && new URL(request.url).origin === self.location.origin) await cache.put(request,response.clone());
    return response;
  })());
});`;
    await writeFile('dist/sw.js', source);
  }};
}

