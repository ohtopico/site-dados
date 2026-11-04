/* Famílias de línguas do mundo. Dados: Glottolog 5.2.1 e WALS Online (CC BY 4.0), em dados.js. */
(function () {
'use strict';
const D = window.LINGUAS;
const FAM = D.fam, NOS = D.nos, LING = D.ling;
const ISO = FAM.length - 1;
const fmt = n => n.toLocaleString('pt-BR');
const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '–';
const sem = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const K = () => [1, 2, 3, 4, 5, 6, 7, 8].map(i => css('--k' + i));
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, at, pai) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (pai) pai.appendChild(e); return e; };
const PT = LING.findIndex(l => l[1] === 'port1283');

/* ---------- estrutura da árvore ---------- */
// Cada nó: {nome, id, pai, filhos:[], n (línguas), ling (índice) ou -1}
const nos = NOS.map(n => ({ nome: n[0], id: n[1], pai: n[2], filhos: [], n: 0, ling: -1 }));
const folhas = LING.map((l, i) => ({ nome: l[0], id: l[1], pai: l[2], filhos: [], n: 1, ling: i }));
nos.forEach(n => { if (n.pai >= 0) nos[n.pai].filhos.push(n); });
folhas.forEach(f => { if (f.pai >= 0) { nos[f.pai].filhos.push(f); let p = f.pai; while (p >= 0) { nos[p].n++; p = nos[p].pai; } } });
const ordena = n => { n.filhos.sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome)); n.filhos.forEach(ordena); };
// Raiz artificial para as isoladas
const raizIso = { nome: 'Línguas isoladas', id: 'ISO', pai: -1, filhos: folhas.filter(f => LING[f.ling][3] === ISO), n: 0, ling: -1 };
raizIso.n = raizIso.filhos.length;
const raizFam = FAM.map((f, i) => i === ISO ? raizIso : nos[f[5]]);
raizFam.forEach(ordena);
const paiDe = n => n === raizIso ? null : (n.ling >= 0 ? (LING[n.ling][3] === ISO ? raizIso : nos[n.pai]) : (n.pai >= 0 ? nos[n.pai] : null));

/* ---------- estado ---------- */
let famSel = FAM.findIndex(f => f[1] === 'indo1319');
let raiz = raizFam[famSel];   // nó em foco na árvore
let lingSel = -1;             // língua destacada
let ramoDe = new Map(), ramoNo = new Map(), abertos = new Set();       // índice da língua -> índice do ramo (0..6, 7 = outros)
let ramos = [];               // [{nome, n}]

/* ---------- tooltip ---------- */
const tip = document.getElementById('tip-g');
function mostra(ev, html) { tip.innerHTML = html; tip.style.opacity = 1; const x = ev.clientX + 14, y = ev.clientY + 14;
  tip.style.left = Math.min(x, innerWidth - tip.offsetWidth - 8) + 'px'; tip.style.top = Math.min(y, innerHeight - tip.offsetHeight - 8) + 'px'; }
function esconde() { tip.style.opacity = 0; }

/* ---------- números do topo ---------- */
(function resumo() {
  const ext = LING.filter(l => l[6] === 6).length, ame = LING.filter(l => l[6] >= 2 && l[6] <= 5).length, vivas = LING.filter(l => l[6] !== 6).length;
  document.getElementById('n-ling').textContent = fmt(LING.length);
  document.getElementById('n-fam').textContent = fmt(FAM.length - 1);
  document.getElementById('n-iso').textContent = fmt(FAM[ISO][3]);
  document.getElementById('n-ame').textContent = pct(ame, vivas);
  document.getElementById('n-ext').textContent = fmt(ext);
  const g = FAM.slice(0, 5).reduce((s, f) => s + f[3], 0);
  document.getElementById('n-top5').textContent = pct(g, LING.length);
})();

