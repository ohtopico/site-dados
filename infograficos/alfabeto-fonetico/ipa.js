/* Os sons das línguas: quadro do Alfabeto Fonético Internacional com som e famílias.
   Dados em dados.js (window.DADOS_IPA), gerados por _fonte/alfabeto-fonetico/gerar.py. */
(function () {
  const D = window.DADOS_IPA, M = D.meta;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nf = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const pct = (a, b) => b ? 100 * a / b : 0;
  const pctTxt = (a, b) => { const p = pct(a, b); return (p > 0 && p < 1 ? '<1' : nf(Math.round(p))) + '%'; };
  const svgEl = (tag, attrs = {}, pai) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (pai) pai.appendChild(e); return e; };
  const PAG_FAMILIAS = '../familias-de-linguas/';
  const linkFam = id => PAG_FAMILIAS + '#' + id;
  const SIMB = D.simbolos;
  const POR_S = Object.fromEntries(SIMB.map(s => [s.s, s]));
  const FAM = D.familias; // [id, nome, nº de línguas]

  // ---------- Estado ----------
  let familia = -1;   // índice da família escolhida, ou -1 para todas as línguas
  let atual = null;   // símbolo selecionado
  const total = () => familia < 0 ? M.linguas : FAM[familia][2];
  const conta = s => {
    if (familia < 0) return s.n;
    const f = s.fam.find(x => x[0] === familia);
    return f ? f[1] : 0;
  };
  const nivel = s => {
    const c = conta(s); if (!c) return 0;
    const p = pct(c, total());
    return p <= 2 ? 1 : p <= 10 ? 2 : p <= 30 ? 3 : p <= 60 ? 4 : 5;
  };
  const FAIXAS = ['nenhuma', 'até 2%', '2 a 10%', '10 a 30%', '30 a 60%', 'mais de 60%'];

  // ---------- Resumo ----------
  const comuns = [...SIMB].sort((a, b) => b.n - a.n);
  const pt = SIMB.filter(s => s.pt === 'sim').length;
  $('resumo').innerHTML = [
    [nf(M.linguas), 'línguas com inventário de sons no PHOIBLE'],
    [nf(M.familias), 'famílias de línguas (contando as isoladas como um grupo)'],
    [nf(SIMB.length), 'símbolos do quadro do IPA, ' + SIMB.filter(s => s.som).length + ' com gravação'],
    [comuns[0].s + ' ' + pctTxt(comuns[0].n, M.linguas), 'o som mais comum: ' + comuns[0].nome],
    [nf(pt), 'sons do quadro que são fonemas do português do Brasil'],
  ].map(([b, t]) => `<div><b>${esc(b)}</b><span>${esc(t)}</span></div>`).join('');

  // ---------- Controles ----------
  const sel = $('familia');
  const ordem = FAM.map((f, i) => i).sort((a, b) => FAM[b][2] - FAM[a][2]);
  sel.innerHTML = '<option value="-1">Todas as línguas (' + nf(M.linguas) + ')</option>' +
    ordem.filter(i => FAM[i][2] >= 3).map(i => `<option value="${i}">${esc(FAM[i][1])} (${FAM[i][2]} línguas)</option>`).join('');
  sel.addEventListener('change', () => { familia = +sel.value; pintar(); if (atual) mostrar(atual, false); escrevHash(); });
  $('escala').innerHTML = FAIXAS.map((f, i) => `<span><b class="q${i}"></b>${f}</span>`).join('') +
    '<span><b class="vz"></b>articulação impossível</span>' +
    '<span class="nota-pt"><i></i>fonema do português</span>';
  const btnPt = $('so-pt');
  btnPt.addEventListener('click', () => {
    const on = btnPt.getAttribute('aria-pressed') !== 'true';
    btnPt.setAttribute('aria-pressed', String(on));
    $('graficos').classList.toggle('ocultar-nao-pt', on);
  });

  // ---------- Quadro das consoantes ----------
  const botoes = []; // [símbolo, elemento]
  function botao(s) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'som-btn' + (s.pt === 'sim' ? ' pt' : '');
    b.textContent = s.s; b.lang = 'und-fonipa';
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => { mostrar(s, true); });
    botoes.push([s, b]);
    return b;
  }
  (function quadro() {
    const t = $('t-consoantes');
    const L = D.lugares, nL = L.length;
    const imposs = new Set(D.impossiveis.map(x => x.join(',')));
    let h = '<colgroup><col style="width:96px">' + '<col>'.repeat(nL * 2) + '</colgroup><thead><tr><th></th>' + L.map(l => `<th colspan="2">${esc(l)}</th>`).join('') + '</tr></thead><tbody>';
    t.innerHTML = h + '</tbody>';
    const tb = t.querySelector('tbody');
    D.modos.forEach((modo, mi) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<th scope="row">${esc(modo)}</th>`;
      const daLinha = SIMB.filter(s => s.tipo === 'c' && s.modo === mi);
      const largo = daLinha.some(s => s.larg === 3);
      for (let li = 0; li < nL; li++) {
        if (largo && li >= 2 && li <= 4) {
          if (li !== 2) continue;
          for (const v of [0, 1]) {
            const td = document.createElement('td'); td.colSpan = 3;
            const s = daLinha.find(x => x.lugar === 2 && x.sonora === v);
            if (s) td.appendChild(botao(s));
            tr.appendChild(td);
          }
          continue;
        }
        for (const v of [0, 1]) {
          const td = document.createElement('td');
          const s = daLinha.find(x => x.lugar === li && x.sonora === v);
          if (s) td.appendChild(botao(s));
          else if (imposs.has([mi, li, v].join(','))) { td.className = 'vz'; td.title = 'Articulação considerada impossível'; }
          tr.appendChild(td);
        }
      }
      tb.appendChild(tr);
    });
  })();

  // ---------- Trapézio das vogais ----------
  const vgs = []; // [símbolo, grupo svg]
  (function trapezio() {
    const svg = $('g-vogais');
    const W = 660, H = 400, x0 = 150, x1 = 600, y0 = 46, y1 = 370, recuo = (x1 - x0) * 0.42;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const xf = h => x0 + recuo * (h / 6);       // borda anterior (inclinada)
    const y = h => y0 + (y1 - y0) * (h / 6);
    const xPos = (h, p) => xf(h) + (x1 - xf(h)) * (p / 2);
    svgEl('path', { class: 'linha', d: `M${xf(0)},${y(0)} L${x1},${y(0)} L${x1},${y(6)} L${xf(6)},${y(6)} Z` }, svg);
    [2, 4].forEach(h => svgEl('line', { class: 'linha', x1: xf(h), y1: y(h), x2: x1, y2: y(h) }, svg));
    svgEl('line', { class: 'linha', x1: xPos(0, 1), y1: y(0), x2: xPos(6, 1), y2: y(6) }, svg);
    D.posicoes.forEach((p, i) => { const t = svgEl('text', { class: 'rot', x: xPos(0, i), y: 24, 'text-anchor': 'middle' }, svg); t.textContent = p; });
    ['Fechada', 'Meio fechada', 'Meio aberta', 'Aberta'].forEach(r => {
      const h = D.alturas.indexOf(r);
      const t = svgEl('text', { class: 'rot', x: xf(h) - 44, y: y(h) + 4, 'text-anchor': 'end' }, svg); t.textContent = r;
    });
    SIMB.filter(s => s.tipo === 'v').forEach(s => {
      const par = SIMB.some(o => o.tipo === 'v' && o !== s && o.alt === s.alt && o.pos === s.pos);
      const dx = par ? (s.arr ? 19 : -19) : 0;
      const cx = xPos(s.alt, s.pos) + dx + (s.pos === 0 && !par ? 0 : 0), cy = y(s.alt);
      const g = svgEl('g', { class: 'vg' + (s.pt === 'sim' ? ' pt' : ''), tabindex: '0', role: 'button', 'aria-label': `${s.s}, ${s.nome}` }, svg);
      svgEl('circle', { cx, cy, r: 17 }, g);
      if (s.pt === 'sim') svgEl('circle', { class: 'anel', cx, cy, r: 21.5 }, g);
      const t = svgEl('text', { x: cx, y: cy + 6, 'text-anchor': 'middle' }, g); t.textContent = s.s;
      g.addEventListener('click', () => mostrar(s, true));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mostrar(s, true); } });
      vgs.push([s, g]);
    });
  })();

  // ---------- Outros símbolos ----------
  (function outros() {
    const box = $('outros');
    const grupos = [...new Set(SIMB.filter(s => s.tipo === 'o').map(s => s.grupo))];
    grupos.forEach(g => {
      const d = document.createElement('div');
      d.innerHTML = `<h3>${esc(g)}</h3><div class="linha-sons"></div>`;
      const l = d.querySelector('.linha-sons');
      SIMB.filter(s => s.grupo === g).forEach(s => l.appendChild(botao(s)));
      box.appendChild(d);
    });
  })();

  // ---------- Cores ----------
  function pintar() {
    botoes.forEach(([s, b]) => {
      b.className = b.className.replace(/\bq\d\b/g, '').trim() + ' q' + nivel(s);
      b.title = `${s.s}: ${s.nome}, em ${nf(conta(s))} de ${nf(total())} línguas (${pctTxt(conta(s), total())})`;
    });
    vgs.forEach(([s, g]) => {
      const q = nivel(s);
      g.querySelector('circle').setAttribute('class', 'q' + q);
      g.querySelector('text').setAttribute('class', q >= 4 ? 't-escuro' : 't-claro');
      g.setAttribute('aria-label', `${s.s}, ${s.nome}, em ${pctTxt(conta(s), total())} das línguas`);
    });
    $('escopo').textContent = familia < 0
      ? `Cor: em quantas das ${nf(M.linguas)} línguas o som aparece.`
      : `Cor: em quantas das ${nf(FAM[familia][2])} línguas da família ${FAM[familia][1]} o som aparece.`;
  }

  // ---------- Som ----------
  const audio = new Audio();
  audio.preload = 'none';
  function tocar(s) {
    if (!s.som) return;
    try { audio.pause(); audio.src = s.som; audio.currentTime = 0; const p = audio.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  }

  // ---------- Painel ----------
  const painel = $('painel');
  const PT_TXT = { sim: 'Fonema do português do Brasil', variante: 'Aparece em alguns sotaques do português' };
  const ICONE_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.5v13l11-6.5z"/></svg>';
  function mostrar(s, comSom) {
    atual = s;
    botoes.forEach(([x, b]) => b.setAttribute('aria-pressed', String(x === s)));
    vgs.forEach(([x, g]) => g.classList.toggle('sel', x === s));
    const c = conta(s), T = total();
    const nFam = s.fam.length;
    let h = `<div class="cabeca"><div class="simbolo" lang="und-fonipa">${esc(s.s)}</div><div><h3>${esc(s.nome[0].toUpperCase() + s.nome.slice(1))}</h3>` +
      (PT_TXT[s.pt] ? `<span class="selo">${PT_TXT[s.pt]}</span>` : '') + '</div></div>';
    h += s.som ? `<p><button class="btn-ouvir" type="button" id="ouvir">${ICONE_PLAY}Ouvir</button></p>`
      : '<p><button class="btn-ouvir" type="button" disabled>Sem gravação</button></p>';
    if (s.ex) h += `<p>${esc(s.ex[0].toUpperCase() + s.ex.slice(1))}.</p>`;
    if (familia >= 0) {
      h += `<p><span class="numero-grande">${pctTxt(c, T)}</span><br>das ${nf(T)} línguas da família <a href="${linkFam(FAM[familia][0])}">${esc(FAM[familia][1])}</a> têm este som (${nf(c)}).</p>`;
    }
    h += `<p>${familia >= 0 ? '' : `<span class="numero-grande">${pctTxt(s.n, M.linguas)}</span><br>`}Presente em ${nf(s.n)} das ${nf(M.linguas)} línguas, de ${nf(nFam)} ${nFam === 1 ? 'família' : 'famílias'}.</p>`;
    if (s.fam.length) {
      h += '<h4>Famílias em que mais aparece</h4><ul class="barras-fam">' + s.fam.slice(0, 10).map(([fi, n]) => {
        const f = FAM[fi];
        return `<li><a href="${linkFam(f[0])}">${esc(f[1])}</a><span class="qtd">${n} de ${f[2]} (${pctTxt(n, f[2])})</span><span class="trilho"><i style="width:${pct(n, f[2]).toFixed(1)}%"></i></span></li>`;
      }).join('') + '</ul>';
      if (s.fam.length > 10) h += `<p class="nota">E mais ${s.fam.length - 10} ${s.fam.length - 10 === 1 ? 'família' : 'famílias'}.</p>`;
      h += '<h4>Por região do mundo</h4><ul class="barras-fam">' + M.areas.map((a, i) =>
        `<li><span>${esc(a)}</span><span class="qtd">${pctTxt(s.area[i], M.areaTotal[i])}</span><span class="trilho"><i style="width:${pct(s.area[i], M.areaTotal[i]).toFixed(1)}%"></i></span></li>`).join('') + '</ul>';
    } else {
      h += '<p class="nota">Nenhuma língua do PHOIBLE tem este som como fonema. Ele aparece no quadro porque é possível de produzir.</p>';
    }
    if (s.linguas.length) h += `<h4>Algumas línguas que têm este som</h4><p>${s.linguas.map(esc).join(', ')}.</p>`;
    if (s.var.length) h += '<h4>Sons parecidos, com o mesmo símbolo de base</h4><div class="chips-var">' +
      s.var.map(([v, n]) => `<span><b lang="und-fonipa">${esc(v)}</b> ${nf(n)}</span>`).join('') + '</div><p class="nota">Número de inventários com cada forma, por exemplo com aspiração (ʰ) ou alongamento (ː).</p>';
    if (s.commons) h += `<p class="credito">Gravação: <a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(s.commons.replace(/ /g, '_'))}">${esc(s.commons)}</a>, Wikimedia Commons, licença CC BY-SA 3.0.</p>`;
    painel.innerHTML = h;
    const ouvir = $('ouvir');
    if (ouvir) ouvir.addEventListener('click', () => tocar(s));
    if (comSom) tocar(s);
    // Em telas estreitas o painel vai para logo depois do gráfico clicado.
    if (comSom && !matchMedia('(min-width: 1100px)').matches) {
      const alvo = s.tipo === 'c' ? $('j-consoantes') : s.tipo === 'v' ? $('j-vogais') : $('j-outros');
      const caixa = $('painel-caixa');
      if (alvo.nextElementSibling !== caixa) alvo.after(caixa);
      caixa.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    escrevHash();
  }

  // ---------- Link direto: #som=ʃ&familia=indo1319 ----------
  function escrevHash() {
    const p = [];
    if (atual) p.push('som=' + encodeURIComponent(atual.s));
    if (familia >= 0) p.push('familia=' + FAM[familia][0]);
    try { history.replaceState(null, '', p.length ? '#' + p.join('&') : location.pathname + location.search); } catch (e) {}
  }
  function lerHash() {
    const q = new URLSearchParams(location.hash.slice(1));
    const f = q.get('familia');
    if (f) { const i = FAM.findIndex(x => x[0] === f); if (i >= 0) { familia = i; if (![...sel.options].some(o => +o.value === i)) sel.insertAdjacentHTML('beforeend', `<option value="${i}">${esc(FAM[i][1])} (${FAM[i][2]})</option>`); sel.value = String(i); } }
    const s = q.get('som');
    return s && POR_S[s] ? POR_S[s] : null;
  }

  // ---------- Ranking ----------
  function ranking(id, lista) {
    const svg = $(id);
    const W = 520, lh = 26, top = 6, esq = 44, dir = 120;
    svg.setAttribute('viewBox', `0 0 ${W} ${top + lista.length * lh + 4}`);
    const max = Math.max(...lista.map(s => s.n), 1);
    lista.forEach((s, i) => {
      const y = top + i * lh;
      const g = svgEl('g', { class: 'lin', tabindex: '0', role: 'button', 'aria-label': `${s.s}, ${s.nome}: ${pctTxt(s.n, M.linguas)} das línguas` }, svg);
      const t = svgEl('text', { class: 'sim', x: esq - 10, y: y + 17, 'text-anchor': 'end' }, g); t.textContent = s.s;
      const w = Math.max(2, (W - esq - dir) * s.n / max);
      svgEl('rect', { class: 'barra' + (s.pt === 'sim' ? ' pt' : ''), x: esq, y: y + 4, width: w, height: lh - 9, rx: 4 }, g);
      const v = svgEl('text', { x: esq + w + 6, y: y + 16 }, g); v.textContent = pct(s.n, M.linguas) < 1 ? `${s.n} ${s.n === 1 ? 'língua' : 'línguas'}` : `${pctTxt(s.n, M.linguas)} · ${s.nome.split(' ')[0]}`;
      g.addEventListener('click', () => { mostrar(s, true); });
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mostrar(s, true); } });
    });
  }
  ranking('g-comuns', comuns.slice(0, 15));
  ranking('g-raros', comuns.filter(s => s.n > 0).slice(-15).reverse());

  // ---------- Transcrição ----------
  (function transcricao() {
    const T = window.TranscreverIPA; if (!T) return;
    const txt = $('tr-texto'), idi = $('tr-idioma'), saida = $('tr-saida'), pal = $('tr-palavras'), nota = $('tr-nota');
    const EXEMPLOS = { pt: 'Os sons das línguas do mundo', es: 'Los sonidos de las lenguas del mundo', it: 'I suoni delle lingue del mondo', de: 'Die Laute der Sprachen der Welt', en: 'The sounds of the languages of the world' };
    const MAIS = window.TranscreverIPA_MAIS || { EXEMPLOS: {}, DICAS: {} };
    Object.assign(EXEMPLOS, MAIS.EXEMPLOS);
    const NOMES_IDI = Object.fromEntries(T.IDIOMAS);
    const GRUPOS = [
      ['Europa', ['pt', 'es', 'it', 'de', 'en', 'tr']],
      ['Línguas indígenas da América do Sul', ['tupi', 'gn']],
      ['Ásia', ['zh', 'ja', 'ko']],
      ['África e Oriente Médio', ['ar', 'sw', 'yo']],
    ];
    idi.innerHTML = GRUPOS.map(([g, ids]) => `<optgroup label="${esc(g)}">` +
      ids.filter(id => NOMES_IDI[id]).map(id => `<option value="${id}">${esc(NOMES_IDI[id])}</option>`).join('') + '</optgroup>').join('');
    const MOD = /[̀-ͯʰ-˿ː]/; // diacríticos e modificadores que acompanham o símbolo
    function simbolos(ipa) {
      const out = []; // [texto, símbolo do quadro ou null]
      for (let i = 0; i < ipa.length;) {
        let s = null, n = 1;
        if (POR_S[ipa.slice(i, i + 2)]) { s = POR_S[ipa.slice(i, i + 2)]; n = 2; }
        else if (POR_S[ipa[i]]) s = POR_S[ipa[i]];
        let txt = ipa.slice(i, i + n); i += n;
        if (s || /\p{L}/u.test(txt)) while (i < ipa.length && MOD.test(ipa[i]) && !'ˈˌ'.includes(ipa[i])) { txt += ipa[i]; i++; }
        out.push([txt, s]);
      }
      return out;
    }
    function html(ipa) {
      return simbolos(ipa).map(([t, s]) => s
        ? `<button type="button" class="tr-som" data-s="${esc(s.s)}" title="${esc(s.s + ': ' + s.nome)}">${esc(t)}</button>`
        : `<span>${esc(t)}</span>`).join('');
    }
    let fila = [], seq = 0;
    async function atualizar() {
      const n = ++seq, lang = idi.value;
      if (lang === 'en') nota.textContent = 'Carregando o dicionário de inglês...';
      let r;
      try { r = await T.transcrever(txt.value, lang); } catch (e) { nota.textContent = 'Não foi possível transcrever agora.'; return; }
      if (n !== seq) return;
      const pals = r.filter(x => !x.sep);
      const linha = r.map(x => x.sep ? (x.ipa.trim() ? ' ' : ' ') : (x.falta ? '?' : x.ipa)).join('').replace(/ +/g, ' ').trim();
      const ws = linha.split(' ');
      saida.innerHTML = linha ? ws.map((w, k) => '<span class="tr-w">' + (k === 0 ? '<span class="tr-barra">[</span>' : '') + html(w) + (k === ws.length - 1 ? '<span class="tr-barra">]</span>' : '') + '</span>').join(' ') : '';
      pal.innerHTML = pals.map(x => `<div class="tr-pal"><span class="tr-orig">${esc(x.orig)}</span><span class="tr-ipa">${x.falta ? '<span title="Palavra fora do dicionário">?</span>' : html(x.ipa)}</span></div>`).join('');
      fila = simbolos(pals.map(x => x.ipa || '').join(' ')).filter(x => x[1] && x[1].som).map(x => x[1]);
      const faltam = pals.filter(x => x.falta).length;
      nota.textContent = (faltam ? `${faltam} ${faltam === 1 ? 'palavra não pôde' : 'palavras não puderam'} ser lidas (aparecem com ?). ` : '') +
        (MAIS.DICAS[lang] ? MAIS.DICAS[lang] + ' ' : '') +
        'Transcrição aproximada, feita por regras' + (lang === 'en' ? ' e pelo dicionário CMUdict' : '') + '.' + (['zh', 'yo', 'ar', 'ja', 'ko'].includes(lang) ? '' : ' O sinal ˈ marca a sílaba tônica.');
      try { history.replaceState(null, '', '?' + new URLSearchParams({ texto: txt.value, idioma: lang }) + location.hash); } catch (e) {}
    }
    let espera;
    txt.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(atualizar, 200); });
    idi.addEventListener('change', () => {
      if (Object.values(EXEMPLOS).includes(txt.value) || !txt.value.trim()) txt.value = EXEMPLOS[idi.value];
      atualizar();
    });
    $('transcrever').addEventListener('click', e => {
      const b = e.target.closest('.tr-som'); if (!b) return;
      const s = POR_S[b.dataset.s];
      tocar(s); mostrar(s, false);
      $('transcrever').querySelectorAll('.tr-som').forEach(x => x.classList.toggle('on', x.dataset.s === s.s));
    });
    $('tr-ouvir').addEventListener('click', () => {
      let k = 0;
      const prox = () => {
        if (k >= fila.length) { audio.onended = null; return; }
        const s = fila[k++];
        $('transcrever').querySelectorAll('.tr-som').forEach(x => x.classList.toggle('on', x.dataset.s === s.s));
        audio.onended = () => setTimeout(prox, 120);
        tocar(s);
      };
      prox();
    });
    try {
      const q = new URLSearchParams(location.search);
      if (q.get('idioma') && T.IDIOMAS.some(x => x[0] === q.get('idioma'))) idi.value = q.get('idioma');
      if (q.get('texto')) txt.value = q.get('texto').slice(0, 500);
    } catch (e) {}
    atualizar();
  })();

  // ---------- Início ----------
  const inicial = lerHash();
  pintar();
  mostrar(inicial || POR_S['ʃ'], false);

  $('theme-btn').addEventListener('click', () => {
    const root = document.documentElement;
    const escuro = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = escuro ? 'light' : 'dark';
    try { localStorage.setItem('iapraprof:theme', JSON.stringify(root.dataset.theme)); } catch (e) {}
  });
})();
