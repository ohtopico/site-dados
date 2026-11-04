/* Painel de interesse por IA: resumo, gráfico de linhas, rankings, tabela e CSV.
   Os dados vêm de assets/dados.js (gerado por _fonte/interesse-ia/gerar.py). */
(function () {
  const D = window.DADOS_WIKI;
  const S = D.series, M = D.meses, N = M.length;
  const POR = Object.fromEntries(S.map(s => [s.id, s]));
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nf = (v, c = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  const curto = v => v >= 1e6 ? nf(v / 1e6, v >= 1e7 ? 0 : 1) + ' mi' : v >= 1e3 ? nf(v / 1e3, v >= 1e4 ? 0 : 1) + ' mil' : nf(v);
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MESL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const mes = m => MES[+m.slice(5) - 1] + '/' + m.slice(2, 4);
  const mesLongo = m => MESL[+m.slice(5) - 1] + ' de ' + m.slice(0, 4);
  const CORES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
  const TRACO = ['', '', '', '6 4', '2 3'];
  const GRUPO_CLASSE = { 'Conceitos de IA': 'g-ia', 'Ferramentas': 'g-fe', 'Educação e tecnologia': 'g-ed' };
  const EVENTOS = [['2022-11', 'Lançamento do ChatGPT'], ['2023-03', 'GPT-4']];
  const soma12 = s => s.v.slice(-12).reduce((a, b) => a + b, 0);
  const iAntes = Math.max(0, M.indexOf('2021-12'));
  const antes = s => s.v.slice(iAntes, iAntes + 12).reduce((a, b) => a + b, 0);

  /* ---------- Estado (fica na URL para poder compartilhar) ---------- */
  const q = new URLSearchParams(location.search);
  const PER = [['tudo', 'Desde 2016', N], ['5a', '5 anos', 60], ['2a', '2 anos', 24]];
  const st = {
    v: (q.get('v') || 'ia,openai,generativa').split(',').filter(id => POR[id]).slice(0, 5),
    p: PER.some(p => p[0] === q.get('p')) ? q.get('p') : 'tudo',
    e: q.get('e') === 'rel' ? 'rel' : 'abs'
  };
  if (!st.v.length) st.v = S.slice(0, 3).map(s => s.id);
  function salvaUrl() { history.replaceState(null, '', '?v=' + st.v.join(',') + (st.p !== 'tudo' ? '&p=' + st.p : '') + (st.e === 'rel' ? '&e=rel' : '')); }

  /* ---------- Resumo ---------- */
  function kpis() {
    const ia = S.filter(s => s.grupo !== 'Educação e tecnologia');
    const total = ia.reduce((a, s) => a + soma12(s), 0);
    const porMes = M.map((_, i) => ia.reduce((a, s) => a + s.v[i], 0));
    const rec = porMes.indexOf(Math.max(...porMes));
    const mais = S.slice().sort((a, b) => soma12(b) - soma12(a))[0];
    const cr = S.filter(s => antes(s) >= 1000 && soma12(s) > antes(s)).sort((a, b) => soma12(b) / antes(b) - soma12(a) / antes(a))[0];
    const k = [
      ['Visitas a verbetes de IA', curto(total), 'nos últimos 12 meses, somando ' + ia.length + ' verbetes'],
      ['Verbete mais lido', esc(mais.titulo), curto(soma12(mais)) + ' visitas em 12 meses'],
      ['Mês recorde', mesLongo(M[rec]), curto(porMes[rec]) + ' visitas aos verbetes de IA'],
    ];
    if (cr) k.push(['Maior crescimento', esc(cr.titulo), nf(soma12(cr) / antes(cr), 1) + ' vezes as visitas de antes do ChatGPT']);
    $('kpis').innerHTML = k.map(([r, n, t]) => `<div class="kpi"><div class="rot">${r}</div><div class="num" style="font-size:${n.length > 12 ? 24 : 34}px">${n}</div><div class="ref">${t}</div></div>`).join('');
  }

  /* ---------- Seletores ---------- */
  function seletores() {
    $('f-per').innerHTML = PER.map(([id, nome]) => `<button type="button" data-p="${id}" aria-pressed="${st.p === id}">${nome}</button>`).join('');
    $('f-esc').innerHTML = [['abs', 'Número de visitas'], ['rel', '% do recorde de cada verbete']].map(([id, nome]) => `<button type="button" data-e="${id}" aria-pressed="${st.e === id}">${nome}</button>`).join('');
    let html = '', g = '';
    S.forEach(s => {
      if (s.grupo !== g) { g = s.grupo; html += `<span class="gr">${esc(g)}</span>`; }
      const i = st.v.indexOf(s.id);
      html += `<button type="button" data-v="${s.id}" aria-pressed="${i >= 0}">${i >= 0 ? `<i style="background:${CORES[i]}"></i>` : ''}${esc(s.titulo)}</button>`;
    });
    $('f-ver').innerHTML = html;
  }
  $('f-per').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { st.p = b.dataset.p; atualiza(); } });
  $('f-esc').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { st.e = b.dataset.e; atualiza(); } });
  $('f-ver').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = b.dataset.v, i = st.v.indexOf(id);
    if (i >= 0) { if (st.v.length > 1) st.v.splice(i, 1); }
    else { if (st.v.length >= 5) st.v.shift(); st.v.push(id); }
    atualiza();
    const nb = $('f-ver').querySelector(`[data-v="${id}"]`); if (nb) nb.focus();
  });

  /* ---------- Gráfico de linhas ---------- */
  let W = 760, H = 340, L = 58, R = 18, T = 26, B = 34, estreito = false;
  let janela = [];
  function passo(max) {
    const bruto = max / 4, e = Math.pow(10, Math.floor(Math.log10(bruto || 1)));
    return [1, 2, 2.5, 5, 10].map(f => f * e).find(p => p >= bruto);
  }
  function linha() {
    estreito = $('linha').clientWidth < 600;
    [W, H, L] = estreito ? [400, 300, 46] : [760, 340, 58];
    const n = PER.find(p => p[0] === st.p)[2], i0 = Math.max(0, N - n);
    janela = M.slice(i0).map((m, k) => i0 + k);
    const sel = st.v.map(id => POR[id]);
    // Na escala relativa, cada verbete vira % do próprio recorde no período: dá para comparar o formato das curvas
    const val = st.e === 'rel'
      ? Object.fromEntries(sel.map(se => { const mx = Math.max(1, ...janela.map(i => se.v[i])); return [se.id, se.v.map(v => v / mx * 100)]; }))
      : Object.fromEntries(sel.map(se => [se.id, se.v]));
    const rot = v => st.e === 'rel' ? nf(v) + '%' : curto(v);
    const max = st.e === 'rel' ? 100 : Math.max(1, ...sel.flatMap(s => janela.map(i => s.v[i])));
    const pa = st.e === 'rel' ? 25 : passo(max), top = Math.ceil(max / pa) * pa;
    const x = k => L + (W - L - R) * (janela.length === 1 ? 0 : k / (janela.length - 1));
    const y = v => T + (H - T - B) * (1 - v / top);
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="linha-titulo linha-desc"><desc id="linha-desc">${esc(descricao(sel))}</desc>`;
    for (let v = 0; v <= top + 1e-9; v += pa) s += `<line class="grade" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${rot(v)}</text>`;
    janela.forEach((i, k) => {
      const m = M[i], jan = m.endsWith('-01');
      if (janela.length <= 30 ? +m.slice(5) % (estreito ? 6 : 3) === 1 : jan && (!estreito || janela.length <= 60 || +m.slice(0, 4) % 2 === 0)) s += `<text x="${x(k)}" y="${H - B + 18}" text-anchor="middle">${janela.length <= 30 ? mes(m) : m.slice(0, 4)}</text>`;
    });
    EVENTOS.forEach(([m, nome], j) => {
      const k = janela.indexOf(M.indexOf(m)); if (k < 0) return;
      s += `<g class="evento"><line x1="${x(k)}" x2="${x(k)}" y1="${T - 6}" y2="${H - B}"/><text x="${x(k) - 5}" y="${T + 6 + j * 14}" text-anchor="end">${estreito ? nome.replace('Lançamento do ', '') : nome}</text></g>`;
    });
    sel.forEach((se, j) => {
      const d = janela.map((i, k) => (k ? 'L' : 'M') + x(k).toFixed(1) + ',' + y(val[se.id][i]).toFixed(1)).join('');
      s += `<path class="serie" d="${d}" stroke="${CORES[j]}"${TRACO[j] ? ` stroke-dasharray="${TRACO[j]}"` : ''}/>`;
    });
    s += `<line class="eixo" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/><line class="cursor" id="cursor" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>`;
    s += sel.map((_, j) => `<circle id="pt${j}" r="4.5" fill="${CORES[j]}" stroke="var(--paper)" stroke-width="2" visibility="hidden"/>`).join('');
    $('linha').innerHTML = s + `<rect id="captura" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent"/></svg>`;
    $('linha-leg').innerHTML = sel.map((se, j) => `<span><span class="ln" style="border-color:${CORES[j]};${TRACO[j] ? 'border-top-style:dashed' : ''}"></span>${esc(se.titulo)}</span>`).join('');
    $('linha-titulo').textContent = sel.length === 1 ? 'Visitas por mês: ' + sel[0].titulo : 'Visitas por mês';

    const svg = $('linha').querySelector('svg'), tip = $('tip');
    function mostra(ev) {
      const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * W / r.width;
      const k = Math.max(0, Math.min(janela.length - 1, Math.round((px - L) / (W - L - R) * (janela.length - 1))));
      const i = janela[k], c = $('cursor');
      c.setAttribute('x1', x(k)); c.setAttribute('x2', x(k)); c.setAttribute('visibility', 'visible');
      sel.forEach((se, j) => { const p = $('pt' + j); p.setAttribute('cx', x(k)); p.setAttribute('cy', y(val[se.id][i])); p.setAttribute('visibility', 'visible'); });
      tip.innerHTML = `<b>${mesLongo(M[i])}</b>` + sel.map(se => `${esc(se.titulo)}: ${nf(se.v[i])}${st.e === 'rel' ? ` (${nf(val[se.id][i])}% do recorde)` : ''}`).join('<br>');
      tip.classList.add('on');
      const tx = Math.min(innerWidth - 270, ev.clientX + 14);
      tip.style.left = tx + 'px'; tip.style.top = (ev.clientY + 14) + 'px';
    }
    function esconde() { tip.classList.remove('on'); $('cursor').setAttribute('visibility', 'hidden'); sel.forEach((_, j) => $('pt' + j).setAttribute('visibility', 'hidden')); }
    const cap = $('captura');
    cap.addEventListener('pointermove', mostra); cap.addEventListener('pointerdown', mostra); cap.addEventListener('pointerleave', esconde);
  }
  function descricao(sel) {
    return 'Gráfico de linhas das visitas mensais de ' + mesLongo(M[janela[0]]) + ' a ' + mesLongo(M[janela[janela.length - 1]]) + '. ' +
      sel.map(se => { const vs = janela.map(i => se.v[i]), mx = Math.max(...vs); return `${se.titulo}: máximo de ${nf(mx)} visitas em ${mesLongo(M[janela[vs.indexOf(mx)]])}, ${nf(vs[vs.length - 1])} no último mês.`; }).join(' ');
  }

  /* ---------- Tabela e CSV ---------- */
  function tabela() {
    const sel = st.v.map(id => POR[id]);
    $('tab').innerHTML = `<table class="tab"><thead><tr><th>Mês</th>${sel.map(s => `<th>${esc(s.titulo)}</th>`).join('')}</tr></thead><tbody>` +
      janela.slice().reverse().map(i => `<tr><td>${mesLongo(M[i])}</td>${sel.map(s => `<td>${nf(s.v[i])}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
  }
  $('tab-btn').addEventListener('click', () => {
    const t = $('tab'), abre = t.hidden; t.hidden = !abre;
    $('tab-btn').setAttribute('aria-expanded', abre); $('tab-btn').textContent = abre ? 'Esconder a tabela' : 'Ver como tabela';
  });
  $('csv-btn').addEventListener('click', () => {
    const cel = t => /[",;\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    const linhas = [['mes', ...S.map(s => s.titulo)].map(cel).join(',')].concat(M.map((m, i) => [m, ...S.map(s => s.v[i])].join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = 'interesse-por-ia-wikipedia.csv'; document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- Rankings ---------- */
  function barras(el, itens, fmt) {
    const max = Math.max(...itens.map(i => i.v));
    $(el).innerHTML = '<div class="barras">' + itens.map(it => `<button class="barra" type="button" data-v="${it.s.id}" title="Mostrar no gráfico">
      <span class="nm">${esc(it.s.titulo)}</span><span class="tr"><span class="b ${GRUPO_CLASSE[it.s.grupo] || ''}" style="left:0;width:${(it.v / max * 72).toFixed(1)}%"></span>
      <span class="t" style="left:calc(${(it.v / max * 72).toFixed(1)}% + 6px)">${fmt(it.v)}</span></span></button>`).join('') + '</div>';
  }
  function rankings() {
    barras('rank', S.map(s => ({ s, v: soma12(s) })).sort((a, b) => b.v - a.v), curto);
    const c = S.filter(s => antes(s) >= 1000 && soma12(s) > antes(s)).map(s => ({ s, v: soma12(s) / antes(s) })).sort((a, b) => b.v - a.v);
    barras('cresc', c, v => nf(v, 1) + ' vezes');
    if (!c.length) $('cresc').innerHTML = '<p class="nota">Sem dados suficientes para comparar.</p>';
  }
  ['rank', 'cresc'].forEach(el => $(el).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (!st.v.includes(b.dataset.v)) { if (st.v.length >= 5) st.v.shift(); st.v.push(b.dataset.v); atualiza(); }
    $('linha').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));

  /* ---------- Tema ---------- */
  $('theme-btn').addEventListener('click', () => {
    const root = document.documentElement;
    const escuro = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = escuro ? 'light' : 'dark';
    try { localStorage.setItem('iapraprof:theme', JSON.stringify(root.dataset.theme)); } catch (e) {}
  });

  function atualiza() { seletores(); linha(); tabela(); salvaUrl(); }
  let largura = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - largura) > 40) { largura = innerWidth; linha(); } });
  $('ate').textContent = mesLongo(M[N - 1]);
  kpis(); rankings(); atualiza();
})();
