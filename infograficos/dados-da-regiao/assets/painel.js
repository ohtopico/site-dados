/* Painel de dados da região: filtros, mapa, barras e comparações.
   Os dados vêm de assets/dados.js (gerado por _fonte/dados-da-regiao/gerar.py). */
(function () {
  const D = window.DADOS_REGIAO;
  const IND = Object.fromEntries(D.indicadores.map(i => [i.id, i]));
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nf = (v, c) => v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });

  /* ---------- Estado (fica na URL para poder compartilhar) ---------- */
  const q = new URLSearchParams(location.search);
  const S = {
    r: Math.max(0, D.regioes.findIndex(r => r.id === q.get('regiao'))),
    mun: q.get('municipio') || '',
    ind: IND[q.get('indicador')] ? q.get('indicador') : 'banda',
    ano: q.get('ano') || '',
    ca: '', cb: '', cano: 'ultimo',
  };
  const regiao = () => D.regioes[S.r];
  if (S.mun && !regiao().membros.includes(S.mun)) S.mun = '';

  function salvaUrl() {
    const p = new URLSearchParams();
    p.set('regiao', regiao().id);
    if (S.mun) p.set('municipio', S.mun);
    p.set('indicador', S.ind);
    if (S.ano) p.set('ano', S.ano);
    history.replaceState(null, '', '?' + p.toString());
  }

  /* ---------- Valores ---------- */
  function fmt(v, un) {
    if (v == null) return 'sem dado';
    if (un === '%') return nf(v, Number.isInteger(v) ? 0 : 1) + '%';
    if (un === 'd') return nf(v, 1);
    if (un === 'r') return 'R$ ' + nf(v, 0);
    return nf(v, 0);
  }
  const sinal = x => (x > 0 ? '+' : x < 0 ? '−' : '');
  // Variação: pontos para percentuais, % para o resto
  function delta(ind, a, b) {
    if (a == null || b == null) return null;
    if (ind.unidade === '%') return b - a;
    return a === 0 ? null : (b - a) / a * 100;
  }
  function fmtDelta(ind, x) {
    if (x == null) return 'sem dado';
    if (ind.unidade === '%') return sinal(x) + nf(Math.abs(x), 1) + (Math.abs(x) === 1 ? ' ponto' : ' pontos');
    return sinal(x) + nf(Math.abs(x), Math.abs(x) < 10 ? 1 : 0) + '%';
  }
  // Valor de um município, da região inteira, do RS ou do Brasil
  function val(ind, quem, i) {
    let arr;
    if (quem === 'RS') arr = ind.rs;
    else if (quem === 'Brasil') arr = ind.brasil;
    else if (quem.startsWith('@')) arr = ind.regioes[quem.slice(1)];
    else arr = ind.valores[quem];
    return arr ? arr[i] ?? null : null;
  }
  const estimado = (ind, nome, i) => i === 0 && (ind.estimado || []).includes(nome);
  const escopo = () => S.mun || '@' + regiao().id;
  const nomeEscopo = () => S.mun || regiao().nome;
  // Anos com algum dado entre os municípios da região
  function anosCom(ind, nomes) {
    return ind.anos.map((a, i) => i).filter(i => nomes.some(n => val(ind, n, i) != null));
  }
  function primeiroUltimo(ind, quem) {
    const is = ind.anos.map((a, i) => i).filter(i => val(ind, quem, i) != null);
    return is.length >= 2 ? [is[0], is[is.length - 1]] : null;
  }
  function varQuem(ind, quem, par) {
    if (ind.variacao) return val(ind, quem, 0);
    const p = par || primeiroUltimo(ind, quem);
    return p ? delta(ind, val(ind, quem, p[0]), val(ind, quem, p[1])) : null;
  }

  /* ---------- Dica flutuante ---------- */
  const tip = $('tip');
  document.addEventListener('pointermove', e => {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (!el) { tip.classList.remove('on'); return; }
    const [t, ...l] = el.dataset.tip.split('|');
    tip.innerHTML = `<b>${esc(t)}</b>${l.map(esc).join('<br>')}`;
    tip.classList.add('on');
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + w > innerWidth - 8) x = e.clientX - w - 14;
    if (y + h > innerHeight - 8) y = e.clientY - h - 14;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  });
  document.addEventListener('pointerleave', () => tip.classList.remove('on'));

  /* ---------- Filtros ---------- */
  function montaRegioes() {
    $('f-regiao').innerHTML = D.regioes.map((r, i) =>
      `<button type="button" data-i="${i}" aria-pressed="${i === S.r}">${esc(r.nome)}</button>`).join('');
  }
  $('f-regiao').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    S.r = +b.dataset.i;
    if (S.mun && !regiao().membros.includes(S.mun)) S.mun = '';
    tudo();
  });
  function montaMunicipios() {
    const ms = [...regiao().membros].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    $('f-mun').innerHTML = `<option value="">Toda a região (${ms.length} municípios)</option>` +
      ms.map(m => `<option${m === S.mun ? ' selected' : ''}>${esc(m)}</option>`).join('');
  }
  $('f-mun').addEventListener('change', e => { S.mun = e.target.value; tudo(); });
  function escolheMun(n) {
    if (!regiao().membros.includes(n)) return;
    S.mun = S.mun === n ? '' : n;
    tudo();
  }

  function montaIndicadores() {
    const grupos = [...new Set(D.indicadores.map(i => i.grupo))];
    $('f-ind').innerHTML = grupos.map(g => `<optgroup label="${esc(g)}">` +
      D.indicadores.filter(i => i.grupo === g).map(i =>
        `<option value="${i.id}"${i.id === S.ind ? ' selected' : ''}>${esc(i.nome)}</option>`).join('') + '</optgroup>').join('');
  }
  $('f-ind').addEventListener('change', e => { S.ind = e.target.value; S.ano = ''; explorar(); salvaUrl(); });

  function montaAnos(ind, anos) {
    const opts = anos.map(i => [String(i), ind.anos[i]]);
    if (anos.length >= 2) opts.push(['var', `Variação ${ind.anos[anos[0]]}–${ind.anos[anos[anos.length - 1]]}`]);
    if (!opts.some(o => o[0] === S.ano)) S.ano = ind.variacao ? '0' : String(anos[anos.length - 1]);
    $('f-ano').innerHTML = opts.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${v === S.ano}">${esc(t)}</button>`).join('');
  }
  $('f-ano').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    S.ano = b.dataset.v; explorar(); salvaUrl();
  });

  /* ---------- Resumo ---------- */
  function kpi(rot, ind, i, comparaCom, extra) {
    const quem = escopo(), v = val(ind, quem, i);
    if (v == null) return '';
    let varHtml = '';
    if (comparaCom != null) {
      const a = val(ind, quem, comparaCom), x = delta(ind, a, v);
      if (x != null) {
        const bom = ind.bom === false ? x < 0 : ind.bom === true ? x > 0 : null;
        const cls = x === 0 ? '' : (bom ?? x > 0) ? 'sobe' : 'desce';
        varHtml = `<span class="var ${cls}">${fmtDelta(ind, x)} desde ${ind.anos[comparaCom]}</span>`;
      }
    }
    return `<div class="kpi"><div class="rot">${esc(rot)}</div><div class="num">${fmt(v, ind.unidade)}</div>${varHtml}
      <div class="ref">${extra || ''}</div></div>`;
  }
  function resumo() {
    const n = nomeEscopo();
    $('resumo-titulo').textContent = n;
    $('resumo-sub').textContent = S.mun
      ? `Município da região ${regiao().nome}. Clique de novo no mapa ou escolha "Toda a região" para voltar.`
      : `Soma dos ${regiao().membros.length} municípios: ${[...regiao().membros].sort((a, b) => a.localeCompare(b, 'pt-BR')).join(', ')}.`;
    // Regra: o resumo destaca os avanços. Quedas ficam no explorador de indicadores.
    const I = IND.internet, B = IND.banda, A = IND.alfa, T = IND.al_turma, C = IND.mat_creche, Q = IND.mat_esp;
    const rsVar = (ind, f) => `No RS: ${fmtDelta(ind, varQuem(ind, 'RS', [0, f]))} no mesmo período.`;
    let h = kpi('Escolas com internet em 2025', I, 2, 0, `No RS: ${fmt(I.rs[2], '%')}.`)
      + kpi('Escolas com banda larga em 2025', B, 2, 0, `No RS: ${fmt(B.rs[2], '%')}.`);
    if (val(A, escopo(), 1) != null) {
      const e = S.mun && estimado(A, S.mun, 0) ? ' Valor de 2010 estimado.' : '';
      h += kpi('Sabem ler e escrever (15+) em 2022', A, 1, 0, `No RS: 96,9%. No Brasil: 93%.${e}`);
    }
    h += kpi('Alunos por turma em 2022', T, 1, 0, `Turmas menores dão mais atenção a cada aluno. No RS: ${fmt(T.rs[1], 'd')}.`)
      + kpi('Matrículas em creche em 2022', C, 1, 0, rsVar(C, 1))
      + kpi('Matrículas na educação especial em 2022', Q, 1, 0, rsVar(Q, 1));
    $('kpis').innerHTML = h;
  }

  /* ---------- Cores do mapa ---------- */
  const SEQ = ['var(--g1)', 'var(--g2)', 'var(--g3)', 'var(--g4)', 'var(--g5)'];
  function escalaSeq(vals) {
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const f = v => hi === lo ? SEQ[2] : SEQ[Math.min(4, Math.floor((v - lo) / (hi - lo) * 5))];
    return { f, lo, hi };
  }
  function escalaDiv(vals) {
    const M = Math.max(...vals.map(Math.abs)) || 1, t1 = M * 0.05, t2 = M * 0.5;
    const f = v => v < -t2 ? 'var(--r5)' : v < -t1 ? 'var(--r3)' : v <= t1 ? 'var(--neutro)' : v <= t2 ? 'var(--g3)' : 'var(--g5)';
    return { f, t1, t2 };
  }

  /* ---------- Explorar: mapa, ranking e comparação ---------- */
  function explorar() {
    const ind = IND[S.ind], r = regiao(), membros = r.membros;
    const anos = anosCom(ind, membros);
    montaAnos(ind, anos);
    const modoVar = S.ano === 'var' || ind.variacao;
    const ai = modoVar ? null : +S.ano;
    const par = anos.length >= 2 ? [anos[0], anos[anos.length - 1]] : null;
    const rotAno = ind.variacao ? ind.anos[0] : modoVar ? `variação ${ind.anos[par[0]]}–${ind.anos[par[1]]}` : ind.anos[ai];
    const v = n => modoVar ? varQuem(ind, n, ind.variacao ? null : par) : val(ind, n, ai);
    const fv = x => modoVar && !ind.variacao ? fmtDelta(ind, x) : ind.variacao ? sinal(x) + nf(Math.abs(x), 1) + '%' : fmt(x, ind.unidade);

    const notas = [];
    if (ind.fonte === 'ibge') notas.push('Censo IBGE: só há dado para os municípios destacados no mapa.');
    if (ind.estimado && ind.estimado.length && !ind.variacao) notas.push('Valores com asterisco (*) são de 2010 estimados.');
    if (ind.id === 'agua_pot' || ind.id === 'sem_acess') notas.push('Item não perguntado no Censo Escolar de 2010.');
    $('ind-nota').textContent = notas.join(' ');

    const comDado = membros.filter(n => v(n) != null);
    const vals = comDado.map(v);

    // Mapa
    const div = modoVar && vals.some(x => x < 0);
    const esc_ = vals.length ? (div ? escalaDiv(vals) : escalaSeq(vals)) : null;
    const cor = x => div ? esc_.f(x) : esc_.f(x);
    const M = D.mapa;
    let paths = '', rot = '';
    for (const [nome, g] of Object.entries(M.municipios)) {
      const membro = membros.includes(nome), x = membro ? v(nome) : null;
      const est = estimado(ind, nome, modoVar ? par && par[0] : ai);
      if (!membro) {
        paths += `<path d="${g.d}" class="fora hatch" data-tip="${esc(nome)}|Fora desta região"><title>${esc(nome)}: fora desta região</title></path>`;
        continue;
      }
      const fill = x == null ? 'var(--fora)' : cor(x);
      const txt = x == null ? 'sem dado' : fv(x) + (est ? ' (2010 estimado)' : '');
      paths += `<path d="${g.d}" style="fill:${fill}" class="${nome === S.mun ? 'sel' : ''}" tabindex="0" role="button"
        aria-label="${esc(nome)}: ${esc(txt)}" data-nome="${esc(nome)}" data-tip="${esc(nome)}|${esc(ind.nome)}, ${esc(rotAno)}: ${esc(txt)}"></path>`;
      if (nome === S.mun || (!S.mun && nome === r.centro)) rot += `<text x="${g.x}" y="${g.y}" text-anchor="middle">${esc(nome)}</text>`;
    }
    const alt = `Mapa de ${r.nome}: ${ind.nome}, ${rotAno}. ` + comDado.map(n => `${n}: ${fv(v(n))}`).join('; ') + '.';
    $('mapa').innerHTML = `<svg viewBox="0 0 ${M.w} ${M.h}" role="group" aria-label="${esc(alt)}">
      <defs><pattern id="hachura" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill="var(--fora)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--line)" stroke-width="1.5"/></pattern></defs>
      ${paths}${rot}</svg>`;
    $('mapa-sub').textContent = `${ind.nome}, ${rotAno}. Clique em um município para ver os dados dele.`;
    let leg = '';
    if (esc_) {
      if (div) {
        const u = x => fmtDeltaCurto(ind, x);
        leg = `<span><i style="background:var(--r5)"></i>abaixo de ${u(-esc_.t2)}</span><span><i style="background:var(--r3)"></i>queda</span>
          <span><i style="background:var(--neutro)"></i>estável</span><span><i style="background:var(--g3)"></i>alta</span><span><i style="background:var(--g5)"></i>acima de ${u(esc_.t2)}</span>`;
      } else {
        leg = `<span class="escala">${fv(esc_.lo)}<span class="faixa">${SEQ.map(c => `<i style="background:${c}"></i>`).join('')}</span>${fv(esc_.hi)}</span>`;
      }
    }
    leg += `<span><i style="background:url(#hachura) var(--fora)"></i>fora da região</span>`;
    if (comDado.length < membros.length) leg += `<span><i style="background:var(--fora)"></i>sem dado</span>`;
    $('mapa-leg').innerHTML = leg;

    // Ranking
    const ordem = [...comDado].sort((a, b) => v(b) - v(a));
    const refs = [];
    if (modoVar || ind.unidade !== 'n') {
      const rv = v('RS');
      if (rv != null && !ind.variacao) refs.push(['RS', rv]);
    }
    $('rank-titulo').textContent = 'Município a município';
    $('rank-sub').textContent = `${ind.nome}, ${rotAno}.` + (refs.length ? ` A linha tracejada marca o Rio Grande do Sul.` : '')
      + (comDado.length < membros.length ? ` Sem dado: ${membros.filter(n => !comDado.includes(n)).join(', ')}.` : '');
    $('rank').innerHTML = barras(ordem.map(n => ({
      nome: n, v: v(n), sel: n === S.mun, est: estimado(ind, n, modoVar ? par && par[0] : ai),
    })), fv, refs, { clicavel: true, ind, rotAno, neg: modoVar });
    $('rank').setAttribute('aria-label', `Barras: ${ind.nome}, ${rotAno}`);

    // Tabela do ranking
    const cols = anos.map(i => ind.anos[i]);
    $('rank-tab').innerHTML = `<table class="tab"><caption class="sr-only">${esc(ind.nome)} por município</caption>
      <thead><tr><th scope="col">Município</th>${cols.map(c => `<th scope="col">${esc(c)}</th>`).join('')}${par && !ind.variacao ? '<th scope="col">Variação</th>' : ''}</tr></thead><tbody>` +
      [...membros].sort((a, b) => a.localeCompare(b, 'pt-BR')).map(n => `<tr><td>${esc(n)}</td>${anos.map(i => {
        const e = estimado(ind, n, i);
        return `<td class="${e ? 'est' : ''}">${ind.variacao && val(ind, n, i) != null ? fv(val(ind, n, i)) : fmt(val(ind, n, i), ind.unidade)}${e ? '*' : ''}</td>`;
      }).join('')}${par && !ind.variacao ? `<td>${fmtDelta(ind, varQuem(ind, n, par))}</td>` : ''}</tr>`).join('') +
      ['RS', 'Brasil'].filter(n => anos.some(i => val(ind, n, i) != null)).map(n => `<tr><td><b>${n}</b></td>${anos.map(i => `<td>${fmt(val(ind, n, i), ind.unidade)}</td>`).join('')}${par && !ind.variacao ? `<td>${fmtDelta(ind, varQuem(ind, n, par))}</td>` : ''}</tr>`).join('') +
      '</tbody></table>';

    // Comparação com RS e Brasil (variação no período)
    const quem = [];
    if (S.mun) quem.push([S.mun, S.mun]);
    quem.push(['@' + r.id, r.nome], ['RS', 'Rio Grande do Sul'], ['Brasil', 'Brasil']);
    const linhas = quem.map(([k, rotulo]) => ({ nome: rotulo, v: ind.variacao ? val(ind, k, 0) : varQuem(ind, k, par), sel: k === escopo() }))
      .filter(l => l.v != null);
    if (ind.variacao || !par || !linhas.length) {
      $('comp-titulo').textContent = 'Comparado ao estado e ao país';
      $('comp-sub').textContent = 'Este indicador não tem dado do Rio Grande do Sul e do Brasil para os dois anos.';
      $('comp').innerHTML = '';
    } else {
      $('comp-titulo').textContent = `Variação de ${ind.anos[par[0]]} a ${ind.anos[par[1]]}: ${nomeEscopo()}, região, RS e Brasil`;
      $('comp-sub').textContent = `${ind.nome}. ` + (ind.unidade === '%' ? 'Diferença em pontos percentuais.' : 'Variação percentual.');
      $('comp').innerHTML = barras(linhas, x => fmtDelta(ind, x), [], { ind, rotAno: 'variação', neg: true, cinzaNaoSel: true });
    }
  }
  function fmtDeltaCurto(ind, x) {
    return ind.unidade === '%' && !ind.variacao ? sinal(x) + nf(Math.abs(x), 0) + ' pt' : sinal(x) + nf(Math.abs(x), 0) + '%';
  }

  // Barras horizontais com zero e linhas de referência
  function barras(linhas, fv, refs, o) {
    if (!linhas.length) return '<p class="nota">Sem dados para este recorte.</p>';
    const vs = linhas.map(l => l.v).concat(refs.map(r => r[1]));
    let lo = Math.min(0, ...vs), hi = Math.max(0, ...vs);
    if (hi === lo) hi = lo + 1;
    // espaço para o rótulo do valor
    const pad = (hi - lo) * 0.22;
    if (lo < 0) lo -= pad; if (hi > 0) hi += pad;
    const X = x => (x - lo) / (hi - lo) * 100, z = X(0);
    const refHtml = refs.map(([n, x]) => `<div class="linha-ref" style="left:calc(var(--lab) + 16px + (100% - var(--lab) - 22px) * ${X(x) / 100})"><span>${esc(n)} ${esc(fv(x))}</span></div>`).join('');
    return refHtml + '<div class="barras">' + linhas.map(l => {
      const neg = l.v < 0, a = Math.min(z, X(l.v)), w = Math.abs(X(l.v) - z);
      // rótulo fora da barra; dentro dela quando não cabe no fim do trilho
      const dentro = neg ? X(l.v) < 24 : X(l.v) > 76;
      const t = dentro
        ? (neg ? `left:calc(${X(l.v)}% + 6px)` : `right:calc(${100 - X(l.v)}% + 6px)`) + ';color:var(--paper)'
        : (neg ? `right:calc(${100 - X(l.v)}% + 6px)` : `left:calc(${X(l.v)}% + 6px)`);
      const txt = fv(l.v) + (l.est ? '*' : '');
      const cls = (o.cinzaNaoSel && !l.sel) ? 'ref' : neg ? 'neg' : '';
      const tag = o.clicavel ? 'button' : 'div';
      return `<${tag} ${o.clicavel ? `type="button" data-nome="${esc(l.nome)}" aria-pressed="${!!l.sel}"` : ''} class="barra${l.sel ? ' sel' : ''}"
        data-tip="${esc(l.nome)}|${esc(o.ind.nome)}, ${esc(o.rotAno)}: ${esc(txt)}${l.est ? ' (2010 estimado)' : ''}">
        <span class="nm">${esc(l.nome)}</span><span class="tr"><i class="zero" style="left:${z}%"></i>
        <i class="b ${cls}" style="left:${a}%;width:${w}%"></i><span class="t" style="${t}">${esc(txt)}</span></span></${tag}>`;
    }).join('') + '</div>';
  }
  $('rank').addEventListener('click', e => { const b = e.target.closest('[data-nome]'); if (b) escolheMun(b.dataset.nome); });
  $('mapa').addEventListener('click', e => { const p = e.target.closest('path[data-nome]'); if (p) escolheMun(p.dataset.nome); });
  $('mapa').addEventListener('keydown', e => {
    const p = e.target.closest('path[data-nome]');
    if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); escolheMun(p.dataset.nome); }
  });
  $('rank-tab-btn').addEventListener('click', e => {
    const t = $('rank-tab'), abre = t.hidden;
    t.hidden = !abre; e.target.setAttribute('aria-expanded', abre);
    e.target.textContent = abre ? 'Esconder tabela' : 'Ver como tabela';
  });

  /* ---------- Etapas e estrutura ---------- */
  const ETAPAS = ['mat_creche', 'mat_pre', 'mat_ai', 'mat_af', 'mat_em', 'mat_prof', 'mat_eja', 'mat_esp'];
  const NOME_ETAPA = { mat_creche: 'Creche', mat_pre: 'Pré-escola', mat_ai: 'Fund. anos iniciais', mat_af: 'Fund. anos finais',
    mat_em: 'Ensino médio', mat_prof: 'Ed. profissional', mat_eja: 'EJA', mat_esp: 'Educação especial' };
  const INFRA = ['internet', 'banda', 'biblio', 'lab_info', 'lab_cien', 'quadra', 'esgoto', 'alim'];
  function etapasEstrutura() {
    const quem = escopo();
    $('etapas-titulo').textContent = `Matrículas e estrutura das escolas: ${nomeEscopo()}`;
    const linhas = ETAPAS.map(id => {
      const ind = IND[id], a = val(ind, quem, 0), b = val(ind, quem, 1);
      return { nome: NOME_ETAPA[id], v: delta(ind, a, b), a, b, rs: varQuem(ind, 'RS', [0, 1]) };
    }).filter(l => l.v != null);
    $('etapas').innerHTML = barras(linhas, x => fmtDelta(IND.mat, x), [], { ind: { nome: 'Matrículas' }, rotAno: '2010 a 2022', neg: true });
    // completa a dica com os números absolutos e o RS
    $('etapas').querySelectorAll('.barra').forEach((el, i) => {
      const l = linhas[i];
      el.dataset.tip = `${l.nome}|${fmt(l.a, 'n')} em 2010, ${fmt(l.b, 'n')} em 2022|${fmtDelta(IND.mat, l.v)}. No RS: ${fmtDelta(IND.mat, l.rs)}`;
    });
    $('infra').innerHTML = INFRA.map(id => {
      const ind = IND[id], a = val(ind, quem, 0), b = val(ind, quem, 2);
      if (b == null) return '';
      const nome = ind.nome.replace(/^Escolas (com|que oferecem) /, '').replace(/^./, c => c.toUpperCase());
      return `<div class="halt" data-tip="${esc(ind.nome)}|2010: ${fmt(a, '%')}|2025: ${fmt(b, '%')}|RS em 2025: ${fmt(ind.rs[2], '%')}">
        <span>${esc(nome)}</span><span class="tr"><i class="fl${a != null && b < a ? ' desce' : ''}" style="width:calc(${b}% + 3px)"></i>
        ${a != null ? `<i class="mk" style="left:${a}%"></i>` : ''}</span>
        <span class="vv">${a != null ? fmt(a, '%') + ' → ' : ''}<b>${fmt(b, '%')}</b></span></div>`;
    }).join('');
  }

  /* ---------- Comparar dois municípios ---------- */
  function montaComparar() {
    const todos = Object.keys(D.mapa.municipios).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (!S.ca) S.ca = regiao().centro;
    if (!S.cb) S.cb = regiao().membros.find(m => m !== S.ca);
    const op = sel => todos.map(m => `<option${m === sel ? ' selected' : ''}>${esc(m)}</option>`).join('');
    $('c-a').innerHTML = op(S.ca); $('c-b').innerHTML = op(S.cb);
  }
  function comparar() {
    const A = S.ca, B = S.cb, grupos = [...new Set(D.indicadores.map(i => i.grupo))];
    let h = `<table class="tab"><caption class="sr-only">Comparação entre ${esc(A)} e ${esc(B)}</caption><thead><tr>
      <th scope="col">Indicador</th><th scope="col">Ano</th><th scope="col">${esc(A)}</th><th scope="col">${esc(B)}</th><th scope="col">RS</th></tr></thead><tbody>`;
    for (const g of grupos) {
      h += `<tr class="grupo"><td colspan="5">${esc(g)}</td></tr>`;
      for (const ind of D.indicadores.filter(i => i.grupo === g)) {
        let i;
        if (S.cano === '0') i = 0;
        else i = [...ind.anos.keys()].reverse().find(k => val(ind, A, k) != null || val(ind, B, k) != null);
        if (i == null) continue;
        const a = val(ind, A, i), b = val(ind, B, i);
        if (a == null && b == null) continue;
        const f = x => ind.variacao && x != null ? sinal(x) + nf(Math.abs(x), 1) + '%' : fmt(x, ind.unidade);
        let ma = false, mb = false;
        if (ind.bom != null && a != null && b != null && a !== b) {
          const aMelhor = ind.bom ? a > b : a < b; ma = aMelhor; mb = !aMelhor;
        }
        const ea = estimado(ind, A, i), eb = estimado(ind, B, i);
        const cel = (x, m, e) => `<td class="${m ? 'melhor' : ''}${e ? ' est' : ''}">${f(x)}${e ? '*' : ''}</td>`;
        h += `<tr><td>${esc(ind.nome)}</td><td>${esc(ind.anos[i])}</td>${cel(a, ma, ea)}${cel(b, mb, eb)}<td>${val(ind, 'RS', i) != null ? f(val(ind, 'RS', i)) : '–'}</td></tr>`;
      }
    }
    $('comparar').innerHTML = h + '</tbody></table>';
  }
  $('c-a').addEventListener('change', e => { S.ca = e.target.value; comparar(); });
  $('c-b').addEventListener('change', e => { S.cb = e.target.value; comparar(); });
  $('c-ano').addEventListener('change', e => { S.cano = e.target.value; comparar(); });

  /* ---------- Destaques ---------- */
  function destaques() {
    $('destaques').innerHTML = D.destaques.map(d => `<article class="destaque${d.regiao === S.r ? ' atual' : ''}">
      <span class="eyebrow">${esc(D.regioes[d.regiao].nome)}</span><h3>${esc(d.titulo)}</h3>
      <ul>${d.itens.map(i => `<li>${esc(i)}</li>`).join('')}</ul></article>`).join('');
  }

  /* ---------- Tema ---------- */
  $('theme-btn').addEventListener('click', () => {
    const root = document.documentElement;
    const escuro = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = escuro ? 'light' : 'dark';
    try { localStorage.setItem('iapraprof:theme', JSON.stringify(root.dataset.theme)); } catch (e) {}
  });

  function tudo() {
    montaRegioes(); montaMunicipios(); resumo(); explorar(); etapasEstrutura(); destaques(); salvaUrl();
  }
  montaIndicadores(); montaComparar(); comparar(); tudo();
})();
