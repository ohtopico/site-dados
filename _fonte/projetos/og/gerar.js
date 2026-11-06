// Capas de compartilhamento (1200x630) dos estudos de caso.
// Uso: na raiz do repositório, com um servidor local servindo a raiz:
//   python3 -m http.server 8765 &   node _fonte/projetos/og/gerar.js http://localhost:8765
// Lê _fonte/projetos/og/capas.json (gerado por _fonte/projetos/gerar.py) e grava projetos/**/og.jpg.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const base = process.argv[2] || 'http://localhost:8765';
const capas = JSON.parse(fs.readFileSync(path.join(__dirname, 'capas.json'), 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const html = c => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${base}/assets/fontes/fontes.css">
<style>
*{box-sizing:border-box} body{margin:0;width:1200px;height:630px;background:#f4f4f2;font-family:Lexend,sans-serif;color:#111;
 background-image:radial-gradient(#d9d9d6 1.4px,transparent 1.6px);background-size:22px 22px;display:flex;align-items:center;justify-content:center}
.j{width:1100px;height:540px;background:#fff;border:3px solid #111;border-radius:30px;box-shadow:10px 10px 0 #111;overflow:hidden;display:flex;flex-direction:column}
.b{display:flex;align-items:center;gap:9px;padding:13px 22px;border-bottom:3px solid #111;background:#f4f4f2;font:800 17px Sniglet;letter-spacing:.08em;text-transform:uppercase}
.b i{width:16px;height:16px;border-radius:50%;border:2px solid #111;display:inline-block}.b i:nth-child(1){background:#fff36b}.b i:nth-child(2){background:#e6edff}
.c{flex:1;padding:36px 46px;display:flex;flex-direction:column;gap:22px}
.t{display:inline-block;align-self:flex-start;font:500 22px ui-monospace,Consolas,monospace;background:#111;color:#fff;border-radius:12px;padding:8px 16px}
h1{font:800 58px/1.08 Sniglet;margin:0;max-width:880px}
.r{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:20px}
.tags{display:flex;flex-wrap:wrap;gap:10px;max-width:700px}.tags span{font-size:20px;font-weight:600;border:2px solid #111;border-radius:99px;padding:5px 16px;background:#efefed}
.n{text-align:right}.n b{display:block;font:800 60px/1 Sniglet;background:#fff36b;padding:4px 14px;border-radius:12px}.n span{font-size:19px;color:#4a4f4f}
</style></head><body><div class="j"><div class="b"><i></i><i></i><i></i><span>juliaroberta.com / projetos</span></div>
<div class="c"><span class="t">${esc(c.terminal)}</span><h1>${esc(c.titulo)}</h1>
<div class="r"><div class="tags">${c.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
<div class="n"><b>${esc(c.numero[0])}</b><span>${esc(c.numero[1])}</span></div></div></div></div></body></html>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const c of capas) {
    // a página precisa vir do mesmo servidor das fontes (sem isso o navegador bloqueia as fontes)
    const tmp = path.join(__dirname, '_capa.html');
    fs.writeFileSync(tmp, html(c));
    await p.goto(`${base}/_fonte/projetos/og/_capa.html?v=${Date.now()}`, { waitUntil: 'networkidle' });
    fs.unlinkSync(tmp);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: c.arquivo, type: 'jpeg', quality: 88 });
    console.log(c.arquivo);
  }
  await b.close();
})();
