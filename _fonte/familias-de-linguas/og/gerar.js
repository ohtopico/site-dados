// Gera infograficos/familias-de-linguas/og-familias-de-linguas.jpg (1200x630).
// Precisa de servidor local na raiz do site (python3 -m http.server 8771) e das fontes Sniglet 800 e Lexend 400/600
// em _fonte/familias-de-linguas/og/fontes/ (não vão para o repositório).
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8771';
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
  await pg.goto(`${BASE}/infograficos/familias-de-linguas/#port1283`); await pg.waitForTimeout(1200);
  await pg.click('#chips-fam .chip:nth-child(7)'); await pg.waitForTimeout(400); // Austronésia
  await pg.locator('#g-mapa').screenshot({ path: path.join(__dirname, 'mapa.png') }); // mapa da Austronésia;
  const og = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await og.goto('file://' + path.join(__dirname, 'og.html')); await og.waitForTimeout(500);
  await og.screenshot({ path: path.join(__dirname, '..', '..', '..', 'infograficos', 'familias-de-linguas', 'og-familias-de-linguas.jpg'), type: 'jpeg', quality: 88 });
  require('fs').unlinkSync(path.join(__dirname, 'mapa.png'));
  await b.close(); console.log('ok');
})();
