// Imagem de compartilhamento de /infograficos/tecnologia-nas-escolas/ (1200x630).
// Uso: node _fonte/tecnologia-escolas/og/gerar.js <pasta com sniglet800.ttf, lexend400.ttf e lexend600.ttf>
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const RAIZ = path.join(__dirname, '..', '..', '..');
const PAG = path.join(RAIZ, 'infograficos', 'tecnologia-nas-escolas');
const fontes = path.resolve(process.argv[2] || __dirname);
const ler = f => fs.readFileSync(path.join(PAG, f), 'utf8');
global.window = {};
eval(ler('dados.js')); eval(ler('mapas.js'));
const T = window.TEC_ESCOLAS, M = window.TEC_MAPAS, ult = T.anos.length - 1;
const v = (u, i) => T.dados[u].pub[ult][i];
const nf = (x, d = 0) => x.toLocaleString('pt-BR', {minimumFractionDigits: d, maximumFractionDigits: d});
const CORES = ['#eef4f1', '#b9dcc8', '#6fb592', '#2f7f5a', '#0f4d33'];
const vals = Object.keys(M.rs.f).map(c => (T.dados[c] && T.dados[c].pub && T.dados[c].pub[ult]) ? T.dados[c].pub[ult][4] : null);
const caminhos = Object.keys(M.rs.f).map((c, k) => {
  const x = vals[k]; const cor = x == null ? '#e2e2dc' : CORES[Math.min(4, Math.floor(x / 20))];
  return `<path d="${M.rs.f[c][1]}" fill="${cor}" stroke="#fff" stroke-width=".7"/>`;
}).join('');
const ff = f => f;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Sniglet;font-weight:800;src:url(${ff('sniglet800.ttf')})}
@font-face{font-family:Lexend;font-weight:400;src:url(${ff('lexend400.ttf')})}
@font-face{font-family:Lexend;font-weight:600;src:url(${ff('lexend600.ttf')})}
body{margin:0;width:1200px;height:630px;background:#fff;font-family:Lexend;color:#111;position:relative;overflow:hidden;
 background-image:radial-gradient(#e6e6e0 1.3px,transparent 1.5px);background-size:18px 18px}
.t{position:absolute;left:60px;top:58px;width:560px}
.term{display:inline-block;background:#111;color:#fff;font:400 20px ui-monospace,monospace;padding:6px 14px;border-radius:10px}
h1{font:800 66px/1.02 Sniglet;margin:22px 0 0}
mark{background:#fff36b;padding:0 8px;border-radius:8px}
.nums{display:flex;gap:14px;margin-top:30px}
.nums div{border:2.5px solid #111;border-radius:16px;padding:12px 14px;background:#fff;width:150px}
.nums b{display:block;font:800 36px Sniglet}.nums span{font-size:15px;color:#444}
.f{position:absolute;left:60px;bottom:34px;font-size:17px;color:#444}
.m{position:absolute;right:40px;top:70px;width:470px;border:2.5px solid #111;border-radius:18px;background:#fff;box-shadow:6px 6px 0 #111;padding:16px}
.m p{margin:0 0 6px;font:600 16px Lexend}
</style></head><body>
<div class="t"><span class="term">$ censo escolar</span><h1>Tecnologia nas escolas <mark>em dados</mark></h1>
<div class="nums"><div><b>${nf(v('BR', 4), 0)}%</b><span>das escolas públicas com internet para os alunos</span></div>
<div><b>${nf(v('BR', 5), 0)}%</b><span>com laboratório de informática</span></div>
<div><b>${nf(v('BR', 7), 0)}</b><span>alunos por computador</span></div></div></div>
<div class="m"><p>Internet para os alunos nas escolas públicas do RS, ${T.anos[ult]}</p>
<svg viewBox="0 0 ${M.rs.w} ${M.rs.h}" width="436">${caminhos}</svg></div>
<div class="f">Brasil, 27 estados e 497 municípios do RS · Censo Escolar ${T.anos[0]} a ${T.anos[ult]} · juliaroberta.com</div>
</body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1200, height: 630}});
  const tmp = path.join(fontes, '_og-tecnologia.html'); fs.writeFileSync(tmp, html);
  await p.goto('file://' + tmp, {waitUntil: 'load'}); fs.unlinkSync(tmp); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({path: path.join(PAG, 'og-tecnologia-nas-escolas.jpg'), type: 'jpeg', quality: 88});
  await b.close();
})();
