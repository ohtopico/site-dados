/* BNCC em dados: rede de progressão, eixos, verbos, material e lista. Compartilhado pelas páginas
   de Computação, Matemática e Arte; cada uma traz seus dados em dados.js (window.BNCC). */
(function () {
  const D = window.BNCC, C = D.config;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const ANOS = C.anos.map(a => a[0]);
  const NOMES = Object.fromEntries(C.anos);
  const anoNome = a => NOMES[a];
  const EIXOS = Object.fromEntries(C.eixos);
  const COR = Object.fromEntries(C.eixos.map((e, i) => [e[0], 'e' + i]));
  const ETAPA = C.passo === 'etapa';
  const ANTERIOR = ETAPA ? 'etapa anterior' : 'ano anterior', SEGUINTE = ETAPA ? 'etapa seguinte' : 'ano seguinte';
  const NO = Object.fromEntries(C.anos.map(a => [a[0], a[2] || 'no ' + a[1]]));
  const no = a => NO[a];
  const PERIODO = C.periodo;
  const TIPOS = { jogo: ['jogo', 'jogos'], plano: ['plano de aula', 'planos de aula'], ficha: ['ficha', 'fichas'], '3d': ['recurso 3D', 'recursos 3D'], adaptada: ['ficha adaptada', 'fichas adaptadas'], revisao: ['ficha de revisão', 'fichas de revisão'] };
  const H = Object.fromEntries(D.habilidades.map(h => [h.codigo, h]));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const el = (tag, attrs = {}, pai) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (pai) pai.appendChild(e); return e; };
  const entra = c => D.ligacoes.filter(l => l.para === c);
  const sai = c => D.ligacoes.filter(l => l.de === c);
  const nf = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  // tooltip
  const tip = $('tip-g');
  function mostrarTip(e, html) { tip.innerHTML = html; tip.style.opacity = 1; tip.style.left = Math.min(e.clientX + 14, innerWidth - 270) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; }
  const esconderTip = () => { tip.style.opacity = 0; };

  // ---------- Resumo ----------
  const semAntes = D.habilidades.filter(h => h.ano !== ANOS[0] && !entra(h.codigo).length);
  const comMaterial = D.habilidades.filter(h => h.recursos.length).length;
  const verbos = {};
  D.habilidades.forEach(h => { verbos[h.verbo] = (verbos[h.verbo] || 0) + 1; });
  const verboTop = Object.entries(verbos).sort((a, b) => b[1] - a[1])[0];
  $('resumo').innerHTML = [
    [D.habilidades.length, `habilidades de ${C.disciplina} ${PERIODO}`],
    [D.ligacoes.length, ETAPA ? 'ligações de conteúdo entre as duas etapas' : 'ligações de conteúdo entre anos seguidos'],
    [semAntes.length, `${semAntes.length === 1 ? 'habilidade que começa' : 'habilidades que começam'} um assunto novo (sem ligação com a ${ANTERIOR})`.replace('a ano', 'o ano')],
    [verboTop[0], `é o verbo mais usado, em ${verboTop[1]} habilidades`],
    C.material ? [comMaterial, 'habilidades com pelo menos um material gratuito pronto'] : [C.eixos.length, C.termoEixos]
  ].map(([n, t]) => `<div><b>${esc(n)}</b><span>${esc(t)}</span></div>`).join('');

  // ---------- Filtro compartilhado com a lista ----------
  let filtro = null; // { texto, teste }
  function filtrar(texto, teste, rolar = true) {
    filtro = { texto, teste };
    $('busca').value = '';
    desenharLista();
    if (rolar) $('t-lista').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  // ---------- Rede de progressão ----------
  const svg = $('g-rede');
  const W = ANOS.length <= 2 ? 620 : Math.max(960, ANOS.length * 118), colW = W / ANOS.length, boxW = 104, boxH = 22, gap = 6, topo = 40;
  svg.style.minWidth = Math.round(W * 0.78) + 'px';
  if (W < 900) { svg.style.maxWidth = Math.round(W * 1.15) + 'px'; svg.style.margin = '0 auto'; svg.style.display = 'block'; }
  const maxN = Math.max(...ANOS.map(a => D.habilidades.filter(h => h.ano === a).length));
  const HH = topo + maxN * (boxH + gap) + 10;
  svg.setAttribute('viewBox', `0 0 ${W} ${HH}`);
  const pos = {};
  const ordemEixo = Object.fromEntries(C.eixos.map((e, i) => [e[0], i]));
  ANOS.forEach((a, i) => {
    const t = el('text', { x: i * colW + colW / 2, y: 22, 'text-anchor': 'middle', class: 'ano-titulo' }, svg);
    t.textContent = anoNome(a);
    const lista = D.habilidades.filter(h => h.ano === a).sort((x, y) => ordemEixo[x.eixo] - ordemEixo[y.eixo] || x.codigo.localeCompare(y.codigo));
    const altura = lista.length * (boxH + gap);
    const y0 = topo + (maxN * (boxH + gap) - altura) / 2;
    lista.forEach((h, j) => { pos[h.codigo] = { x: i * colW + (colW - boxW) / 2, y: y0 + j * (boxH + gap) }; });
  });
  const gLig = el('g', {}, svg), gNos = el('g', {}, svg);
  const ligEls = D.ligacoes.map(l => {
    const a = pos[l.de], b = pos[l.para];
    const x1 = a.x + boxW, y1 = a.y + boxH / 2, x2 = b.x, y2 = b.y + boxH / 2, mx = (x1 + x2) / 2;
    const p = el('path', { d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, class: 'lig', 'stroke-width': (1 + l.peso * 4).toFixed(2) }, gLig);
    p.dataset.de = l.de; p.dataset.para = l.para;
    return p;
  });
  const noEls = {};
  D.habilidades.forEach(h => {
    const p = pos[h.codigo];
    const g = el('g', { class: 'no', tabindex: 0, role: 'button', 'aria-label': `${h.codigo}, ${h.objeto}, ${anoNome(h.ano)}` }, gNos);
    el('rect', { x: p.x, y: p.y, width: boxW, height: boxH, rx: 7, class: 'eixo-' + COR[h.eixo] }, g);
    const t = el('text', { x: p.x + boxW / 2, y: p.y + boxH / 2 + 4, 'text-anchor': 'middle' }, g);
    t.textContent = h.codigo;
    g.addEventListener('mousemove', e => mostrarTip(e, `<b>${h.codigo}</b> · ${esc(h.objeto)}<br>${esc(EIXOS[h.eixo])}`));
    g.addEventListener('mouseleave', esconderTip);
    g.addEventListener('click', () => selecionar(h.codigo));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selecionar(h.codigo); } });
    noEls[h.codigo] = g;
  });

  // Trilha: as ligações diretas e, a partir delas, só a ligação mais forte de cada passo
  // (com muitos anos, seguir todas as ligações acenderia quase a rede inteira).
  function trilha(c) {
    const antes = new Set(), depois = new Set();
    const forte = ls => ls.length ? [ls.reduce((m, l) => l.peso > m.peso ? l : m)] : [];
    const ir = (x, f, set, nivel = 0) => (nivel && C.trilhaForte ? forte(f(x)) : f(x)).forEach(l => { const y = f === entra ? l.de : l.para; if (!set.has(y)) { set.add(y); ir(y, f, set, nivel + 1); } });
    ir(c, entra, antes); ir(c, sai, depois);
    return { antes, depois };
  }
  function destacar(conj) {
    svg.classList.add('foco');
    Object.entries(noEls).forEach(([c, g]) => g.classList.toggle('on', conj.has(c)));
    ligEls.forEach(p => p.classList.toggle('on', conj.has(p.dataset.de) && conj.has(p.dataset.para)));
  }
  function limparDestaque() {
    svg.classList.remove('foco');
    Object.values(noEls).forEach(g => g.classList.remove('on', 'sel'));
    ligEls.forEach(p => p.classList.remove('on'));
  }

  function codBtn(c) { return `<button type="button" class="cod" data-cod="${c}" title="${esc(H[c].objeto)}">${c}</button>`; }
  function selecionar(c) {
    marcarFio(null);
    const h = H[c];
    const { antes, depois } = trilha(c);
    const conj = new Set([c, ...antes, ...depois]);
    destacar(conj);
    Object.values(noEls).forEach(g => g.classList.remove('sel'));
    noEls[c].classList.add('sel');
    const porAno = ANOS.map(a => [...conj].filter(x => H[x].ano === a).sort()).filter(l => l.length);
    const motivo = l => {
      const partes = [];
      if (l.palavras.length) partes.push('palavras em comum: ' + l.palavras.join(', '));
      if (l.materiais.length) partes.push(l.materiais.length + (l.materiais.length === 1 ? ' material trabalha as duas' : ' materiais trabalham as duas'));
      return partes.join('; ') || `mesmo ${C.termoEixo} e mesmo tema`;
    };
    const lista = (ls, campo) => ls.length ? '<ul>' + ls.map(l => `<li>${codBtn(l[campo])} ${esc(H[l[campo]].objeto)} <span class="muted">(${motivo(l)})</span></li>`).join('') + '</ul>' : '';
    const vem = entra(c), vai = sai(c);
    const rec = !C.material ? '' : h.recursos.length
      ? `${h.recursos.length} ${h.recursos.length === 1 ? C.material : C.materiais}.`
      : `Ainda sem ${C.material}.`;
    const link = h.link ? ` <a href="${h.link}">${esc(h.linkTexto || 'Ver planos, jogos e fichas de ' + c)}</a>` : '';
    $('detalhe').innerHTML = `
      <h3>${h.codigo} · ${esc(h.objeto)}</h3>
      <p class="muted">${anoNome(h.ano)} · ${esc(EIXOS[h.eixo])}</p>
      <p>${esc(h.texto)}</p>
      <p><b>Trilha:</b></p>
      <div class="trilha">${porAno.map(l => `<span><span class="muted">${anoNome(H[l[0]].ano)}:</span> ${l.map(codBtn).join(' ')}</span>`).join('<span class="seta" aria-hidden="true">→</span>')}</div>
      ${vem.length ? `<p><b>Vem de</b> (${ANTERIOR}):</p>` + lista(vem, 'de') : (h.ano === ANOS[0] ? '' : `<p><b>Começa aqui:</b> nenhuma habilidade da ${ANTERIOR} trata deste conteúdo.</p>`.replace('da ano', 'do ano'))}
      ${vai.length ? `<p><b>Continua em</b> (${SEGUINTE}):</p>` + lista(vai, 'para') : ''}
      ${rec || link ? `<p>${rec}${link}</p>` : ''}`;
    gtag('event', 'bncc_habilidade', { habilidade: c, disciplina: C.disciplina });
  }
  $('detalhe').addEventListener('click', e => { const b = e.target.closest('[data-cod]'); if (b) selecionar(b.dataset.cod); });

  // fios temáticos
  let fioAtual = null;
  const fiosBox = $('fios');
  function marcarFio(id) {
    fioAtual = id;
    fiosBox.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fio === String(id))));
  }
  const todos = document.createElement('button');
  todos.type = 'button'; todos.className = 'chip'; todos.textContent = 'Todos'; todos.dataset.fio = 'null';
  todos.addEventListener('click', () => { marcarFio(null); limparDestaque(); $('detalhe').innerHTML = '<p class="nota">Clique em uma habilidade para ver o texto, as ligações e a trilha.</p>'; });
  fiosBox.appendChild(todos);
  D.fios.forEach(f => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.fio = f.id;
    b.innerHTML = `${esc(f.nome)} <span class="muted">${f.habs.length}</span>`;
    b.addEventListener('click', () => {
      limparDestaque(); marcarFio(f.id); destacar(new Set(f.habs));
      const porAno = ANOS.map(a => f.habs.filter(c => H[c].ano === a).length);
      $('detalhe').innerHTML = `<h3>${esc(f.nome)}</h3><p>${f.habs.length} habilidades: ${porAno.map((n, i) => `${n} ${no(ANOS[i])}`).join(', ')}.</p>
        <div class="trilha">${ANOS.map(a => f.habs.filter(c => H[c].ano === a).map(codBtn).join(' ')).filter(Boolean).join('<span class="seta" aria-hidden="true">→</span>')}</div>
        <p><button type="button" class="chip" id="fio-lista">Ver as ${f.habs.length} habilidades na lista</button></p>`;
      $('fio-lista').addEventListener('click', () => filtrar(`Fio: ${f.nome}`, h => f.habs.includes(h.codigo)));
    });
    fiosBox.appendChild(b);
  });
  marcarFio(null);
  $('legenda-eixos').innerHTML = Object.entries(EIXOS).map(([k, n]) => `<span><b class="sw-${COR[k]}"></b>${n}</span>`).join('');

  // ---------- Mapa de calor eixo x ano ----------
  const tab = $('t-eixos');
  const cont = (e, a) => D.habilidades.filter(h => h.eixo === e && h.ano === a).length;
  const maxC = Math.max(...Object.keys(EIXOS).flatMap(e => ANOS.map(a => cont(e, a))));
  tab.innerHTML = `<thead><tr><th scope="col"></th>${ANOS.map(a => `<th scope="col">${anoNome(a)}</th>`).join('')}</tr></thead><tbody>` +
    Object.entries(EIXOS).map(([e, n]) => `<tr><th scope="row">${n}</th>${ANOS.map(a => {
      const c = cont(e, a), op = c ? .25 + .75 * c / maxC : 0;
      return `<td><button type="button" data-e="${e}" data-a="${a}" style="background: color-mix(in srgb, var(--${COR[e]}) ${Math.round(op * 70)}%, var(--paper))" aria-label="${c} habilidades de ${n} ${no(a)}">${c}</button></td>`;
    }).join('')}</tr>`).join('') + '</tbody>';
  tab.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const eixo = b.dataset.e, ano = +b.dataset.a;
    filtrar(`${EIXOS[eixo]} ${no(ano)}`, h => h.eixo === eixo && h.ano === ano);
  });

  // ---------- Verbos ----------
  (function () {
    const g = $('g-verbos');
    const lista = Object.entries(verbos).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 14);
    const lw = 130, bw = 560, lh = 28, Wv = lw + bw + 60, Hv = lista.length * lh + 10;
    g.setAttribute('viewBox', `0 0 ${Wv} ${Hv}`);
    const max = lista[0][1];
    lista.forEach(([v, n], i) => {
      const y = i * lh + 4;
      const habs = D.habilidades.filter(h => h.verbo === v);
      const t = el('text', { x: lw - 8, y: y + 17, 'text-anchor': 'end' }, g); t.textContent = v;
      let x = lw;
      C.eixos.map(x => x[0]).forEach(e => {
        const k = habs.filter(h => h.eixo === e).length; if (!k) return;
        const w = bw * k / max;
        const r = el('rect', { x, y, width: w, height: lh - 8, class: 'barra-' + COR[e], rx: 3, style: 'cursor:pointer' }, g);
        r.addEventListener('mousemove', ev => mostrarTip(ev, `<b>${esc(v)}</b>: ${k} em ${EIXOS[e]}`));
        r.addEventListener('mouseleave', esconderTip);
        r.addEventListener('click', () => filtrar(`Verbo: ${v}`, h => h.verbo === v));
        x += w;
      });
      const nt = el('text', { x: x + 6, y: y + 17, class: 'eixo' }, g); nt.textContent = n;
    });
  })();

  // ---------- Material por ano ----------
  if (!C.material) { const sec = $('g-material').closest('section'); if (sec) sec.classList.add('sec-oculta'); }
  else (function () {
    const g = $('g-material');
    const Wm = Math.max(700, ANOS.length * 100), Hm = 230, base = 190, bw = Math.min(90, (Wm - 80) / ANOS.length - 20);
    g.setAttribute('viewBox', `0 0 ${Wm} ${Hm}`);
    const medias = ANOS.map(a => { const hs = D.habilidades.filter(h => h.ano === a); return hs.reduce((s, h) => s + h.recursos.length, 0) / hs.length; });
    const max = Math.max(...medias) || 1;
    ANOS.forEach((a, i) => {
      const x = 40 + i * (Wm - 80) / ANOS.length + 10, h = (base - 30) * medias[i] / max;
      const r = el('rect', { x, y: base - h, width: bw, height: Math.max(h, 1), rx: 6, class: 'barra-e0', style: 'cursor:pointer' }, g);
      r.addEventListener('mousemove', ev => mostrarTip(ev, `<b>${anoNome(a)}</b>: ${nf(medias[i])} materiais por habilidade`));
      r.addEventListener('mouseleave', esconderTip);
      r.addEventListener('click', () => filtrar(anoNome(a), h => h.ano === a));
      const v = el('text', { x: x + bw / 2, y: base - h - 8, 'text-anchor': 'middle', style: 'font-weight:700' }, g); v.textContent = nf(medias[i]);
      const l = el('text', { x: x + bw / 2, y: base + 20, 'text-anchor': 'middle', class: 'eixo' }, g); l.textContent = anoNome(a);
    });
    const iMax = medias.indexOf(Math.max(...medias)), iMin = medias.indexOf(Math.min(...medias));
    const semNada = D.habilidades.filter(h => !h.recursos.length).length;
    $('material-texto').textContent = `O ${anoNome(ANOS[iMax])} tem mais material por habilidade (${nf(medias[iMax])} em média) e o ${anoNome(ANOS[iMin])} tem menos (${nf(medias[iMin])}). ${semNada ? semNada + ' habilidades ainda não têm nenhum material.' : 'Todas as habilidades têm pelo menos um material.'}`;
  })();

  // ---------- Lista ----------
  let mostrarTodas = false;
  function desenharLista() {
    const q = $('busca').value.trim().toLowerCase();
    let hs = D.habilidades;
    if (q) hs = hs.filter(h => (h.codigo + ' ' + h.objeto + ' ' + h.texto).toLowerCase().includes(q));
    else if (filtro) hs = hs.filter(filtro.teste);
    $('filtro-texto').textContent = q ? `${hs.length} habilidades com "${q}".` : filtro ? `${filtro.texto}: ${hs.length} habilidades.` : `${hs.length} habilidades, ${PERIODO}.`;
    const limite = !q && !filtro && !mostrarTodas;
    $('mais').hidden = !limite;
    if (limite) hs = hs.slice(0, 12);
    $('lista').innerHTML = hs.map(h => {
      const vem = entra(h.codigo).map(l => l.de), vai = sai(h.codigo).map(l => l.para);
      const tipos = {};
      h.recursos.forEach(r => { tipos[r.tipo] = (tipos[r.tipo] || 0) + 1; });
      const mat = Object.entries(tipos).map(([t, n]) => `${n} ${(TIPOS[t] || [t, t])[n > 1 ? 1 : 0]}`).join(', ');
      const link = h.link ? `<a href="${h.link}">${C.material ? (mat ? 'Material: ' + mat : 'Página da habilidade') : esc(h.linkTexto || 'Página da habilidade')}</a>` : (C.material && mat ? `<span>Material: ${mat}</span>` : '');
      return `<li class="eixo-${COR[h.eixo]}">
        <div class="topo"><strong>${h.codigo}</strong><span>${esc(h.objeto)}</span><span class="meta-hab">${anoNome(h.ano)} · ${EIXOS[h.eixo]}</span></div>
        <p>${esc(h.texto)}</p>
        <div class="acoes">
          ${vem.length ? `<span>Vem de ${vem.map(codBtn).join(' ')}</span>` : ''}
          ${vai.length ? `<span>Continua em ${vai.map(codBtn).join(' ')}</span>` : ''}
          ${link}
        </div></li>`;
    }).join('');
  }
  $('busca').addEventListener('input', () => { filtro = null; desenharLista(); });
  $('limpar').addEventListener('click', () => { filtro = null; $('busca').value = ''; desenharLista(); });
  $('lista').addEventListener('click', e => {
    const b = e.target.closest('[data-cod]'); if (!b) return;
    selecionar(b.dataset.cod);
    svg.closest('.janela').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('mais').addEventListener('click', () => { mostrarTodas = true; desenharLista(); });
  desenharLista();

  // ---------- CSV ----------
  $('baixar').addEventListener('click', () => {
    const cab = ['codigo', ETAPA ? 'etapa' : 'ano', C.termoEixo.replace(/ /g, '_'), 'objeto', 'verbo', 'texto_resumido', 'materiais', 'vem_de', 'continua_em'];
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    const linhas = D.habilidades.map(h => [h.codigo, anoNome(h.ano), EIXOS[h.eixo], h.objeto, h.verbo, h.texto, h.recursos.length,
      entra(h.codigo).map(l => l.de).join(' '), sai(h.codigo).map(l => l.para).join(' ')].map(q).join(','));
    const blob = new Blob(['﻿' + cab.join(',') + '\n' + linhas.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = C.arquivo + '-habilidades.csv';
    document.body.appendChild(a); a.click(); a.remove();
  });

  // ---------- Tema ----------
  $('theme-btn').addEventListener('click', () => {
    const r = document.documentElement;
    const escuro = r.dataset.theme === 'dark' || (!r.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    r.dataset.theme = escuro ? 'light' : 'dark';
    try { localStorage.setItem('iapraprof:theme', JSON.stringify(r.dataset.theme)); } catch (e) {}
  });
  window.gtag = window.gtag || function () {};
})();
