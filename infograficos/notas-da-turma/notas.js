/* Análise das notas da turma. Tudo acontece neste navegador: nenhuma nota ou nome é enviado. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const HAB = window.HABILIDADES || {};
  const NS = 'http://www.w3.org/2000/svg';

  const estado = {
    abas: [], aba: 0, origem: '',
    alunos: [], colunas: [],
    corte: 0.6, escala: 10, esconder: false,
    ordem: { col: 'media', dir: 1 },
    calc: null
  };

  // ---------- Utilidades ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (v == null) return null;
    let s = String(v).trim().replace(/\s/g, '');
    if (!s) return null;
    s = s.replace(/%$/, '');
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '');
    s = s.replace(',', '.');
    if (!/^-?\d*\.?\d+$/.test(s)) return null;
    return Number(s);
  }
  const ehVazio = (v) => v === '' || v == null;
  function fmt(p) {
    if (p == null || isNaN(p)) return '–';
    if (estado.escala === 100) return String(Math.round(p * 100));
    return (p * 10).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  const pct = (x) => Math.round(x * 100) + '%';
  const nomeDe = (a) => (estado.esconder ? 'Aluno ' + a.n : a.nome);
  function el(tag, attrs, pai) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(e);
    return e;
  }
  function texto(pai, x, y, t, attrs) {
    const e = el('text', Object.assign({ x, y }, attrs || {}), pai);
    e.textContent = t;
    return e;
  }
  const mediana = (v) => {
    if (!v.length) return null;
    const s = v.slice().sort((a, b) => a - b), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const media = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

  // ---------- Dica (tooltip) ----------
  const tip = $('tip-g');
  function mostrarDica(ev, html) {
    tip.innerHTML = html;
    tip.style.opacity = '1';
    const x = Math.min(ev.clientX + 14, window.innerWidth - 270);
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top = (ev.clientY + 16) + 'px';
  }
  const esconderDica = () => { tip.style.opacity = '0'; };
  function dica(alvo, html) {
    alvo.addEventListener('pointermove', (ev) => mostrarDica(ev, html()));
    alvo.addEventListener('pointerleave', esconderDica);
    alvo.addEventListener('pointerdown', (ev) => mostrarDica(ev, html()));
  }

  // ---------- Leitura do modelo da planilha ----------
  const RE_HAB = /\b(E[FM]\d{2}[A-Z]{2}\d{2,3})\b/i;
  const RE_RESUMO_COL = /m[eé]dia|total|soma|final|resultado|situa[cç][aã]o|conceito|recupera|frequ[eê]ncia|faltas/i;
  const RE_ID_COL = /matr[ií]cula|^n[ºo°.]*$|^n[uú]mero|chamada|^id$|c[oó]digo do aluno|^ra$|cpf|turma|telefone/i;
  const RE_RESUMO_LIN = /^(m[eé]dia|total|soma|m[aá]xim|m[ií]nim|resumo)/i;
  const RE_VALE_LIN = /^(vale|valor|pontua[cç][aã]o m[aá]xima|nota m[aá]xima|m[aá]x\.?$|total de pontos)/i;

  function valeDoTitulo(t) {
    const m = /\((?:vale\s*)?(\d+(?:[.,]\d+)?)\s*(?:pts?|pontos)?\)|\/\s*(\d+(?:[.,]\d+)?)\s*$|vale\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:pts|pontos)\b/i.exec(t);
    if (!m) return null;
    const v = num(m[1] || m[2] || m[3] || m[4]);
    return v > 0 ? v : null;
  }

  function montar(linhas) {
    let h = linhas.findIndex((l) => l.filter((v) => !ehVazio(v)).length >= 2);
    if (h < 0) throw new Error('Não encontrei uma linha de títulos com pelo menos duas colunas.');
    // Se a primeira linha cheia já é de números, não há títulos.
    const cab0 = linhas[h];
    const semTitulo = cab0.filter((v) => num(v) != null).length >= cab0.filter((v) => !ehVazio(v)).length - 1 && cab0.filter((v) => num(v) != null).length >= 2;
    const ncol = Math.max(...linhas.slice(h, h + 400).map((l) => l.length));
    const cab = [];
    for (let j = 0; j < ncol; j++) cab.push(semTitulo ? 'Coluna ' + (j + 1) : String(ehVazio(cab0[j]) ? 'Coluna ' + (j + 1) : cab0[j]));
    let dados = linhas.slice(semTitulo ? h : h + 1).filter((l) => l.some((v) => !ehVazio(v)));
    if (!dados.length) throw new Error('A planilha tem títulos, mas nenhuma linha de alunos.');

    // Coluna do nome: a que mais tem texto entre as primeiras colunas.
    let colNome = -1, melhor = 0;
    for (let j = 0; j < Math.min(ncol, 5); j++) {
      const t = dados.filter((l) => !ehVazio(l[j]) && num(l[j]) == null && !/^f(alta|altou)?$|^-$/i.test(String(l[j]))).length;
      if (t > melhor) { melhor = t; colNome = j; }
    }
    if (melhor < dados.length * 0.5) colNome = -1;

    // Linha "vale" logo depois dos títulos.
    let vales = null;
    if (colNome >= 0 && dados.length && RE_VALE_LIN.test(String(dados[0][colNome] || ''))) {
      vales = dados[0];
      dados = dados.slice(1);
    }
    dados = dados.filter((l) => colNome < 0 || !RE_RESUMO_LIN.test(String(l[colNome] || '')));

    const colunas = [];
    for (let j = 0; j < ncol; j++) {
      if (j === colNome) continue;
      const cheios = dados.filter((l) => !ehVazio(l[j]));
      if (!cheios.length) continue;
      const nums = cheios.map((l) => num(l[j])).filter((v) => v != null);
      if (nums.length < cheios.length * 0.5) continue;
      const titulo = cab[j];
      const max = Math.max(...nums);
      if (RE_ID_COL.test(titulo) || max > 1000) continue;
      let vale = (vales && num(vales[j]) > 0) ? num(vales[j]) : valeDoTitulo(titulo);
      if (!vale) vale = max <= 1 ? 1 : max <= 10 ? 10 : max <= 100 ? 100 : Math.ceil(max);
      const m = RE_HAB.exec(titulo);
      colunas.push({ j, titulo, vale, hab: m ? m[1].toUpperCase() : '', usar: !RE_RESUMO_COL.test(titulo) });
    }
    if (!colunas.length) throw new Error('Não encontrei colunas com notas. Confira se as notas são números.');
    if (!colunas.some((c) => c.usar)) colunas.forEach((c) => { c.usar = true; });

    const alunos = [];
    dados.forEach((l) => {
      const temNota = colunas.some((c) => num(l[c.j]) != null);
      const nome = colNome >= 0 ? String(l[colNome] || '').trim() : '';
      if (!temNota && !nome) return;
      alunos.push({ n: alunos.length + 1, nome: nome || 'Aluno ' + (alunos.length + 1), linha: l });
    });
    if (!alunos.length) throw new Error('Não encontrei alunos com notas.');
    return { alunos, colunas, colNome, temVales: !!vales };
  }

  // ---------- Cálculo ----------
  function calcular() {
    const cols = estado.colunas.filter((c) => c.usar && c.vale > 0);
    const corte = estado.corte;
    const alunos = estado.alunos.map((a) => {
      const notas = cols.map((c) => {
        const v = num(a.linha[c.j]);
        return v == null ? null : Math.max(0, v / c.vale);
      });
      const feitas = notas.filter((v) => v != null);
      return { a, notas, media: media(feitas), faltam: notas.length - feitas.length };
    });
    const comMedia = alunos.filter((x) => x.media != null);
    const medias = comMedia.map((x) => x.media);
    const porCol = cols.map((c, k) => {
      const v = alunos.map((x) => x.notas[k]).filter((y) => y != null);
      return { c, k, media: media(v), n: v.length, abaixo: v.length ? v.filter((y) => y < corte).length / v.length : 0 };
    });
    return {
      cols, alunos, comMedia, porCol,
      mediaTurma: media(medias), mediana: mediana(medias),
      abaixo: comMedia.filter((x) => x.media < corte),
      perto: comMedia.filter((x) => x.media >= corte && x.media < corte + 0.1)
    };
  }

  // ---------- Desenho ----------
  function largura(svg) { return Math.max(300, Math.floor(svg.parentNode.getBoundingClientRect().width - 2)); }

  function desenharResumo(r) {
    const difícil = r.porCol.filter((p) => p.media != null).sort((a, b) => a.media - b.media)[0];
    const n = r.comMedia.length;
    const caixas = [
      [String(n), n === 1 ? 'aluno com nota' : 'alunos com nota'],
      [String(r.cols.length), r.cols.length === 1 ? 'avaliação na análise' : 'avaliações na análise'],
      [fmt(r.mediaTurma), 'média da turma (de 0 a ' + estado.escala + ')'],
      [fmt(r.mediana), 'mediana: metade da turma ficou acima'],
      [r.abaixo.length + ' (' + (n ? pct(r.abaixo.length / n) : '0%') + ')', 'abaixo da média para aprovação (' + fmt(estado.corte) + ')'],
      [difícil ? fmt(difícil.media) : '–', difícil ? 'na avaliação mais difícil: ' + esc(difícil.c.titulo) : 'avaliação mais difícil']
    ];
    $('resumo').innerHTML = caixas.map((c) => '<div><b>' + c[0] + '</b><span>' + c[1] + '</span></div>').join('');
    $('data-print').textContent = 'Gerado em ' + new Date().toLocaleDateString('pt-BR') + (estado.origem ? ' a partir de ' + estado.origem : '') + '. Média para aprovação: ' + fmt(estado.corte) + ' de ' + estado.escala + '.';
  }

  function desenharDistribuicao(r) {
    const svg = $('g-dist');
    svg.innerHTML = '';
    const W = largura(svg), H = 280, m = { t: 46, r: 12, b: 40, l: 12 };
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    const caixas = Array.from({ length: 10 }, (_, i) => ({ i, alunos: [] }));
    r.comMedia.forEach((x) => { caixas[Math.min(9, Math.floor(x.media * 10 + 1e-9))].alunos.push(x); });
    const maxN = Math.max(1, ...caixas.map((c) => c.alunos.length));
    const iw = W - m.l - m.r, ih = H - m.t - m.b, bw = iw / 10;
    const y = (v) => m.t + ih - (v / maxN) * ih;
    // grade recessiva
    el('line', { x1: m.l, x2: W - m.r, y1: m.t + ih, y2: m.t + ih, class: 'base' }, svg);
    caixas.forEach((c) => {
      const x0 = m.l + c.i * bw;
      const centro = (c.i + 0.5) / 10;
      const abaixo = centro < estado.corte;
      if (c.alunos.length) {
        const h = ih - (y(c.alunos.length) - m.t);
        const top = y(c.alunos.length);
        const bx = x0 + 1, bwid = bw - 2;
        const rr = Math.min(4, h, bwid / 2);
        el('path', { d: 'M' + bx + ',' + (m.t + ih) + 'V' + (top + rr) + 'Q' + bx + ',' + top + ' ' + (bx + rr) + ',' + top + 'H' + (bx + bwid - rr) + 'Q' + (bx + bwid) + ',' + top + ' ' + (bx + bwid) + ',' + (top + rr) + 'V' + (m.t + ih) + 'Z', class: abaixo ? 'barra-baixa' : 'barra-alta' }, svg);
        texto(svg, x0 + bw / 2, top - 6, String(c.alunos.length), { 'text-anchor': 'middle', class: 'rotulo' });
      }
      const alvo = el('rect', { x: x0, y: m.t, width: bw, height: ih, fill: 'transparent' }, svg);
      dica(alvo, () => {
        const de = fmt(c.i / 10), ate = fmt((c.i + 1) / 10);
        const nomes = c.alunos.map((x) => esc(nomeDe(x.a)) + ' (' + fmt(x.media) + ')');
        return '<b>Média de ' + de + ' a ' + ate + '</b><br>' + (nomes.length ? c.alunos.length + (c.alunos.length === 1 ? ' aluno: ' : ' alunos: ') + nomes.slice(0, 12).join(', ') + (nomes.length > 12 ? '...' : '') : 'Nenhum aluno');
      });
      texto(svg, x0, H - m.b + 18, fmt(c.i / 10).replace(',0', ''), { 'text-anchor': 'middle', class: 'eixo' });
    });
    texto(svg, W - m.r, H - m.b + 18, String(estado.escala), { 'text-anchor': 'end', class: 'eixo' });
    texto(svg, m.l + iw / 2, H - 6, 'média do aluno', { 'text-anchor': 'middle', class: 'eixo' });
    const xc = m.l + estado.corte * iw;
    el('line', { x1: xc, x2: xc, y1: 8, y2: m.t + ih, class: 'linha-corte' }, svg);
    texto(svg, xc + (estado.corte > 0.75 ? -6 : 6), 18, 'média para aprovação', { 'text-anchor': estado.corte > 0.75 ? 'end' : 'start', class: 'eixo' });
    $('dist-legenda').innerHTML = '<span><b class="lg-baixa"></b>abaixo da média para aprovação</span><span><b class="lg-alta"></b>na média ou acima</span>';
    const n = r.comMedia.length;
    const faixa = caixas.slice().sort((a, b) => b.alunos.length - a.alunos.length)[0];
    $('dist-txt').textContent = n
      ? 'Cada barra conta os alunos cuja média ficou naquela faixa. A faixa com mais alunos é de ' + fmt(faixa.i / 10) + ' a ' + fmt((faixa.i + 1) / 10) + ', com ' + faixa.alunos.length + (faixa.alunos.length === 1 ? ' aluno.' : ' alunos.')
      : 'Nenhum aluno tem nota nas colunas escolhidas.';
  }

  function desenharHabilidades(r) {
    const svg = $('g-hab');
    svg.innerHTML = '';
    const linhas = r.porCol.filter((p) => p.media != null).sort((a, b) => a.media - b.media);
    const W = largura(svg);
    const estreito = W < 560;
    const lab = estreito ? 0 : Math.min(260, Math.round(W * 0.34));
    const dir = 132;
    const alt = estreito ? 58 : 40;
    const m = { t: 14, b: 30 };
    const H = m.t + linhas.length * alt + m.b;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    const x0 = estreito ? 6 : lab + 10, x1 = W - dir;
    const maxP = Math.max(1, ...r.alunos.flatMap((x) => x.notas.filter((v) => v != null)));
    const x = (p) => x0 + Math.min(p, maxP) / maxP * (x1 - x0);
    [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
      el('line', { x1: x(t), x2: x(t), y1: m.t - 4, y2: H - m.b, class: 'grade' }, svg);
      texto(svg, x(t), H - m.b + 18, fmt(t).replace(',0', ''), { 'text-anchor': 'middle', class: 'eixo' });
    });
    el('line', { x1: x(estado.corte), x2: x(estado.corte), y1: m.t - 4, y2: H - m.b, class: 'linha-corte' }, svg);
    linhas.forEach((p, i) => {
      const yTopo = m.t + i * alt;
      const yc = yTopo + (estreito ? 36 : alt / 2);
      const nome = p.c.titulo.length > 34 ? p.c.titulo.slice(0, 33) + '…' : p.c.titulo;
      if (estreito) texto(svg, x0, yTopo + 14, nome, { class: 'rotulo-hab' });
      else texto(svg, lab, yc + 4, nome, { 'text-anchor': 'end', class: 'rotulo-hab' });
      const baixa = p.media < estado.corte;
      const xb = x(p.media), h = 10, rr = 4;
      el('path', { d: 'M' + x0 + ',' + (yc - h / 2) + 'H' + (xb - rr) + 'Q' + xb + ',' + (yc - h / 2) + ' ' + xb + ',' + (yc - h / 2 + rr) + 'V' + (yc + h / 2 - rr) + 'Q' + xb + ',' + (yc + h / 2) + ' ' + (xb - rr) + ',' + (yc + h / 2) + 'H' + x0 + 'Z', class: baixa ? 'barra-baixa' : 'barra-alta' }, svg);
      texto(svg, W - 4, yc + 4, fmt(p.media) + ' · ' + pct(p.abaixo) + ' abaixo', { 'text-anchor': 'end', class: 'rotulo' });
      const alvo = el('rect', { x: 0, y: yTopo, width: W, height: alt, fill: 'transparent' }, svg);
      dica(alvo, () => '<b>' + esc(p.c.titulo) + '</b><br>Média da turma: ' + fmt(p.media) + '<br>' + p.n + ' alunos fizeram; ' + pct(p.abaixo) + ' abaixo da média para aprovação' + (p.c.hab && HAB[p.c.hab] ? '<br>' + esc(p.c.hab) + ': ' + esc(HAB[p.c.hab][0]) : ''));
      // pontos dos alunos, com leve deslocamento vertical para não sobrepor
      const vistos = {};
      r.alunos.forEach((a) => {
        const v = a.notas[p.k];
        if (v == null) return;
        const chave = Math.round(x(v) / 5);
        const k = vistos[chave] = (vistos[chave] || 0) + 1;
        const dy = ((k % 3) - 1) * 6;
        const c = el('circle', { cx: x(v), cy: yc + dy, r: 4, class: 'ponto' }, svg);
        dica(c, () => '<b>' + esc(nomeDe(a.a)) + '</b><br>' + esc(p.c.titulo) + ': ' + fmt(v) + ' (' + fmtBruto(a.a.linha[p.c.j]) + ' de ' + fmtBruto(p.c.vale) + ')');
      });
    });
    $('hab-legenda').innerHTML = '<span><b class="lg-baixa"></b>média da turma abaixo da média para aprovação</span><span><b class="lg-alta"></b>média na média para aprovação ou acima</span><span><b class="lg-ponto"></b>um aluno</span><span>% = alunos abaixo da média para aprovação</span>';
  }
  function fmtBruto(v) {
    const n = num(v);
    return n == null ? String(v) : n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }

  function desenharRetomar(r) {
    const lista = r.porCol.filter((p) => p.media != null && (p.media < estado.corte || p.abaixo >= 0.3))
      .sort((a, b) => a.media - b.media).slice(0, 6);
    const box = $('retomar');
    if (!lista.length) {
      box.innerHTML = '<p class="nota retomar-vazio">Nenhuma avaliação teve média abaixo da média para aprovação nem 30% ou mais da turma abaixo dela.</p>';
      return;
    }
    let html = '<h3 class="retomar-titulo">Para retomar</h3><p class="muted">Avaliações com média abaixo da média para aprovação ou com 30% ou mais da turma abaixo dela.</p><div class="achados">';
    lista.forEach((p) => {
      const h = p.c.hab && HAB[p.c.hab];
      const quem = r.alunos.filter((a) => a.notas[p.k] != null && a.notas[p.k] < estado.corte).map((a) => esc(nomeDe(a.a)));
      html += '<div class="achado"><span class="num">' + fmt(p.media) + '</span><h3>' + esc(p.c.titulo) + '</h3>';
      if (h) html += '<p><b>' + esc(p.c.hab) + '</b> (' + esc(h[1]) + '): ' + esc(h[0]) + '</p>';
      else if (p.c.hab) html += '<p><b>' + esc(p.c.hab) + '</b></p>';
      html += '<p>' + pct(p.abaixo) + ' da turma abaixo da média para aprovação' + (quem.length ? ': ' + quem.join(', ') + '.' : '.') + '</p>';
      if (h && h[2]) html += '<p class="no-print"><a href="' + esc(h[2]) + '">Material gratuito para retomar ' + esc(p.c.hab) + '</a></p>';
      html += '</div>';
    });
    box.innerHTML = html + '</div>';
  }

  function desenharAtencao(r) {
    const n = r.comMedia.length;
    $('atencao-txt').textContent = r.abaixo.length
      ? r.abaixo.length + ' de ' + n + ' alunos estão abaixo de ' + fmt(estado.corte) + '. Para cada um, as duas avaliações com nota mais baixa e quantas avaliações ficaram sem nota.'
      : 'Nenhum aluno está abaixo da média para aprovação nas avaliações escolhidas.';
    const cartao = (x) => {
      const piores = x.notas.map((v, k) => ({ v, c: r.cols[k] })).filter((o) => o.v != null).sort((a, b) => a.v - b.v).slice(0, 2);
      return '<div class="aluno-card"><div class="aluno-topo"><strong>' + esc(nomeDe(x.a)) + '</strong><span class="aluno-media">' + fmt(x.media) + '</span></div>' +
        '<p>Mais baixas: ' + piores.map((o) => esc(o.c.titulo) + ' (' + fmt(o.v) + ')').join('; ') + '</p>' +
        (x.faltam ? '<p class="falta">' + x.faltam + (x.faltam === 1 ? ' avaliação sem nota' : ' avaliações sem nota') + '</p>' : '') + '</div>';
    };
    let html = r.abaixo.slice().sort((a, b) => a.media - b.media).map(cartao).join('');
    if (r.perto.length) {
      html += '<h3 class="perto-titulo">Perto do limite</h3><p class="muted perto-txt">Na média para aprovação ou até ' + (estado.escala === 10 ? '1 ponto' : '10 pontos') + ' acima dela.</p>' +
        r.perto.slice().sort((a, b) => a.media - b.media).map(cartao).join('');
    }
    const semNota = r.alunos.filter((x) => x.media == null);
    if (semNota.length) html += '<p class="nota perto-txt">Sem nenhuma nota nas avaliações escolhidas: ' + semNota.map((x) => esc(nomeDe(x.a))).join(', ') + '.</p>';
    $('atencao').innerHTML = html;
  }

  function corCelula(v) {
    if (v == null) return '';
    const c = estado.corte;
    if (v < c) {
      const t = Math.min(1, (c - v) / Math.max(c, 0.01));
      return 'background:color-mix(in srgb, var(--n-baixa) ' + Math.round(10 + t * 55) + '%, var(--paper))';
    }
    const t = Math.min(1, (v - c) / Math.max(1 - c, 0.01));
    return 'background:color-mix(in srgb, var(--n-alta) ' + Math.round(8 + t * 50) + '%, var(--paper))';
  }

  function desenharMapa(r) {
    const o = estado.ordem;
    const linhas = r.alunos.slice();
    const chave = (x) => (o.col === 'media' ? x.media : o.col === 'nome' ? null : x.notas[o.col]);
    linhas.sort((a, b) => {
      if (o.col === 'nome') return o.dir * nomeDe(a.a).localeCompare(nomeDe(b.a), 'pt-BR');
      const va = chave(a), vb = chave(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return o.dir * (va - vb);
    });
    const seta = (c) => (o.col === c ? (o.dir > 0 ? ' ↑' : ' ↓') : '');
    const aria = (c) => (o.col === c ? (o.dir > 0 ? 'ascending' : 'descending') : 'none');
    let html = '<thead><tr><th scope="col" aria-sort="' + aria('nome') + '"><button type="button" data-ord="nome">Aluno' + seta('nome') + '</button></th>' +
      '<th scope="col" aria-sort="' + aria('media') + '"><button type="button" data-ord="media">Média' + seta('media') + '</button></th>';
    r.cols.forEach((c, k) => {
      html += '<th scope="col" aria-sort="' + aria(k) + '"><button type="button" data-ord="' + k + '" title="' + esc(c.titulo) + '">' + esc(c.titulo.length > 22 ? c.titulo.slice(0, 21) + '…' : c.titulo) + seta(k) + '</button></th>';
    });
    html += '</tr></thead><tbody>';
    linhas.forEach((x) => {
      html += '<tr><th scope="row">' + esc(nomeDe(x.a)) + '</th><td class="media-cel" style="' + corCelula(x.media) + '">' + fmt(x.media) + '</td>';
      x.notas.forEach((v) => { html += '<td style="' + corCelula(v) + '">' + (v == null ? '<span class="sem">sem nota</span>' : fmt(v)) + '</td>'; });
      html += '</tr>';
    });
    html += '</tbody><tfoot><tr><th scope="row">Média da turma</th><td class="media-cel">' + fmt(r.mediaTurma) + '</td>';
    r.porCol.forEach((p) => { html += '<td>' + fmt(p.media) + '</td>'; });
    html += '</tr></tfoot>';
    $('mapa').innerHTML = html;
  }

  function desenharAjustes() {
    const tb = $('tabela-colunas').querySelector('tbody');
    tb.innerHTML = estado.colunas.map((c, i) => {
      const h = c.hab && HAB[c.hab];
      return '<tr><td><input type="checkbox" data-i="' + i + '" data-campo="usar"' + (c.usar ? ' checked' : '') + ' aria-label="Usar ' + esc(c.titulo) + '"></td>' +
        '<td>' + esc(c.titulo) + '</td>' +
        '<td><input type="number" min="0.1" step="any" data-i="' + i + '" data-campo="vale" value="' + c.vale + '" aria-label="Valor máximo de ' + esc(c.titulo) + '"></td>' +
        '<td><input type="text" data-i="' + i + '" data-campo="hab" value="' + esc(c.hab) + '" placeholder="EF06CO01" maxlength="9" aria-label="Código da habilidade de ' + esc(c.titulo) + '"><span class="hab-txt">' + (h ? esc(h[0]) : (c.hab ? 'Código fora das páginas BNCC em dados' : '')) + '</span></td></tr>';
    }).join('');
  }

  function desenharTudo() {
    const usadas = estado.colunas.filter((c) => c.usar && c.vale > 0);
    if (!usadas.length) {
      $('msg').textContent = 'Marque pelo menos uma coluna para analisar.';
      return;
    }
    const r = estado.calc = calcular();
    desenharResumo(r);
    desenharDistribuicao(r);
    desenharHabilidades(r);
    desenharRetomar(r);
    desenharAtencao(r);
    desenharMapa(r);
  }

  // ---------- Carregar ----------
  function carregarAba(i) {
    estado.aba = i;
    const aba = estado.abas[i];
    const m = montar(aba.linhas);
    estado.alunos = m.alunos;
    estado.colunas = m.colunas;
    estado.ordem = { col: 'media', dir: 1 };
    const fora = m.colunas.filter((c) => !c.usar).map((c) => c.titulo);
    $('ajustes-resumo').textContent = 'Encontrei ' + m.alunos.length + ' alunos e ' + m.colunas.length + (m.colunas.length === 1 ? ' coluna de notas' : ' colunas de notas') +
      (m.colNome < 0 ? ', sem uma coluna de nomes (os alunos aparecem numerados)' : '') +
      (fora.length ? '. Deixei de fora ' + fora.join(', ') + ', que parece média ou total já calculado' : '') +
      '. Confira o valor máximo de cada avaliação e o código da habilidade, se houver.';
    desenharAjustes();
    desenharTudo();
  }

  function abrir(abas, origem) {
    const validas = abas.filter((a) => a.linhas.some((l) => l.some((v) => !ehVazio(v))));
    if (!validas.length) throw new Error('A planilha está vazia.');
    estado.abas = validas;
    estado.origem = origem;
    const sel = $('aba');
    sel.innerHTML = validas.map((a, i) => '<option value="' + i + '">' + esc(a.nome) + '</option>').join('');
    $('campo-aba').hidden = validas.length < 2;
    // Primeira aba que tenha notas.
    let erro = null;
    for (let i = 0; i < validas.length; i++) {
      try { sel.value = String(i); carregarAba(i); erro = null; break; } catch (e) { erro = e; }
    }
    if (erro) throw erro;
    $('resultado').hidden = false;
    $('msg').className = 'feedback ok';
    $('msg').textContent = 'Planilha aberta: ' + origem + '. Os dados estão só neste navegador.';
    requestAnimationFrame(desenharTudo);
    $('ajustes').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  function falhou(e) {
    $('msg').className = 'feedback bad';
    $('msg').textContent = e && e.message ? e.message : 'Não consegui ler a planilha.';
  }

  async function abrirArquivo(f) {
    if (!f) return;
    $('msg').className = 'feedback';
    $('msg').textContent = 'Lendo ' + f.name + '...';
    try { abrir(await window.Planilha.lerArquivo(f), f.name); } catch (e) { falhou(e); }
  }

  $('arquivo').addEventListener('change', (ev) => abrirArquivo(ev.target.files[0]));
  const zona = $('soltar');
  ['dragenter', 'dragover'].forEach((t) => zona.addEventListener(t, (ev) => { ev.preventDefault(); zona.classList.add('sobre'); }));
  ['dragleave', 'drop'].forEach((t) => zona.addEventListener(t, () => zona.classList.remove('sobre')));
  zona.addEventListener('drop', (ev) => { ev.preventDefault(); abrirArquivo(ev.dataTransfer.files[0]); });
  $('usar-colado').addEventListener('click', () => {
    const t = $('colar').value;
    if (!t.trim()) { falhou(new Error('Cole as células da planilha na caixa antes.')); return; }
    try { abrir(window.Planilha.lerTexto(t), 'notas coladas'); } catch (e) { falhou(e); }
  });
  $('exemplo').addEventListener('click', () => {
    try { abrir(window.Planilha.lerTexto(exemplo()), 'turma de exemplo (nomes fictícios)'); } catch (e) { falhou(e); }
  });

  $('aba').addEventListener('change', (ev) => { try { carregarAba(Number(ev.target.value)); } catch (e) { falhou(e); } });
  $('corte').addEventListener('input', (ev) => {
    const v = Number(ev.target.value);
    if (v > 0 && v < 100) { estado.corte = v / 100; desenharTudo(); }
  });
  $('escala').addEventListener('change', (ev) => { estado.escala = Number(ev.target.value); desenharTudo(); });
  $('nomes').addEventListener('click', (ev) => {
    estado.esconder = !estado.esconder;
    ev.currentTarget.setAttribute('aria-pressed', String(estado.esconder));
    desenharTudo();
  });
  $('tabela-colunas').addEventListener('input', (ev) => {
    const alvo = ev.target, i = Number(alvo.dataset.i), c = estado.colunas[i];
    if (!c) return;
    if (alvo.dataset.campo === 'usar') c.usar = alvo.checked;
    else if (alvo.dataset.campo === 'vale') { const v = num(alvo.value); if (!(v > 0)) return; c.vale = v; }
    else if (alvo.dataset.campo === 'hab') {
      c.hab = alvo.value.trim().toUpperCase();
      const h = HAB[c.hab];
      alvo.nextElementSibling.textContent = h ? h[0] : (c.hab ? 'Código fora das páginas BNCC em dados' : '');
    }
    $('msg').textContent = '';
    desenharTudo();
  });
  $('mapa').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-ord]');
    if (!b) return;
    const col = b.dataset.ord === 'media' || b.dataset.ord === 'nome' ? b.dataset.ord : Number(b.dataset.ord);
    estado.ordem = estado.ordem.col === col ? { col, dir: -estado.ordem.dir } : { col, dir: 1 };
    desenharMapa(estado.calc);
  });
  $('imprimir').addEventListener('click', () => window.print());
  $('baixar').addEventListener('click', () => {
    const r = estado.calc;
    if (!r) return;
    const f = (p) => (p == null ? '' : fmt(p));
    const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    const linhas = [['Aluno', 'Média', 'Avaliações sem nota'].concat(r.cols.map((c) => c.titulo)).map(q).join(';')];
    r.alunos.forEach((x) => linhas.push([q(nomeDe(x.a)), f(x.media), x.faltam].concat(x.notas.map(f)).join(';')));
    linhas.push([q('Média da turma'), f(r.mediaTurma), ''].concat(r.porCol.map((p) => f(p.media))).join(';'));
    linhas.push([q('% abaixo da média para aprovação'), '', ''].concat(r.porCol.map((p) => Math.round(p.abaixo * 100))).join(';'));
    linhas.push([q('Habilidade'), '', ''].concat(r.cols.map((c) => q(c.hab))).join(';'));
    const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'resumo-notas-da-turma.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  let espera = null;
  window.addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(() => { if (estado.calc) { desenharDistribuicao(estado.calc); desenharHabilidades(estado.calc); } }, 150);
  });
  window.addEventListener('beforeprint', () => { if (estado.calc) { desenharDistribuicao(estado.calc); desenharHabilidades(estado.calc); } });

  $('theme-btn').addEventListener('click', () => {
    const root = document.documentElement;
    const escuro = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = escuro ? 'light' : 'dark';
    try { localStorage.setItem('iapraprof:theme', JSON.stringify(root.dataset.theme)); } catch (e) {}
  });

  // ---------- Turma de exemplo (nomes fictícios, notas sorteadas) ----------
  function exemplo() {
    let s = 20261104;
    const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    const normal = () => { let t = 0; for (let i = 0; i < 6; i++) t += rnd(); return (t - 3) / Math.sqrt(0.5); };
    const nomes = ['Ana Clara', 'Arthur', 'Beatriz', 'Bernardo', 'Camila', 'Davi', 'Eduarda', 'Enzo', 'Gabriel', 'Giovana', 'Heitor', 'Isabela', 'João Pedro', 'Lívia', 'Kauã', 'Laura', 'Lorenzo', 'Luiza', 'Manuela', 'Matheus', 'Miguel', 'Nicole', 'Pedro Henrique', 'Rafaela', 'Samuel', 'Valentina', 'Vitor'];
    const cols = [
      ['EF07CO01 Prova', 10, 0.78], ['EF07CO02 Algoritmos', 10, 0.62], ['EF07CO03 Projeto Scratch', 10, 0.84],
      ['EF07CO04 Programação', 10, 0.55], ['EF07CO05 Redes (3)', 3, 0.74], ['EF07CO09 Uso seguro', 10, 0.86]
    ];
    const linhas = [['Aluno'].concat(cols.map((c) => c[0])).concat(['Média']).join(';')];
    nomes.forEach((n) => {
      const hab = normal() * 0.14;
      const vals = cols.map((c) => {
        if (rnd() < 0.04) return 'F';
        const p = Math.max(0.05, Math.min(1, c[2] + hab + normal() * 0.1));
        return (Math.round(p * c[1] * 2) / 2).toLocaleString('pt-BR');
      });
      const nums = vals.map((v, k) => (v === 'F' ? null : num(v) / cols[k][1])).filter((v) => v != null);
      linhas.push([n].concat(vals).concat([(media(nums) * 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 })]).join(';'));
    });
    return linhas.join('\n');
  }
})();
