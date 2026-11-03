const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.join(__dirname, '../frontend');
const files = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'], '/deployment.json': ['deployment.json', 'application/json'], '/ethers.js': ['../node_modules/ethers/dist/ethers.umd.min.js', 'text/javascript'] };
http.createServer(async (req, res) => {
  const file = files[req.url?.split('?')[0]];
  if (!file) { res.writeHead(404).end('Nao encontrado'); return; }
  try {
    const body = await fs.readFile(path.join(root, file[0]));
    res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-store' }).end(body);
  } catch { res.writeHead(404).end('Execute npm run deploy:local para gerar a configuracao.'); }
}).listen(3000, '127.0.0.1', () => console.log('Interface: http://localhost:3000'));
