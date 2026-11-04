/* Tecnologia nas escolas em dados. Dados: microdados do Censo Escolar (INEP), agregados por _fonte/tecnologia-escolas/gerar.py. */
(function () {
const T = window.TEC_ESCOLAS, M = window.TEC_MAPAS;
const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
const txt = (p, x, y, s, a = {}) => { const t = el('text', Object.assign({x, y}, a), p); t.textContent = s; return t; };
const nf = (v, d = 0) => v.toLocaleString('pt-BR', {minimumFractionDigits: d, maximumFractionDigits: d});
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
function limpa(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }

const IND = [
  {i: 2, id: 'internet', nome: 'Internet', longo: 'escolas com internet', pct: true,
   nota: 'Escola que declara ter acesso à internet, para qualquer uso (inclusive só na secretaria).'},
  {i: 4, id: 'internet-alunos', nome: 'Internet para os alunos', longo: 'escolas com internet para uso dos alunos', pct: true,
   nota: 'Escola em que a internet está disponível para os alunos usarem. É a medida mais próxima da sala de aula.'},
  {i: 3, id: 'banda-larga', nome: 'Banda larga', longo: 'escolas com banda larga', pct: true,
   nota: 'Escola que declara ter internet banda larga.'},
  {i: 5, id: 'laboratorio', nome: 'Laboratório de informática', longo: 'escolas com laboratório de informática', pct: true,
   nota: 'Escola que declara ter laboratório de informática. Muitas redes trocaram o laboratório por carrinhos de notebooks ou tablets, então veja também o próximo indicador.'},
  {i: 6, id: 'computador', nome: 'Computador ou tablet para alunos', longo: 'escolas com computador ou tablet para alunos', pct: true,
   nota: 'Escola com pelo menos um computador de mesa, portátil ou tablet para uso dos alunos.'},
  {i: 7, id: 'alunos-por-computador', nome: 'Alunos por computador', longo: 'alunos por computador', pct: false, menor: true,
   nota: 'Matrículas da educação básica divididas pelos computadores e tablets para alunos. Quanto menor, melhor.'},
];
const REC = [
  ['pub', 'Públicas'], ['tot', 'Todas'], ['mun', 'Municipais'], ['est', 'Estaduais'], ['priv', 'Privadas'],
  ['pubrur', 'Públicas rurais'], ['pubura', 'Públicas urbanas'],
];
const NOME_REC = Object.fromEntries(REC);
const ANOS = T.anos;
const MUNS = Object.keys(T.mun);
const COD_POR_NOME = {};
MUNS.forEach(c => { COD_POR_NOME[T.mun[c].toLowerCase()] = c; });

// estado da página (também no endereço, para compartilhar)
const S = {ind: 1, rec: 'pub', ano: ANOS.length - 1, uf: 'RS', mun: COD_POR_NOME['candelária'] || MUNS[0]};
(function lerHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  const ii = IND.findIndex(x => x.id === h.get('indicador')); if (ii >= 0) S.ind = ii;
  if (NOME_REC[h.get('escolas')]) S.rec = h.get('escolas');
  const ai = ANOS.indexOf(+h.get('ano')); if (ai >= 0) S.ano = ai;
  if (T.uf[h.get('estado')]) S.uf = h.get('estado');
  if (T.mun[h.get('municipio')]) S.mun = h.get('municipio');
})();
function gravarHash() {
  const h = new URLSearchParams({indicador: IND[S.ind].id, escolas: S.rec, ano: ANOS[S.ano], estado: S.uf, municipio: S.mun});
  history.replaceState(null, '', '#' + h.toString());
}

const linha = (u, rec = S.rec, ano = S.ano) => { const s = (T.dados[u] || {})[rec]; return s ? s[ano] : null; };
const valor = (u, rec, ano, ind = IND[S.ind]) => { const l = linha(u, rec, ano); return l ? l[ind.i] : null; };
const fmt = (v, ind = IND[S.ind]) => v == null ? 'sem dado' : ind.pct ? nf(v, v === 100 || v === 0 ? 0 : 1) + '%' : nf(v, 1);
const melhor = (a, b, ind = IND[S.ind]) => ind.menor ? a < b : a > b;

// dica flutuante
const tip = document.createElement('div'); tip.id = 'tip-g'; tip.setAttribute('role', 'presentation'); document.body.appendChild(tip);
function dica(alvo, texto) {
  alvo.addEventListener('pointermove', e => { tip.innerHTML = typeof texto === 'function' ? texto() : texto; tip.style.opacity = 1;
    const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8); tip.style.left = x + 'px'; tip.style.top = (e.clientY + 14) + 'px'; });
  alvo.addEventListener('pointerleave', () => { tip.style.opacity = 0; });
}