/* ---------- treemap ---------- */
function squarify(itens, x, y, w, h) {
  const total = itens.reduce((s, d) => s + d.v, 0), out = [];
  const esc = w * h / total; let resto = itens.map(d => ({ ...d, a: d.v * esc }));
  const pior = (linha, lado) => { const s = linha.reduce((t, d) => t + d.a, 0), mx = Math.max(...linha.map(d => d.a)), mn = Math.min(...linha.map(d => d.a));
    return Math.max(lado * lado * mx / (s * s), (s * s) / (lado * lado * mn)); };
  while (resto.length) {
    const lado = Math.min(w, h); let linha = [resto[0]], i = 1;
    while (i < resto.length && pior(linha.concat(resto[i]), lado) <= pior(linha, lado)) { linha.push(resto[i]); i++; }
    resto = resto.slice(i);
    const s = linha.reduce((t, d) => t + d.a, 0);
    if (w >= h) { const lw = s / h; let yy = y; linha.forEach(d => { const hh = d.a / lw; out.push({ ...d, x, y: yy, w: lw, h: hh }); yy += hh; }); x += lw; w -= lw; }
    else { const lh = s / w; let xx = x; linha.forEach(d => { const ww = d.a / lh; out.push({ ...d, x: xx, y, w: ww, h: lh }); xx += ww; }); y += lh; h -= lh; }
  }
  return out;
}
const TOPO = 40;
function desenhaTreemap() {
  const svg = document.getElementById('g-tree'); svg.innerHTML = '';
  const W = svg.parentNode.clientWidth || 900, H = W < 600 ? 520 : 460;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const cores = K();
  const itens = FAM.slice(0, TOPO).map((f, i) => ({ v: f[3], i, nome: f[0], area: f[4] }));
  const outras = FAM.slice(TOPO, ISO);
  itens.push({ v: outras.reduce((s, f) => s + f[3], 0), i: -1, nome: `Outras ${outras.length} famílias`, area: -1 });
  itens.push({ v: FAM[ISO][3], i: ISO, nome: 'Línguas isoladas', area: -2 });
  itens.sort((a, b) => b.v - a.v);
  squarify(itens, 0, 0, W, H).forEach(r => {
    const g = el('g', { class: 'tm' + (r.i === famSel ? ' sel' : '') + (r.i >= 0 ? ' clicavel' : '') }, svg);
    const cor = r.area >= 0 ? `var(--k${r.area + 1})` : 'var(--k0)';
    el('rect', { x: r.x + 1, y: r.y + 1, width: Math.max(0, r.w - 2), height: Math.max(0, r.h - 2), rx: 4, style: `fill:color-mix(in srgb, ${cor} 55%, var(--paper))` }, g);
    if (r.w > 46 && r.h > 20) {
      const t = el('text', { x: r.x + 6, y: r.y + 16, class: 'tm-rot' }, g); t.textContent = cabe(r.nome, r.w - 10, 7.2);
      if (r.h > 36) { const t2 = el('text', { x: r.x + 6, y: r.y + 31, class: 'tm-num' }, g); t2.textContent = fmt(r.v); }
    }
    const info = r.i === -1 ? `${outras.length} famílias com até ${outras[0][3]} línguas cada` : r.i === ISO ? 'Cada uma é uma família de uma língua só' : D.areas[r.area];
    g.addEventListener('mousemove', ev => mostra(ev, `<b>${r.nome}</b><br>${fmt(r.v)} línguas<br>${info}`));
    g.addEventListener('mouseleave', esconde);
    if (r.i >= 0) { g.setAttribute('tabindex', 0); g.setAttribute('role', 'button'); g.setAttribute('aria-label', `${r.nome}, ${r.v} línguas`);
      const ir = () => { escolheFam(r.i); document.getElementById('familia').scrollIntoView({ behavior: 'smooth' }); };
      g.addEventListener('click', ir); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); } }); }
  });
  const leg = document.getElementById('leg-tree'); leg.innerHTML = '';
  D.areas.forEach((a, i) => leg.insertAdjacentHTML('beforeend', `<span><b style="background:${cores[i]}"></b>${a}</span>`));
  leg.insertAdjacentHTML('beforeend', `<span><b style="background:${css('--k0')}"></b>famílias menores e isoladas</span>`);
}
function cabe(txt, larg, px) { const max = Math.floor(larg / px); return txt.length <= max ? txt : txt.slice(0, Math.max(1, max - 1)) + '…'; }

