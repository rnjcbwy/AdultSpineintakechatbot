// Tiny static server for eyeballing the traced figures without touching the
// Next dev server (running `next build`/`next dev` concurrently has repeatedly
// corrupted .next in this OneDrive-synced folder).
const http = require('http');
const fs = require('fs');
const path = require('path');
const TYPES = { '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
http.createServer((req, res) => {
  const file = path.join('public', decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(3101, () => console.log('http://localhost:3101'));