// escala de cor em 5 faixas iguais entre o menor e o maior valor do mapa
const CORES = ['var(--q1)', 'var(--q2)', 'var(--q3)', 'var(--q4)', 'var(--q5)'];
function escala(vals) {
  const v = vals.filter(x => x != null);
  if (!v.length) return {cor: () => 'var(--q-vazio)', faixas: []};
  let lo = Math.min(...v), hi = Math.max(...v);
  if (IND[S.ind].pct) { lo = Math.floor(lo / 5) * 5; hi = Math.ceil(hi / 5) * 5; } else { lo = Math.floor(lo); hi = Math.ceil(hi); }
  if (hi === lo) hi = lo + 1;
  const passo = (hi - lo) / 5;
  const faixa = x => Math.min(4, Math.floor((x - lo) / passo));
  const menor = IND[S.ind].menor;
  return {
    cor: x => x == null ? 'var(--q-vazio)' : CORES[menor ? 4 - faixa(x) : faixa(x)],
    faixas: CORES.map((c, k) => [menor ? CORES[4 - k] : c, lo + passo * k, lo + passo * (k + 1)]),
  };
}
function legenda(div, esc) {
  const ind = IND[S.ind], d = ind.pct ? 0 : 1;
  div.innerHTML = esc.faixas.map(([c, a, b]) => `<span><b style="background:${c}"></b>${nf(a, d)} a ${nf(b, d)}${ind.pct ? '%' : ''}</span>`).join('') +
    '<span><b style="background:var(--q-vazio)"></b>sem dado</span>';
}

// ---------- seletores
function chips(div, itens, ativo, aoEscolher) {
  div.innerHTML = '';
  itens.forEach(([v, rot]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = rot;
    b.setAttribute('aria-pressed', String(v === ativo));
    b.addEventListener('click', () => aoEscolher(v));
    div.appendChild(b);
  });
}
function seletores() {
  chips($('sel-ind'), IND.map((x, k) => [k, x.nome]), S.ind, v => { S.ind = v; tudo(); });
  chips($('sel-rec'), REC, S.rec, v => { S.rec = v; tudo(); });
  chips($('sel-ano'), ANOS.map((a, k) => [k, String(a)]), S.ano, v => { S.ano = v; tudo(); });
  $('nota-ind').textContent = IND[S.ind].nota;
}

// ---------- resumo
function resumo() {
  const ind = IND[S.ind], ano = ANOS[S.ano];
  const ufs = Object.keys(T.uf).map(u => [u, valor(u, S.rec, S.ano)]).filter(x => x[1] != null);
  ufs.sort((a, b) => ind.menor ? a[1] - b[1] : b[1] - a[1]);
  const lBR = linha('BR');
  const caixas = [
    [fmt(valor('BR', S.rec, S.ano)), `${ind.longo}, Brasil, ${NOME_REC[S.rec].toLowerCase()}, ${ano}`],
    [fmt(valor('RS', S.rec, S.ano)), `no Rio Grande do Sul`],
    ufs.length ? [fmt(ufs[0][1]), `melhor estado: ${T.uf[ufs[0][0]]}`] : null,
    ufs.length ? [fmt(ufs[ufs.length - 1][1]), `estado mais atrás: ${T.uf[ufs[ufs.length - 1][0]]}`] : null,
    lBR ? [nf(lBR[0]), `escolas em atividade no recorte, Brasil`] : null,
  ].filter(Boolean);
  $('resumo-br').innerHTML = caixas.map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join('');
}

