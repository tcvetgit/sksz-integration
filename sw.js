/* Service worker: офлайн-кэш всего приложения */
const CACHE='szvers-v25';
const ASSETS=[
"./",
"./app.js",
"./data.js",
"./questions.js",
"./icons/apple-touch-icon.png",
"./icons/favicon-64.png",
"./icons/icon-192.png",
"./icons/icon-512.png",
"./icons/icon-maskable-512.png",
"./img/goodt-end.png",
"./img/goodt-login.png",
"./img/goodt-logo.jpg",
"./img/goodt-start.png",
"./img/goodt-store.jpg",
"./img/qr-appstore.png",
"./img/qr-googleplay.png",
"./img/qr-materials.png",
"./img/qr-server.png",
"./img/shema.png",
"./img/shkaf.png",
"./img/t1.png",
"./img/t2.png",
"./img/t3.png",
"./img/t4.png",
"./img/t5.png",
"./img/tsd.png",
"./img/ukritie.png",
"./img/vhod.png",
"./img/vhod2.png",
"./index.html",
"./manifest.webmanifest",
"./style.css"
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url); if(u.origin!==location.origin)return;
  // config.js и страница — сначала сеть (чтобы быстро подхватить новый адрес таблицы), при офлайне — кэш
  if(/\/(config\.js|index\.html)?$/.test(u.pathname)){
    e.respondWith(fetch(e.request).then(resp=>{if(resp&&resp.ok){const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}return resp;})
      .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(resp=>{
    if(resp&&resp.ok){const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));} return resp;
  }).catch(()=>caches.match('./index.html'))));
});