/* ---------- ramos (filhos do nó em foco) ---------- */
function calculaRamos() {
  ramoDe = new Map(); ramoNo = new Map(); abertos = new Set();
  // Se um grupo concentra mais de 60% das línguas (como o "Classical Indo-European"), abre esse grupo para mostrar ramos úteis.
  let filhos = raiz.filhos.slice();
  for (let k = 0; k < 4; k++) { const g = filhos[0]; if (!g || g.ling >= 0 || g.n <= .6 * raiz.n || !g.filhos.length) break;
    abertos.add(g); filhos = g.filhos.concat(filhos.slice(1)).sort((a, b) => b.n - a.n); }
  ramos = filhos.slice(0, 7).map(f => ({ nome: f.nome, n: f.n, no: f }));
  const resto = filhos.slice(7);
  if (resto.length) ramos.push({ nome: resto.length === 1 ? resto[0].nome : `outros ${resto.length} grupos`, n: resto.reduce((s, f) => s + f.n, 0), no: null });
  const marca = (n, r) => { if (n.ling >= 0) ramoDe.set(n.ling, r); n.filhos.forEach(f => marca(f, r)); };
  filhos.forEach((f, i) => { marca(f, Math.min(i, 7)); ramoNo.set(f, Math.min(i, 7)); });
  if (raiz === raizIso) { ramoDe = new Map(); raizIso.filhos.forEach(f => ramoDe.set(f.ling, 0)); ramos = [{ nome: 'línguas isoladas', n: raizIso.n, no: null }]; }
}
const corRamo = r => r === 7 ? css('--k0') : K()[r];

