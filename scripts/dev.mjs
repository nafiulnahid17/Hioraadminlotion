// Dependency-free local preview for the static Cloudflare Pages app.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.sql':'text/plain','.txt':'text/plain' };
const port = Number(process.env.PORT || 4173);
createServer(async(req,res)=>{
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const p = resolve(root, '.' + pathname);
    if (!(p === root || p.startsWith(root+sep))) {res.writeHead(403);res.end('Forbidden');return}
    let file=p;
    try { const f=await stat(p);if(f.isDirectory())file=resolve(p,'index.html'); } catch { file=resolve(root,'index.html') }
    const bytes=await readFile(file);
    res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    res.writeHead(200);res.end(bytes);
  } catch(e) {res.writeHead(404);res.end('Not found')}
}).listen(port, '0.0.0.0',()=>console.log(`Hiora Studio preview at http://localhost:${port}`));
