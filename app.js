/* app.js
   Core application utilities, advanced features, and background tasks.
   This file intentionally contains many helper functions, polyfills,
   and a small in-memory database to simulate complexity.
*/

/* Lightweight event emitter */
class Emitter {
  constructor(){ this._events = Object.create(null); }
  on(name, fn){ (this._events[name] = this._events[name] || []).push(fn); return this; }
  off(name, fn){ if(!this._events[name]) return this; this._events[name] = this._events[name].filter(f=>f!==fn); return this; }
  emit(name, ...args){ (this._events[name]||[]).forEach(fn=>fn(...args)); return this; }
}

/* Tiny in-memory DB with persistence to IndexedDB fallback to localStorage */
const DB = (function(){
  const DB_NAME = 'mega_demo_db';
  const STORE = 'kv';
  let db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const idb = e.target.result;
        if (!idb.objectStoreNames.contains(STORE)) {
          idb.createObjectStore(STORE, {keyPath: 'k'});
        }
      };
      req.onsuccess = (e) => { db = e.target.result; resolve(db); };
      req.onerror = (e) => { resolve(null); };
    });
  }

  async function set(key, value) {
    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        store.put({k:key,v:value});
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } else {
      try {
        localStorage.setItem('db_' + key, JSON.stringify(value));
        return true;
      } catch(e) { return false; }
    }
  }

  async function get(key) {
    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.v : null);
        req.onerror = () => resolve(null);
      });
    } else {
      try {
        const raw = localStorage.getItem('db_' + key);
        return raw ? JSON.parse(raw) : null;
      } catch(e) { return null; }
    }
  }

  async function remove(key) {
    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } else {
      try {
        localStorage.removeItem('db_' + key);
        return true;
      } catch(e) { return false; }
    }
  }

  // Initialize
  open();

  return { set, get, remove, open };
})();

/* Advanced utilities */
const Utils = {
  debounce(fn, wait=200){
    let t;
    return function(...args){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); };
  },
  throttle(fn, wait=100){
    let last=0;
    return function(...args){ const now=Date.now(); if(now-last>wait){ last=now; fn.apply(this,args); } };
  },
  deepClone(obj){
    return JSON.parse(JSON.stringify(obj));
  },
  uuid(prefix='u'){
    return prefix + '_' + Math.random().toString(36).slice(2,12);
  },
  // Simple fuzzy search score
  fuzzyScore(text, query){
    text = text.toLowerCase(); query = query.toLowerCase();
    if (!query) return 0;
    let score = 0, qi = 0;
    for (let i=0;i<text.length && qi<query.length;i++){
      if (text[i] === query[qi]) { score += 2; qi++; }
      else if (text[i] === query[qi].toUpperCase()) score += 1;
    }
    return qi === query.length ? score : 0;
  }
};

/* Background worker simulation using setInterval */
const Background = (function(){
  const emitter = new Emitter();
  let tick = 0;
  let timer = null;

  function start() {
    if (timer) return;
    timer = setInterval(() => {
      tick++;
      emitter.emit('tick', tick);
      // periodic cleanup
      if (tick % 60 === 0) emitter.emit('hourly', tick);
    }, 1000);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function on(event, fn) { emitter.on(event, fn); }
  function off(event, fn) { emitter.off(event, fn); }

  return { start, stop, on, off };
})();

/* Simple plugin system */
const Plugins = (function(){
  const plugins = [];
  function register(p) {
    if (!p || !p.name) throw new Error('Invalid plugin');
    plugins.push(p);
    if (p.init) p.init({DB, Utils, Background});
  }
  function list() { return plugins.slice(); }
  return { register, list };
})();

/* Example plugin that auto-saves to DB every 10 seconds */
Plugins.register({
  name: 'autosave',
  init({DB, Background}) {
    Background.on('tick', (t) => {
      if (t % 10 === 0) {
        // gather state from window.megaDemo if available
        try {
          const s = window.megaDemo && window.megaDemo.state ? window.megaDemo.state : null;
          if (s) DB.set('autosave_state', s);
        } catch(e){}
      }
    });
  }
});

/* Expose a diagnostics function */
async function diagnostics() {
  const dbTest = await DB.get('autosave_state');
  return {
    time: new Date().toISOString(),
    indexedDB: !!window.indexedDB,
    autosave_present: !!dbTest,
    localStorageSize: Object.keys(localStorage).length
  };
}

/* Attach to window for dev */
window.AppCore = {
  Emitter,
  DB,
  Utils,
  Background,
  Plugins,
  diagnostics
};

/* Start background tasks */
Background.start();

/* Example of a complex algorithm included to increase file size
   A simple implementation of Perlin noise for procedural generation
*/
const Perlin = (function(){
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i=0;i<256;i++) p[i]=i;
  // shuffle
  for (let i=255;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    const t = p[i]; p[i]=p[j]; p[j]=t;
  }
  for (let i=0;i<512;i++) perm[i]=p[i & 255];

  function fade(t){ return t*t*t*(t*(t*6-15)+10); }
  function lerp(a,b,t){ return a + t*(b-a); }
  function grad(hash, x, y, z){
    const h = hash & 15;
    const u = h<8 ? x : y;
    const v = h<4 ? y : (h===12||h===14 ? x : z);
    return ((h&1) ? -u : u) + ((h&2) ? -v : v);
  }

  function noise(x, y=0, z=0){
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X]+Y, AA = perm[A]+Z, AB = perm[A+1]+Z;
    const B = perm[X+1]+Y, BA = perm[B]+Z, BB = perm[B+1]+Z;
    return lerp(
      lerp(
        lerp(grad(perm[AA], x, y, z), grad(perm[BA], x-1, y, z), u),
        lerp(grad(perm[AB], x, y-1, z), grad(perm[BB], x-1, y-1, z), u),
        v
      ),
      lerp(
        lerp(grad(perm[AA+1], x, y, z-1), grad(perm[BA+1], x-1, y, z-1), u),
        lerp(grad(perm[AB+1], x, y-1, z-1), grad(perm[BB+1], x-1, y-1, z-1), u),
        v
      ),
      w
    );
  }

  return { noise };
})();

/* Utility to generate a large sample dataset for the app */
async function generateSampleData(count = 200) {
  const files = [];
  for (let i=0;i<count;i++){
    const id = Utils.uuid('f');
    const name = `sample-${i+1}.md`;
    const content = `# Sample ${i+1}\n\nGenerated at ${new Date().toISOString()}\n\nNoise: ${Perlin.noise(i*0.1, i*0.2)}`;
    files.push({id, name, content, lang:'md', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()});
  }
  await DB.set('sample_files', files);
  return files;
}

/* Provide a large export function that composes many parts */
async function fullExport() {
  const state = window.megaDemo && window.megaDemo.state ? window.megaDemo.state : {};
  const dbSample = await DB.get('sample_files');
  const diag = await diagnostics();
  const payload = {
    exportedAt: new Date().toISOString(),
    state,
    dbSample,
    diagnostics: diag
  };
  return JSON.stringify(payload, null, 2);
}

/* Expose advanced API */
window.AppCore.fullExport = fullExport;
window.AppCore.generateSampleData = generateSampleData;

/* End of app core */
      return randomItem(mockWeatherData);
    }
  };
})();