/* ---------- mapa ---------- */
// Projeção equirretangular centrada no Pacífico, cortada no Atlântico (-25°) para não partir a Oceania nem a África.
const LON0 = -25, LAT_MAX = 76, LAT_MIN = -56;
const lonX = (lon, W) => ((lon < LON0 ? lon + 360 : lon) - LON0) / 360 * W;
const latY = (lat, H) => (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * H;
function prepCanvas(cv) {
  const W = cv.parentNode.clientWidth, H = Math.round(W * (LAT_MAX - LAT_MIN) / 360), r = devicePixelRatio || 1;
  cv.width = W * r; cv.height = H * r; cv.style.height = H + 'px';
  const c = cv.getContext('2d'); c.setTransform(r, 0, 0, r, 0, 0); c.clearRect(0, 0, W, H);
  c.strokeStyle = css('--line'); c.lineWidth = 1;
  for (let la = -40; la <= 60; la += 20) { const y = latY(la, H); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.setLineDash([3, 4]); const ye = latY(0, H); c.beginPath(); c.moveTo(0, ye); c.lineTo(W, ye); c.stroke(); c.setLineDash([]);
  return { c, W, H };
}
function anel(c, x, y, rotulo) {
  c.strokeStyle = css('--ink'); c.lineWidth = 2; c.beginPath(); c.arc(x, y, 8, 0, 7); c.stroke();
  if (rotulo) { c.font = '600 13px Lexend, sans-serif'; c.fillStyle = css('--ink'); const tw = c.measureText(rotulo).width;
    c.fillText(rotulo, x + 12 + tw > c.canvas.clientWidth ? x - 12 - tw : x + 12, y + 4); }
}
let pontosMapa = [];
function desenhaMapa() {
  const cv = document.getElementById('g-mapa'); const { c, W, H } = prepCanvas(cv);
  const cinza = css('--line'); pontosMapa = [];
  c.fillStyle = cinza;
  LING.forEach((l, i) => { if (l[4] == null || ramoDe.has(i)) return; c.fillRect(lonX(l[5] / 10, W) - 1, latY(l[4] / 10, H) - 1, 2, 2); });
  const cores = K(), k0 = css('--k0'), fundo = css('--paper');
  const lista = [...ramoDe.entries()].filter(([i]) => LING[i][4] != null).sort((a, b) => b[1] - a[1]);
  c.lineWidth = 1; c.strokeStyle = fundo;
  lista.forEach(([i, r]) => { const l = LING[i], x = lonX(l[5] / 10, W), y = latY(l[4] / 10, H);
    c.fillStyle = r === 7 ? k0 : cores[r]; c.beginPath(); c.arc(x, y, 3.6, 0, 7); c.fill(); c.stroke(); pontosMapa.push([x, y, i]); });
  if (lingSel >= 0 && LING[lingSel][4] != null) anel(c, lonX(LING[lingSel][5] / 10, W), latY(LING[lingSel][4] / 10, H), LING[lingSel][0]);
  const leg = document.getElementById('leg-mapa'); leg.innerHTML = '';
  ramos.forEach((r, i) => { const s = document.createElement('span'); s.innerHTML = `<b style="background:${corRamo(raiz === raizIso ? 0 : i)}"></b>${r.nome} <span class="muted">${fmt(r.n)}</span>`;
    if (r.no && r.no.ling < 0) { s.classList.add('leg-btn'); s.tabIndex = 0; s.setAttribute('role', 'button'); s.title = 'Abrir este grupo';
      const ir = () => foco(r.no); s.onclick = ir; s.onkeydown = e => { if (e.key === 'Enter') ir(); }; }
    leg.appendChild(s); });
}
function maisPerto(pts, ev, cv) { const b = cv.getBoundingClientRect(), x = ev.clientX - b.left, y = ev.clientY - b.top; let m = null, md = 81;
  for (const p of pts) { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < md) { md = d; m = p; } } return m; }
const situacao = l => l[6] ? D.aes[l[6]] : 'sem informação';
function caminho(i) { const out = []; let n = folhas[i]; while ((n = paiDe(n))) out.unshift(n.nome); return out; }
const cvMapa = document.getElementById('g-mapa');
cvMapa.addEventListener('mousemove', ev => { const p = maisPerto(pontosMapa, ev, cvMapa); if (!p) { esconde(); cvMapa.style.cursor = ''; return; }
  const l = LING[p[2]]; cvMapa.style.cursor = 'pointer';
  mostra(ev, `<b>${l[0]}</b><br>${caminho(p[2]).slice(-3).join(' › ')}<br>${situacao(l)}`); });
cvMapa.addEventListener('mouseleave', esconde);
cvMapa.addEventListener('click', ev => { const p = maisPerto(pontosMapa, ev, cvMapa); if (p) escolheLingua(p[2], false); });

/* ---------- ficha da família ---------- */
function desenhaFicha() {
  const f = FAM[famSel], idx = LING.map((l, i) => i).filter(i => LING[i][3] === famSel);
  document.getElementById('f-nome').textContent = f[0];
  document.getElementById('f-orig').textContent = famSel === ISO ? 'Línguas sem parentesco comprovado com nenhuma outra' : `${f[2]} no Glottolog`;
  document.getElementById('f-n').textContent = fmt(f[3]);
  const areas = {}; idx.forEach(i => { const a = LING[i][7]; areas[a] = (areas[a] || 0) + 1; });
  document.getElementById('f-areas').textContent = Object.entries(areas).sort((a, b) => b[1] - a[1]).filter(([a]) => D.areas[a]).map(([a]) => D.areas[a]).join(', ');
  const vivas = idx.filter(i => LING[i][6] !== 6), ame = vivas.filter(i => LING[i][6] >= 2);
  document.getElementById('f-ame').textContent = pct(ame.length, vivas.length);
  document.getElementById('f-ext').textContent = fmt(idx.length - vivas.length);
  document.getElementById('f-br').textContent = fmt(idx.filter(i => LING[i][8]).length);
  // barra de situação
  const bar = document.getElementById('f-sit'); bar.innerHTML = '';
  const cont = [0, 0, 0, 0, 0, 0, 0]; idx.forEach(i => cont[LING[i][6]]++);
  const W = 1000, svg = el('svg', { viewBox: `0 0 ${W} 26`, class: 'grafico', role: 'img', 'aria-label': 'Situação das línguas da família' }, bar);
  let x = 0; [1, 2, 3, 4, 5, 6, 0].forEach(s => { if (!cont[s]) return; const w = cont[s] / idx.length * W;
    const r = el('rect', { x: x + 1, y: 0, width: Math.max(1, w - 2), height: 26, rx: 4, fill: `var(--s${s})` }, svg); x += w;
    r.addEventListener('mousemove', ev => mostra(ev, `<b>${s ? D.aes[s] : 'sem informação'}</b><br>${fmt(cont[s])} línguas (${pct(cont[s], idx.length)})`)); r.addEventListener('mouseleave', esconde); });
  document.querySelectorAll('#chips-fam .chip').forEach(b => b.setAttribute('aria-pressed', +b.dataset.f === famSel));
}

/* ---------- árvore (icicle) ---------- */
function desenhaArvore() {
  const svg = document.getElementById('g-arv'); svg.innerHTML = '';
  const W = svg.parentNode.clientWidth || 900, COLS = W < 600 ? 3 : 5, H = Math.max(420, Math.min(720, 160 + raiz.n * 3));
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const cw = W / COLS, cores = K(), k0 = css('--k0');
  // trilha
  const tr = document.getElementById('trilha'); tr.innerHTML = '';
  const cadeia = []; let n = raiz; while (n) { cadeia.unshift(n); n = paiDe(n); }
  cadeia.forEach((c, i) => { if (i) tr.insertAdjacentHTML('beforeend', '<span class="sep">›</span>');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = c.nome; b.setAttribute('aria-pressed', c === raiz); b.onclick = () => foco(c); tr.appendChild(b); });
  // grupos abertos automaticamente (que só repassam os ramos) viram uma coluna estreita
  const ESTREITA = 26;
  const pinta = (no, x, y0, h, ramo, prof) => {
    if (h < .3 || x > W - cw * .5) return;
    const larg = prof > 0 && abertos.has(no) ? ESTREITA : Math.min(cw, W - x);
    if (ramoNo.has(no)) ramo = ramoNo.get(no);
    if (raiz === raizIso && prof) ramo = 0;
    const ehRaiz = prof === 0, neutro = ramo < 0, cor = neutro ? css('--pill-2') : (ramo === 7 ? k0 : cores[ramo]);
    const g = el('g', { class: 'ic' + (no.ling >= 0 ? ' folha' : '') + (no.ling === lingSel && lingSel >= 0 ? ' sel' : '') }, svg);
    el('rect', { x: x + 1, y: y0 + .5, width: larg - 2, height: Math.max(.6, h - 1), rx: h > 6 ? 4 : 0, fill: cor, 'fill-opacity': neutro ? 1 : (no.ling >= 0 ? .35 : .7) }, g);
    if (h >= 15 && larg > ESTREITA) { const t = el('text', { x: x + 8, y: y0 + Math.min(h / 2, 14) + 5, class: 'ic-rot' }, g);
      const num = no.ling < 0 ? ` ${fmt(no.n)}` : ''; t.textContent = cabe(no.nome, larg - 16 - num.length * 7, 7) + num; }
    g.addEventListener('mousemove', ev => mostra(ev, no.ling >= 0 ? `<b>${no.nome}</b><br>língua · ${situacao(LING[no.ling])}` : `<b>${no.nome}</b><br>${fmt(no.n)} línguas · ${no.filhos.length} ramos diretos`));
    g.addEventListener('mouseleave', esconde);
    if (no.ling < 0) g.addEventListener('click', () => foco(ehRaiz ? (paiDe(no) || no) : no));
    else g.addEventListener('click', () => escolheLingua(no.ling, false));
    let y = y0; no.filhos.forEach((f, i) => { const hf = f.n / no.n * h; pinta(f, x + larg, y, hf, ramo, prof + 1); y += hf; });
  };
  pinta(raiz, 0, 0, H, -1, 0);
  document.getElementById('arv-nota').textContent = raiz === raizIso
    ? `${fmt(raiz.n)} línguas isoladas. Cada uma é, sozinha, uma família.`
    : `${raiz.nome}: ${fmt(raiz.n)} línguas em ${raiz.filhos.length} ramos diretos. Mostrando alguns níveis por vez; as colunas estreitas são grupos intermediários. Clique num grupo para entrar nele e na primeira coluna para voltar.`;
}

/* ---------- ações ---------- */
function foco(no) { raiz = no; esconde(); calculaRamos(); desenhaArvore(); desenhaMapa(); }
function escolheFam(i) { famSel = i; lingSel = -1; raiz = raizFam[i]; esconde(); calculaRamos(); desenhaTreemap(); desenhaFicha(); desenhaArvore(); desenhaMapa(); }
function escolheLingua(i, rolar) {
  const f = LING[i][3]; lingSel = i;
  if (f !== famSel) { famSel = f; desenhaTreemap(); desenhaFicha(); }
  raiz = paiDe(folhas[i]) || raizFam[f];
  // sobe um nível quando o grupo é pequeno, para dar contexto
  if (raiz.n < 6 && paiDe(raiz)) raiz = paiDe(raiz);
  esconde(); calculaRamos(); desenhaArvore(); desenhaMapa();
  const l = LING[i];
  document.getElementById('busca-res').innerHTML = `<b>${l[0]}</b>: ${[FAM[f][0]].concat(caminho(i).slice(1)).join(' › ')} · ${situacao(l)}`;
  if (rolar) document.getElementById('familia').scrollIntoView({ behavior: 'smooth' });
}

// atalhos de famílias
const ATALHOS = ['indo1319', 'tupi1275', 'nucl1710', 'araw1281', 'cari1283', 'atla1278', 'aust1307', 'sino1245', 'afro1255', 'ural1272', 'ISO'];
const chips = document.getElementById('chips-fam');
ATALHOS.forEach(id => { const i = FAM.findIndex(f => f[1] === id); if (i < 0) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.f = i; b.textContent = FAM[i][0]; b.onclick = () => escolheFam(i); chips.appendChild(b); });
document.getElementById('btn-pt').onclick = () => escolheLingua(PT, false);

// busca
const busca = document.getElementById('busca'), lista = document.getElementById('busca-lista');
const indice = LING.map((l, i) => [sem(l[0]), i]);
busca.addEventListener('input', () => {
  const q = sem(busca.value.trim()); lista.innerHTML = ''; if (q.length < 2) return;
  const ach = indice.filter(([n]) => n.includes(q)).sort((a, b) => (a[0].startsWith(q) ? 0 : 1) - (b[0].startsWith(q) ? 0 : 1) || a[0].length - b[0].length).slice(0, 8);
  if (!ach.length) { lista.innerHTML = '<li class="muted">Nenhuma língua com esse nome. Tente o nome em inglês, como está no Glottolog.</li>'; return; }
  ach.forEach(([, i]) => { const li = document.createElement('li'); const b = document.createElement('button'); b.type = 'button';
    b.innerHTML = `${LING[i][0]} <span class="muted">${FAM[LING[i][3]][0]}</span>`; b.onclick = () => { lista.innerHTML = ''; busca.value = LING[i][0]; escolheLingua(i, false); };
    li.appendChild(b); lista.appendChild(li); });
});

/* ---------- Brasil ---------- */
function desenhaBrasil() {
  const svg = document.getElementById('g-br'); svg.innerHTML = '';
  const cont = {}; LING.forEach(l => { if (l[8]) cont[l[3]] = (cont[l[3]] || 0) + 1; });
  const rows = Object.entries(cont).map(([f, n]) => [+f, n]).sort((a, b) => b[1] - a[1]);
  const tot = rows.reduce((s, r) => s + r[1], 0);
  document.getElementById('n-br').textContent = fmt(tot);
  document.getElementById('n-br-fam').textContent = fmt(rows.filter(r => r[0] !== ISO).length);
  document.getElementById('n-br-iso').textContent = fmt(cont[ISO] || 0);
  const W = svg.parentNode.clientWidth || 800, LAB = W < 600 ? 130 : 190, RH = 24, H = rows.length * RH + 6;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const max = rows[0][1], esc = (W - LAB - 50) / max, cor = css('--accent');
  rows.forEach(([f, n], i) => {
    const y = i * RH + 3, g = el('g', { class: 'clicavel', tabindex: 0, role: 'button', 'aria-label': `${FAM[f][0]}: ${n} línguas` }, svg);
    el('rect', { x: 0, y, width: W, height: RH, fill: 'transparent' }, g);
    const t = el('text', { x: LAB - 8, y: y + 16, 'text-anchor': 'end', class: 'eixo-txt' }, g); t.textContent = cabe(FAM[f][0], LAB - 10, 7);
    el('rect', { x: LAB, y: y + 4, width: Math.max(2, n * esc), height: RH - 8, rx: 4, fill: cor }, g);
    const v = el('text', { x: LAB + n * esc + 6, y: y + 16, class: 'eixo-txt' }, g); v.textContent = n;
    const nomes = LING.filter(l => l[8] && l[3] === f).map(l => l[0]);
    g.addEventListener('mousemove', ev => mostra(ev, `<b>${FAM[f][0]}</b><br>${n} línguas no Brasil<br><span style="opacity:.8">${nomes.slice(0, 8).join(', ')}${nomes.length > 8 ? '…' : ''}</span>`));
    g.addEventListener('mouseleave', esconde);
    const ir = () => { escolheFam(f); document.getElementById('familia').scrollIntoView({ behavior: 'smooth' }); };
    g.addEventListener('click', ir); g.addEventListener('keydown', e => { if (e.key === 'Enter') ir(); });
  });
}

/* ---------- estruturas (WALS) ---------- */
let traco = 0, famTraco = -1, pontosT = [];
const tchips = document.getElementById('chips-traco');
D.tracos.forEach((t, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = t.nome;
  b.onclick = () => { traco = i; famTraco = -1; desenhaTraco(); }; tchips.appendChild(b); });
function coresTraco(t) {
  // as 7 respostas mais comuns ganham cor própria, o resto vira "outros" (cinza); cor fixa por resposta
  const cont = t.valores.map(() => 0); t.pts.forEach(p => cont[p[4]]++);
  const ordem = cont.map((n, v) => [n, v]).filter(x => x[0]).sort((a, b) => b[0] - a[0]);
  const cor = {}; ordem.forEach(([, v], i) => { cor[v] = i < 7 ? i : 7; });
  return { cont, ordem, cor };
}
function desenhaTraco() {
  const t = D.tracos[traco], { cont, ordem, cor } = coresTraco(t), cores = K(), k0 = css('--k0');
  const cc = v => cor[v] === 7 ? k0 : cores[cor[v]];
  [...tchips.children].forEach((b, i) => b.setAttribute('aria-pressed', i === traco));
  document.getElementById('t-desc').textContent = t.desc;
  document.getElementById('t-n').textContent = `${fmt(t.pts.length)} línguas na amostra do WALS para este traço.` + (t.por == null ? ' O português não está nesta amostra.' : ` O português: ${t.valores[t.por]}.`);
  // mapa
  const cv = document.getElementById('g-traco'); const { c, W, H } = prepCanvas(cv); pontosT = [];
  c.strokeStyle = css('--paper'); c.lineWidth = 1;
  const pts = t.pts.slice().sort((a, b) => (cor[b[4]] - cor[a[4]]));
  pts.forEach(p => { const x = lonX(p[2] / 10, W), y = latY(p[1] / 10, H), apaga = famTraco >= 0 && p[3] !== famTraco;
    c.globalAlpha = apaga ? .15 : 1; c.fillStyle = cc(p[4]); c.beginPath(); c.arc(x, y, 3.8, 0, 7); c.fill(); c.stroke(); if (!apaga) pontosT.push([x, y, p]); });
  c.globalAlpha = 1;
  const por = t.pts.find(p => p[0] === 'Portuguese'); if (por) anel(c, lonX(por[2] / 10, W), latY(por[1] / 10, H), 'português');
  const leg = document.getElementById('leg-traco'); leg.innerHTML = '';
  ordem.forEach(([n, v]) => { if (cor[v] === 7) return; leg.insertAdjacentHTML('beforeend', `<span><b style="background:${cc(v)}"></b>${t.valores[v]} <span class="muted">${fmt(n)}</span></span>`); });
  const out = ordem.filter(([, v]) => cor[v] === 7); if (out.length) leg.insertAdjacentHTML('beforeend', `<span><b style="background:${k0}"></b>outros: ${out.map(([, v]) => t.valores[v]).join(', ')} <span class="muted">${fmt(out.reduce((s, o) => s + o[0], 0))}</span></span>`);
  // barras por família
  const svg = document.getElementById('g-traco-fam'); svg.innerHTML = '';
  const porFam = {}; t.pts.forEach(p => { if (p[3] < 0) return; (porFam[p[3]] = porFam[p[3]] || []).push(p[4]); });
  const linhas = [[-1, t.pts.map(p => p[4])]].concat(Object.entries(porFam).map(([f, vs]) => [+f, vs]).filter(([f, vs]) => vs.length >= 12 && f !== ISO).sort((a, b) => b[1].length - a[1].length).slice(0, 12));
  const Wb = svg.parentNode.clientWidth || 800, LAB = Wb < 600 ? 150 : 190, RH = 30, Hb = linhas.length * RH + 4;
  svg.setAttribute('viewBox', `0 0 ${Wb} ${Hb}`);
  const larg = Wb - LAB - 10;
  linhas.forEach(([f, vs], i) => {
    const y = i * RH + 2, g = el('g', { class: f >= 0 ? 'clicavel' + (f === famTraco ? ' sel' : '') : '' }, svg);
    const tx = el('text', { x: LAB - 8, y: y + 18, 'text-anchor': 'end', class: 'eixo-txt' + (f < 0 ? ' forte' : '') }, g);
    tx.textContent = f < 0 ? `Todas (${vs.length})` : cabe(FAM[f][0], LAB - 50, 7) + ` (${vs.length})`;
    const cnt = {}; vs.forEach(v => cnt[v] = (cnt[v] || 0) + 1);
    let x = LAB; ordem.forEach(([, v]) => { if (!cnt[v]) return; const w = cnt[v] / vs.length * larg;
      const r = el('rect', { x: x + 1, y: y + 4, width: Math.max(1, w - 2), height: RH - 8, rx: 4, fill: cc(v) }, g); x += w;
      r.addEventListener('mousemove', ev => mostra(ev, `<b>${f < 0 ? 'Todas as línguas da amostra' : FAM[f][0]}</b><br>${t.valores[v]}: ${cnt[v]} de ${vs.length} (${pct(cnt[v], vs.length)})`));
      r.addEventListener('mouseleave', esconde); });
    if (f >= 0) g.addEventListener('click', () => { famTraco = famTraco === f ? -1 : f; esconde(); desenhaTraco(); });
  });
  document.getElementById('t-filtro').textContent = famTraco >= 0 ? `No mapa: só ${FAM[famTraco][0]}. Clique de novo na família para ver todas.` : 'Clique numa família para ver só as línguas dela no mapa.';
}
const cvT = document.getElementById('g-traco');
cvT.addEventListener('mousemove', ev => { const p = maisPerto(pontosT, ev, cvT); if (!p) return esconde(); const t = D.tracos[traco], d = p[2];
  mostra(ev, `<b>${d[0]}</b><br>${d[3] >= 0 ? FAM[d[3]][0] : 'sem família no Glottolog'}<br>${t.valores[d[4]]}`); });
cvT.addEventListener('mouseleave', esconde);

/* ---------- inicia e redesenha ---------- */
function tudo() { calculaRamos(); desenhaTreemap(); desenhaFicha(); desenhaArvore(); desenhaMapa(); desenhaBrasil(); desenhaTraco(); }
// Link direto: #indo1319 abre a família; #port1283 abre a língua (glottocodes do Glottolog). #isoladas abre as isoladas.
function doHash() {
  const h = decodeURIComponent(location.hash.slice(1)).toLowerCase(); if (!h) return false;
  const f = h === 'isoladas' ? ISO : FAM.findIndex(x => x[1] === h);
  if (f >= 0) { escolheFam(f); return true; }
  const l = LING.findIndex(x => x[1] === h);
  if (l >= 0) { escolheLingua(l, false); return true; }
  const n = nos.find(x => x.id === h);
  if (n) { let r = n; while (paiDe(r)) r = paiDe(r); escolheFam(raizFam.indexOf(r)); foco(n); return true; }
  return false;
}
tudo();
if (doHash()) document.getElementById('familia').scrollIntoView();
addEventListener('hashchange', () => { if (doHash()) document.getElementById('familia').scrollIntoView({ behavior: 'smooth' }); });
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(tudo, 150); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', tudo);
document.getElementById('theme-btn').addEventListener('click', () => {
  const root = document.documentElement;
  const escuro = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = escuro ? 'light' : 'dark';
  try { localStorage.setItem('iapraprof:theme', JSON.stringify(root.dataset.theme)); } catch (e) {}
  tudo();
});
})();
