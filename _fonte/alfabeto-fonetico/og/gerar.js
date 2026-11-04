// Gera a imagem de compartilhamento (1200x630) de /infograficos/alfabeto-fonetico/.
// Precisa de um servidor local na raiz do site (python3 -m http.server 8771) e das fontes em
// _fonte/bncc/og/fontes/ (Sniglet 800, Lexend 400/600; não vão para o repositório).
// Uso: node _fonte/alfabeto-fonetico/og/gerar.js [http://localhost:8771]
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8771';
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
  await pg.goto(`${BASE}/infograficos/alfabeto-fonetico/`); await pg.waitForTimeout(800);
  await pg.addStyleTag({ content: '.topbar{display:none!important}' });
  await pg.locator('#t-consoantes').screenshot({ path: path.join(__dirname, 'quadro.png') });
  const og = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await og.goto('file://' + path.join(__dirname, 'og.html')); await og.waitForTimeout(500);
  await og.screenshot({ path: path.join(__dirname, '..', '..', '..', 'infograficos', 'alfabeto-fonetico', 'og-alfabeto-fonetico.jpg'), type: 'jpeg', quality: 88 });
  require('fs').unlinkSync(path.join(__dirname, 'quadro.png'));
  await b.close();
  console.log('ok');
})();
