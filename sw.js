const CACHE='worker-manager-v3';
const ASSETS=['./','./index.html','./manifest.json','./worker-edit.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith((async()=>{
    const req=e.request;
    let r=await caches.match(req);
    if(!r){ try { r=await fetch(req); const copy=r.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); } catch(err){ return caches.match('./index.html'); } }
    if(req.mode==='navigate' || (r.headers.get('content-type')||'').includes('text/html')){
      const text=await r.text();
      return new Response(text.replace('</body>','<script src="./worker-edit.js"></script></body>'),{headers:{'Content-Type':'text/html; charset=utf-8'}});
    }
    return r;
  })());
});
