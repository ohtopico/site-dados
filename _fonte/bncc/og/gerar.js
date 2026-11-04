// Gera as imagens de compartilhamento (1200x630) das páginas BNCC em dados.
// Precisa de um servidor local na raiz do site (python3 -m http.server 8771) e das fontes Sniglet 800
// e Lexend 400/600 em _fonte/bncc/og/fontes/ (não vão para o repositório).
// Uso: node _fonte/bncc/og/gerar.js [http://localhost:8771]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://localhost:8771';
const PAGINAS = [
  { slug: 'bncc-computacao', disc: 'Computação', no: 10, largura: 1100, frase: '68 habilidades do 6º ano ao Ensino Médio, ligadas pelo conteúdo de um ano para o outro', p: ['68 habilidades', '98 ligações', '3 eixos'], margem: '-170px 0 0 -14px', img: 820 },
  { slug: 'bncc-matematica', disc: 'Matemática', no: 0, largura: 1300, frase: '247 habilidades do 1º ao 9º ano, ligadas pelo conteúdo de um ano para o outro', p: ['247 habilidades', '9 anos', '5 unidades'], margem: '-120px 0 0 -14px', img: 900 },
  { slug: 'bncc-arte', disc: 'Arte', no: 3, largura: 1100, frase: '61 habilidades do 1º ao 9º ano, ligadas pelo conteúdo de um ano para o outro', p: ['61 habilidades', '5 linguagens', '9 anos'], margem: '-120px 0 0 -14px', img: 900 },
  { slug: 'bncc-lingua-portuguesa', disc: 'Língua Portuguesa', no: 100, largura: 1300, frase: '185 habilidades do 6º ao 9º ano, ligadas pelo conteúdo', p: ['185 habilidades', '5 campos', '4 práticas'], margem: '-700px 0 0 -14px', img: 900 },
  { slug: 'bncc-literatura', disc: 'Literatura', no: 2, largura: 1100, frase: 'O campo artístico-literário de Língua Portuguesa do 6º ao 9º ano', p: ['21 habilidades', '6º ao 9º ano', '4 práticas'], margem: '-20px 0 0 -14px', img: 900 },
  { slug: 'bncc-lingua-inglesa', disc: 'Língua Inglesa', no: 5, largura: 1100, frase: '88 habilidades do 6º ao 9º ano, ligadas pelo conteúdo de um ano para o outro', p: ['88 habilidades', '5 eixos', '6º ao 9º ano'], margem: '-40px 0 0 -14px', img: 820 },
];
(async () => {
  const b = await chromium.launch();
  const modelo = fs.readFileSync(path.join(__dirname, 'og.html'), 'utf8');
  for (const p of PAGINAS) {
    const pg = await b.newPage({ viewport: { width: p.largura, height: 900 }, deviceScaleFactor: 2 });
    await pg.goto(`${BASE}/infograficos/${p.slug}/`); await pg.waitForTimeout(800);
    await pg.addStyleTag({ content: '.topbar{display:none!important}' });
    await pg.locator('#g-rede .no').nth(p.no).click(); await pg.waitForTimeout(300);
    await pg.locator('#g-rede').screenshot({ path: path.join(__dirname, p.slug + '-rede.png') });
    const html = modelo.replace(/{{slug}}/g, p.slug).replace('{{disc}}', p.disc).replace('{{frase}}', p.frase)
      .replace('{{p1}}', p.p[0]).replace('{{p2}}', p.p[1]).replace('{{p3}}', p.p[2]).replace('{{margem}}', p.margem)
      .replace('.dir img{width:820px;', `.dir img{width:${p.img}px;`);
    const tmp = path.join(__dirname, '_og.html'); fs.writeFileSync(tmp, html);
    const og = await b.newPage({ viewport: { width: 1200, height: 630 } });
    await og.goto('file://' + tmp); await og.waitForTimeout(500);
    await og.screenshot({ path: path.join(__dirname, '..', '..', '..', 'infograficos', p.slug, `og-${p.slug}.jpg`), type: 'jpeg', quality: 88 });
    fs.unlinkSync(tmp); fs.unlinkSync(path.join(__dirname, p.slug + '-rede.png'));
    console.log('ok', p.slug);
  }
  await b.close();
})();