// ---------- mapas
function mapa(svg, geo, unidades, nomeDe, ativo, aoEscolher, legDiv) {
  limpa(svg); svg.setAttribute('viewBox', `0 0 ${geo.w} ${geo.h}`);
  const vals = unidades.map(u => valor(u, S.rec, S.ano));
  const e = escala(vals);
  legenda(legDiv, e);
  unidades.forEach((u, k) => {
    const g = geo.f[u]; if (!g) return;
    const p = el('path', {d: g[1], fill: e.cor(vals[k]), class: u === ativo ? 'ativo' : ''}, svg);
    p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button');
    p.setAttribute('aria-label', `${nomeDe(u)}: ${fmt(vals[k])}`);
    dica(p, () => { const l = linha(u); return `<b>${esc(nomeDe(u))}</b><br>${esc(IND[S.ind].nome)}: ${fmt(vals[k])}<br>${l ? nf(l[0]) : 0} escolas no recorte`; });
    p.addEventListener('click', () => aoEscolher(u));
    p.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); aoEscolher(u); } });
  });
  const at = svg.querySelector('.ativo'); if (at) svg.appendChild(at);
}

function barras(svg, itens, destaque, aoEscolher, alturaLinha = 20) {
  // itens: [codigo, nome, valor]
  limpa(svg);
  const ind = IND[S.ind], W = 600, E = 150, D = 60, H = itens.length * alturaLinha + 10;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const max = Math.max(...itens.map(x => x[2] || 0), ind.pct ? 100 : 1);
  const x = v => E + (W - E - D) * v / max;
  const media = valor('BR', S.rec, S.ano);
  itens.forEach(([u, nome, v], k) => {
    const y = 5 + k * alturaLinha;
    const g = el('g', {style: aoEscolher ? 'cursor:pointer' : ''}, svg);
    txt(g, E - 8, y + alturaLinha * .68, nome, {'text-anchor': 'end', 'font-size': 13, 'font-weight': u === destaque ? 700 : 400});
    el('rect', {x: E, y: y + 3, width: Math.max(0, x(v || 0) - E), height: alturaLinha - 6, rx: 3,
      fill: u === destaque ? 'var(--l-mun)' : 'var(--q4)'}, g);
    txt(g, x(v || 0) + 6, y + alturaLinha * .68, fmt(v), {'font-size': 12, class: 'eixo'});
    if (aoEscolher) g.addEventListener('click', () => aoEscolher(u));
    const l = linha(u);
    dica(g, `<b>${esc(nome)}</b><br>${fmt(v)} · ${l ? nf(l[0]) : 0} escolas`);
  });
  if (media != null) {
    el('line', {x1: x(media), x2: x(media), y1: 0, y2: H, stroke: 'var(--ink)', 'stroke-dasharray': '4 4', 'stroke-width': 1.5}, svg);
    txt(svg, Math.min(x(media) + 4, W - 70), H - 2, 'Brasil', {'font-size': 11, class: 'eixo'});
  }
}

function estados() {
  const ufs = Object.keys(T.uf);
  $('t-uf').textContent = `${IND[S.ind].nome}, por estado, ${ANOS[S.ano]}`;
  const sigla = u => u;
  mapa($('g-br'), M.br, ufs, u => T.uf[u], S.uf, u => { S.uf = u; tudo(); }, $('leg-br'));
  const itens = ufs.map(u => [u, T.uf[u], valor(u, S.rec, S.ano)]).filter(x => x[2] != null);
  itens.sort((a, b) => IND[S.ind].menor ? a[2] - b[2] : b[2] - a[2]);
  barras($('g-rank-uf'), itens.map(([u, n, v]) => [u, n, v]), S.uf, u => { S.uf = u; tudo(); }, 19);
  void sigla;
}

function municipios() {
  mapa($('g-rs'), M.rs, MUNS, u => T.mun[u], S.mun, escolherMun, $('leg-rs'));
  ficha();
  const ok = MUNS.map(u => [u, T.mun[u], valor(u, S.rec, S.ano), (linha(u) || [0])[0]]).filter(x => x[2] != null && x[3] >= 5);
  const ind = IND[S.ind];
  ok.sort((a, b) => ind.menor ? a[2] - b[2] : b[2] - a[2]);
  barras($('g-top'), ok.slice(0, 10), S.mun, escolherMun);
  barras($('g-fim'), ok.slice(-10).reverse(), S.mun, escolherMun);
}
function escolherMun(u) { S.mun = u; $('busca-mun').value = T.mun[u]; tudo(); }

function ficha() {
  const u = S.mun, ano = ANOS[S.ano];
  const l = linha(u), lrs = linha('RS'), lbr = linha('BR');
  const cel = (ln, ind) => ln ? fmt(ln[ind.i], ind) : 'sem dado';
  $('ficha-mun').innerHTML = `<div class="ficha"><h3>${esc(T.mun[u])}</h3>
    <p class="muted">${NOME_REC[S.rec]}, ${ano}: ${l ? nf(l[0]) + ' escolas em atividade' + (l[1] ? ', ' + nf(l[1]) + ' matrículas' : '') : 'nenhuma escola neste recorte'}.</p>
    <table><thead><tr><th>Indicador</th><th>Município</th><th>RS</th><th>Brasil</th></tr></thead><tbody>
    ${IND.map((ind, k) => `<tr class="${k === S.ind ? 'sel' : ''}"><td>${esc(ind.nome)}</td><td>${cel(l, ind)}</td><td>${cel(lrs, ind)}</td><td>${cel(lbr, ind)}</td></tr>`).join('')}
    </tbody></table></div>`;
}

// ---------- evolução
function evolucao() {
  const svg = $('g-evol'); limpa(svg);
  const ind = IND[S.ind], W = 1000, H = 320, E = 56, D = 240, Tp = 16, B = 34;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const series = [['BR', 'Brasil', 'var(--l-br)'], [S.uf, T.uf[S.uf], 'var(--l-uf)'], [S.mun, T.mun[S.mun], 'var(--l-mun)']]
    .filter((s, k, a) => a.findIndex(z => z[0] === s[0]) === k)
    .map(([u, nome, cor]) => [nome, cor, ANOS.map((_, k) => valor(u, S.rec, k))]);
  const todos = series.flatMap(s => s[2]).filter(v => v != null);
  if (!todos.length) { txt(svg, W / 2, H / 2, 'Sem dados para este recorte.', {'text-anchor': 'middle'}); return; }
  let lo = ind.pct ? 0 : 0, hi = ind.pct ? 100 : Math.ceil(Math.max(...todos) * 1.1);
  const x = k => E + (W - E - D) * (ANOS.length === 1 ? .5 : k / (ANOS.length - 1));
  const y = v => Tp + (H - Tp - B) * (1 - (v - lo) / (hi - lo));
  for (let k = 0; k <= 4; k++) {
    const v = lo + (hi - lo) * k / 4;
    el('line', {x1: E, x2: W - D, y1: y(v), y2: y(v), stroke: 'var(--line)'}, svg);
    txt(svg, E - 8, y(v) + 4, ind.pct ? nf(v) + '%' : nf(v), {'text-anchor': 'end', class: 'eixo'});
  }
  ANOS.forEach((a, k) => txt(svg, x(k), H - 10, a, {'text-anchor': 'middle', class: 'eixo', 'font-weight': k === S.ano ? 700 : 400}));
  el('line', {x1: x(S.ano), x2: x(S.ano), y1: Tp, y2: H - B, stroke: 'var(--ink-2)', 'stroke-dasharray': '3 4'}, svg);
  const rotulos = [];
  series.forEach(([nome, cor, vals]) => {
    let d = '', pena = false;
    vals.forEach((v, k) => { if (v == null) { pena = false; return; } d += (pena ? 'L' : 'M') + x(k) + ',' + y(v); pena = true; });
    el('path', {d, fill: 'none', stroke: cor, 'stroke-width': 3, 'stroke-linejoin': 'round'}, svg);
    vals.forEach((v, k) => {
      if (v == null) return;
      const c = el('circle', {cx: x(k), cy: y(v), r: 5, fill: cor, stroke: 'var(--paper)', 'stroke-width': 1.5}, svg);
      dica(c, `<b>${esc(nome)}, ${ANOS[k]}</b><br>${esc(ind.nome)}: ${fmt(v)}`);
    });
    const kUlt = vals.map((v, k) => v == null ? -1 : k).filter(k => k >= 0).pop();
    if (kUlt != null) rotulos.push({x: x(kUlt) + 10, y: y(vals[kUlt]) + 4, t: `${nome}: ${fmt(vals[kUlt])}`, cor});
  });
  rotulos.sort((a, b) => a.y - b.y);
  rotulos.forEach((r, k) => { if (k && r.y - rotulos[k - 1].y < 17) r.y = rotulos[k - 1].y + 17; });
  rotulos.forEach(r => txt(svg, r.x, r.y, r.t, {'font-size': 13, 'font-weight': 600, fill: r.cor}));
  $('leg-evol').innerHTML = series.map(([n, c]) => `<span><b style="background:${c}"></b>${esc(n)}</span>`).join('');
  $('t-evol').textContent = `${ind.nome} em ${NOME_REC[S.rec].toLowerCase()}: Brasil, ${T.uf[S.uf]} e ${T.mun[S.mun]}. Toque num estado ou município acima para trocar.`;
}

// ---------- CSV
$('baixar-csv').addEventListener('click', () => {
  const cab = ['nivel', 'codigo', 'nome', 'ano', 'escolas_recorte', 'escolas', 'matriculas', 'pct_internet', 'pct_banda_larga',
    'pct_internet_alunos', 'pct_laboratorio_informatica', 'pct_computador_alunos', 'alunos_por_computador'];
  const linhas = [cab.join(';')];
  const add = (nivel, u, nome) => ANOS.forEach((a, k) => {
    const l = linha(u, S.rec, k); if (!l) return;
    linhas.push([nivel, u, '"' + nome + '"', a, S.rec, ...l.map(v => v == null ? '' : String(v).replace('.', ','))].join(';'));
  });
  add('pais', 'BR', 'Brasil');
  Object.keys(T.uf).forEach(u => add('estado', u, T.uf[u]));
  MUNS.forEach(u => add('municipio_rs', u, T.mun[u]));
  const blob = new Blob(['﻿' + linhas.join('\n')], {type: 'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tecnologia-nas-escolas-${S.rec}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

// ---------- busca
$('lista-mun').innerHTML = MUNS.map(u => `<option value="${esc(T.mun[u])}">`).join('');
$('busca-mun').value = T.mun[S.mun];
$('busca-mun').addEventListener('change', e => { const c = COD_POR_NOME[e.target.value.trim().toLowerCase()]; if (c) escolherMun(c); });
$('busca-mun').addEventListener('input', e => { const c = COD_POR_NOME[e.target.value.trim().toLowerCase()]; if (c && c !== S.mun) escolherMun(c); });

$('anos-fonte').textContent = ANOS.length > 1 ? `${ANOS[0]} a ${ANOS[ANOS.length - 1]}` : String(ANOS[0]);
const pil = $('pilulas'); if (pil) pil.firstElementChild.textContent = `Censo Escolar ${ANOS[0]} a ${ANOS[ANOS.length - 1]}`;

function tudo() { seletores(); resumo(); estados(); municipios(); evolucao(); gravarHash(); }
tudo();

$('theme-btn').addEventListener('click', () => {
  const root = document.documentElement;
  const escuro = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = escuro ? 'light' : 'dark';
  try { localStorage.setItem('iapraprof:theme', JSON.stringify(root.dataset.theme)); } catch (e) {}
});
})();
