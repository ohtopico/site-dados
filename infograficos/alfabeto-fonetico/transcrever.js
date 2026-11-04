/* Transcrição aproximada de texto escrito para o Alfabeto Fonético Internacional.
   Português do Brasil, espanhol, italiano e alemão: regras de leitura da ortografia (com divisão
   silábica e acento tônico). Inglês: dicionário de pronúncia CMUdict, carregado só quando preciso.
   Uso: TranscreverIPA.transcrever(texto, 'pt') -> Promise de [{orig, ipa}] (um item por palavra ou separador). */
(function () {
  const VOG = 'aeiouáéíóúâêôãõàèìòùüyäöë';
  const isV = c => !!c && VOG.includes(c);
  const ACENTO = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'â': 'a', 'ê': 'e', 'ô': 'o', 'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u' };
  const base = c => ACENTO[c] || c;
  const temAcento = c => 'áéíóúâêôàèìòù'.includes(c);
  const OBSTR = 'pbtdcgkfv', LIQ = 'lr';

  // ---------- Unidades (letras ou dígrafos) ----------
  // Cada unidade: {t: texto, v: vogal?}. Dígrafos consonantais viram uma unidade só.
  function unidades(p, lang) {
    const U = [];
    const DIG = {
      pt: ['ch', 'lh', 'nh', 'rr', 'ss', 'sç'],
      es: ['ch', 'll', 'rr'],
      it: ['ch', 'gh', 'gn', 'sc'],
    }[lang] || [];
    for (let i = 0; i < p.length;) {
      const c = p[i], d = p.slice(i, i + 2), n = p[i + 2];
      // qu / gu antes de e, i: o u não soa (exceto ü)
      if ((c === 'q' || c === 'g') && p[i + 1] === 'u' && 'eiéíêè'.includes(n || '#')) { U.push({ t: c + 'u', v: false }); i += 2; continue; }
      if (c === 'g' && p[i + 1] === 'u' && 'aoáó'.includes(n || '#')) { U.push({ t: 'g', v: false }); U.push({ t: 'u', v: true, gl: true }); i += 2; continue; }
      if (c === 'q' && p[i + 1] === 'u') { U.push({ t: 'q', v: false }); U.push({ t: 'u', v: true, gl: true }); i += 2; continue; }
      if (lang === 'it' && (c === 'c' || c === 'g') && p[i + 1] === 'i' && isV(n) && n !== 'i') { U.push({ t: c + 'i', v: false }); i += 2; continue; }
      if (lang === 'it' && d === 'sc' && p[i + 2] === 'i' && isV(p[i + 3])) { U.push({ t: 'sci', v: false }); i += 3; continue; }
      if (lang === 'it' && d === 'gl' && n === 'i') { if (isV(p[i + 3])) { U.push({ t: 'gli', v: false }); i += 3; } else { U.push({ t: 'gl', v: false }); i += 2; } continue; }
      if (lang === 'it' && d === 'sc' && !'eièé'.includes(n || '#')) { U.push({ t: 's', v: false }); i += 1; continue; }
      if (DIG.includes(d)) { U.push({ t: d, v: false }); i += 2; continue; }
      if (lang === 'es' && c === 'y' && (i === p.length - 1) && isV(p[i - 1])) { U.push({ t: 'i', v: true, gl: true }); i++; continue; }
      if (lang === 'es' && c === 'y') { U.push({ t: 'y', v: !isV(n) && !isV(p[i - 1]) && i === p.length - 1 }); i++; continue; }
      U.push({ t: c, v: isV(c) && c !== 'y' || (c === 'y' && lang !== 'es' && !isV(n)) });
      i++;
    }
    return U;
  }

  // ---------- Sílabas ----------
  // Devolve as unidades com .s (índice da sílaba) e .papel: 'N' núcleo, 'G' semivogal, 'A' ataque, 'C' coda.
  function silabas(U, lang) {
    // Núcleos: grupos de vogais decididos em ditongo ou hiato
    const nuc = []; // listas de índices de unidades vogais
    for (let i = 0; i < U.length; i++) {
      if (!U[i].v) continue;
      const ant = nuc.length ? nuc[nuc.length - 1] : null;
      const ultimo = ant ? ant[ant.length - 1] : -2;
      if (ant && ultimo === i - 1 && junta(U, ultimo, i, lang)) ant.push(i);
      else nuc.push([i]);
    }
    if (!nuc.length) { U.forEach(u => { u.s = 0; u.papel = 'A'; }); return 1; }
    // Consoantes entre núcleos
    U.forEach(u => { u.s = -1; });
    nuc.forEach((g, k) => g.forEach(i => { U[i].s = k; }));
    for (let k = 0; k < nuc.length; k++) {
      const fim = nuc[k][nuc[k].length - 1], prox = k + 1 < nuc.length ? nuc[k + 1][0] : U.length;
      const cons = []; for (let i = fim + 1; i < prox; i++) cons.push(i);
      if (k + 1 >= nuc.length) { cons.forEach(i => { U[i].s = k; U[i].papel = 'C'; }); break; }
      let ataque = cons.length ? 1 : 0;
      if (cons.length >= 2) {
        const a = U[cons[cons.length - 2]].t, b = U[cons[cons.length - 1]].t;
        if (OBSTR.includes(a) && LIQ.includes(b)) ataque = 2;
        if (lang === 'it' && a === 's' && cons.length === 2) ataque = 2;
      }
      cons.forEach((i, j) => { const at = j >= cons.length - ataque; U[i].s = at ? k + 1 : k; U[i].papel = at ? 'A' : 'C'; });
    }
    for (let i = 0; i < nuc[0][0]; i++) { U[i].s = 0; U[i].papel = 'A'; }
    // Papel das vogais: a mais forte do grupo é o núcleo
    nuc.forEach(g => {
      let h = g[0];
      if (g.length > 1) {
        const forte = g.find(i => !'iuy'.includes(U[i].t) || temAcento(U[i].t));
        h = forte !== undefined ? forte : g[g.length - 1];
        if (g.length === 2 && 'iu'.includes(U[g[0]].t) && 'iu'.includes(U[g[1]].t)) h = lang === 'es' ? g[1] : g[0];
      }
      g.forEach(i => { U[i].papel = i === h ? 'N' : 'G'; });
    });
    return nuc.length;
  }
  function junta(U, a, b, lang) {
    const x = U[a].t, y = U[b].t;
    if (U[a].gl || U[b].gl) return true;
    if (temAcento(x) && temAcento(y)) return false;
    const fraca = c => 'iuü'.includes(c);
    if ('ãõ'.includes(x) && 'eo'.includes(y)) return true;
    if (fraca(y) && !fraca(x)) {
      // a-i, e-u...: ditongo decrescente, salvo antes de nh ou de m/n/r/l/z que fecham a sílaba (ra-i-nha, ju-iz)
      const dep = U[b + 1], dep2 = U[b + 2];
      if (lang === 'pt' && dep && (dep.t === 'nh' || ('mnrlz'.includes(dep.t) && !(dep2 && dep2.v)))) return false;
      return true;
    }
    if (fraca(x) && !temAcento(x) && !fraca(y)) return lang !== 'pt';
    if (fraca(x) && fraca(y)) return true;
    return false;
  }

  // ---------- Acento tônico ----------
  function tonica(U, n, lang, palavra) {
    if (n <= 1) return 0;
    const ac = U.findIndex(u => u.v && temAcento(u.t));
    if (ac >= 0) return U[ac].s;
    if (lang === 'pt') {
      const nas = U.findIndex(u => 'ãõ'.includes(u.t));
      if (nas >= 0) return U[nas].s;
      return /([aeo]s?|[ae]m|ens)$/.test(palavra) ? n - 2 : n - 1;
    }
    if (lang === 'es') return /([aeiou]|[aeiou]s|n)$/.test(palavra) ? n - 2 : n - 1;
    if (lang === 'it') return n - 2;
    return 0;
  }

  // Palavras átonas (artigos, preposições curtas)
  const ATONAS = {
    pt: 'o a os as e de do da dos das em no na nos nas um uns por que se me te lhe com sem'.split(' '),
    es: 'el la los las de del y en un a por que se me te lo le con'.split(' '),
    it: 'il lo la i gli le di da in e a un per che si mi ti con'.split(' '),
  };

  function analisar(p, lang) {
    const U = unidades(p, lang);
    const n = silabas(U, lang);
    let t = tonica(U, n, lang, p);
    if (n === 1 && (ATONAS[lang] || []).includes(p)) t = -1;
    return { U, n, t };
  }

  function montar(partes, n, t) {
    // partes: [{s, txt}] -> texto com ˈ antes da sílaba tônica
    const sil = Array.from({ length: n }, () => '');
    partes.forEach(x => { sil[Math.max(0, x.s)] += x.txt; });
    return sil.map((s, k) => (k === t && n > 1 ? 'ˈ' : '') + s).join('');
  }

  // ---------- Português do Brasil ----------
  function pt(p) {
    const { U, n, t } = analisar(p, 'pt');
    const out = [];
    const ult = n - 1;
    const prox = i => U[i + 1] ? U[i + 1].t : '';
    const nasalCoda = i => U[i + 1] && 'mn'.includes(U[i + 1].t) && U[i + 1].papel === 'C';
    // a vogal que soa depois da consoante i: para t/d antes de [i]
    const soaI = i => {
      const u = U[i + 1]; if (!u || !u.v) return false;
      if ('ií'.includes(u.t)) return true;
      return u.t === 'e' && u.s === ult && u.s !== t && /e(s)?$/.test(p) && n > 1;
    };
    for (let i = 0; i < U.length; i++) {
      const u = U[i], c = u.t, s = u.s, ton = s === t, fimP = i === U.length - 1;
      let o = '';
      if (u.v) {
        const b = base(c), finalAtona = s === ult && !ton && n > 1 && U.slice(i + 1).every(x => !x.v && (x.t === 's'));
        if (u.papel === 'G') o = 'iy'.includes(b) ? 'j' : (b === 'u' || c === 'ü') ? 'w' : b === 'e' ? 'j' : b === 'o' ? 'w' : b;
        else if (c === 'ã') o = 'ɐ̃';
        else if (c === 'õ') o = 'õ';
        else if (c === 'á' || c === 'à') o = 'a';
        else if (c === 'â') o = 'ɐ';
        else if (c === 'é') o = 'ɛ';
        else if (c === 'ê') o = 'e';
        else if (c === 'ó') o = 'ɔ';
        else if (c === 'ô') o = 'o';
        else if (c === 'í' || c === 'y') o = 'i';
        else if (c === 'ú') o = 'u';
        else if (c === 'a') o = finalAtona ? 'ɐ' : 'a';
        else if (c === 'e') o = (finalAtona || (n === 1 && t < 0) || (i === 0 && s !== t && U[1] && 'sx'.includes(U[1].t) && U[1].papel === 'C')) ? 'i' : 'e';
        else if (c === 'o') o = (finalAtona || (n === 1 && t < 0)) ? 'u' : 'o';
        else o = b;
        // nasalização: vogal + m/n em coda, ou tônica antes de consoante nasal
        if (nasalCoda(i) || (u.papel === 'N' && ton && U[i + 1] && ['m', 'n', 'nh'].includes(U[i + 1].t) && U[i + 1].papel === 'A' && 'ae'.includes(c))) {
          const nas = { a: 'ɐ̃', 'ɐ': 'ɐ̃', e: 'ẽ', 'ɛ': 'ẽ', i: 'ĩ', o: 'õ', 'ɔ': 'õ', u: 'ũ' }[o];
          if (nas) o = nas;
          // -am e -em no fim da palavra viram ditongos nasais
          if (nasalCoda(i) && i + 2 >= U.length - (p.endsWith('s') ? 1 : 0)) {
            if (c === 'a' && U[i + 1].t === 'm') o = 'ɐ̃w̃';
            else if ('eé'.includes(c)) o = 'ẽj̃';
          }
        }
        if (u.papel === 'G' && U[i - 1] && 'ãõ'.includes(U[i - 1].t)) o = o === 'w' ? 'w̃' : 'j̃';
        if (c === 'o' && U[i - 1] && U[i - 1].t === 'ã') o = 'w̃';
      } else if (c === 'm' || c === 'n') {
        o = u.papel === 'C' && U[i - 1] && U[i - 1].v ? '' : c;
      } else if (c === 'nh') o = 'ɲ';
      else if (c === 'lh') o = 'ʎ';
      else if (c === 'ch') o = 'ʃ';
      else if (c === 'rr') o = 'h';
      else if (c === 'ss' || c === 'sç' || c === 'ç') o = 's';
      else if (c === 'qu') o = 'k';
      else if (c === 'gu') o = 'ɡ';
      else if (c === 'l') o = u.papel === 'C' ? 'w' : 'l';
      else if (c === 'r') o = (i === 0 || (U[i - 1] && 'nls'.includes(U[i - 1].t) && u.papel === 'A')) ? 'h' : 'ɾ';
      else if (c === 'c') o = 'eiéíê'.includes(prox(i)[0] || '#') ? 's' : 'k';
      else if (c === 'g') o = 'eiéíê'.includes(prox(i)[0] || '#') ? 'ʒ' : 'ɡ';
      else if (c === 'j') o = 'ʒ';
      else if (c === 'h') o = '';
      else if (c === 't') o = soaI(i) ? 't͡ʃ' : 't';
      else if (c === 'd') o = soaI(i) ? 'd͡ʒ' : 'd';
      else if (c === 's') {
        if (U[i + 1] && U[i + 1].t === 'c' && 'eiéí'.includes(U[i + 2] ? U[i + 2].t : '#')) o = '';
        else if (i > 0 && U[i - 1].v && U[i + 1] && U[i + 1].v) o = 'z';
        else if (u.papel === 'C' && U[i + 1] && 'bdgvzmnlrj'.includes(U[i + 1].t[0])) o = 'z';
        else o = 's';
      } else if (c === 'z') o = (fimP || u.papel === 'C') ? 's' : 'z';
      else if (c === 'x') {
        if (i === 0) o = 'ʃ';
        else if (U[i - 1].t === 'e' && i === 1) o = U[i + 1] && U[i + 1].v ? 'z' : 's';
        else if (temAcento(U[i - 1].t)) o = 'ks';
        else o = 'ʃ';
      } else if (c === 'q') o = 'k';
      else if (c === 'w') o = 'w';
      else if (c === 'k') o = 'k';
      else if (c === 'y') o = 'i';
      else o = c === 'g' ? 'ɡ' : c;
      out.push({ s, txt: o });
    }
    return montar(out, n, t);
  }

  // ---------- Espanhol (pronúncia americana geral, com seseo) ----------
  function es(p) {
    const { U, n, t } = analisar(p, 'es');
    const out = [];
    const frente = i => U[i + 1] && 'eiéí'.includes(U[i + 1].t[0]);
    for (let i = 0; i < U.length; i++) {
      const u = U[i], c = u.t, ant = U[i - 1] ? U[i - 1].t : '';
      const aposPausaOuNasal = i === 0 || 'mn'.includes(ant);
      let o = '';
      if (u.v) {
        const b = base(c === 'ü' ? 'u' : c);
        o = u.papel === 'G' ? (b === 'i' || b === 'y' ? 'j' : b === 'u' ? 'w' : b) : b;
      } else if (c === 'ch') o = 't͡ʃ';
      else if (c === 'll' || c === 'y') o = 'ʝ';
      else if (c === 'rr') o = 'r';
      else if (c === 'r') o = (i === 0 || 'nls'.includes(ant)) ? 'r' : 'ɾ';
      else if (c === 'ñ') o = 'ɲ';
      else if (c === 'qu') o = 'k';
      else if (c === 'gu') o = aposPausaOuNasal ? 'ɡ' : 'ɣ';
      else if (c === 'j') o = 'x';
      else if (c === 'g') o = frente(i) ? 'x' : aposPausaOuNasal ? 'ɡ' : 'ɣ';
      else if (c === 'c') o = frente(i) ? 's' : 'k';
      else if (c === 'z') o = 's';
      else if (c === 'h') o = '';
      else if (c === 'b' || c === 'v') o = aposPausaOuNasal ? 'b' : 'β';
      else if (c === 'd') o = (i === 0 || 'nl'.includes(ant)) ? 'd' : 'ð';
      else if (c === 'x') o = 'ks';
      else if (c === 'n') o = U[i + 1] && 'gkcqj'.includes(U[i + 1].t[0]) && !(U[i + 1].t === 'c' && frente(i + 1)) ? 'ŋ' : 'n';
      else if (c === 'q') o = 'k';
      else o = c;
      out.push({ s: u.s, txt: o });
    }
    return montar(out, n, t);
  }

  // ---------- Italiano ----------
  function it(p) {
    const { U, n, t } = analisar(p, 'it');
    const out = [];
    const frente = i => U[i + 1] && 'eièéì'.includes(U[i + 1].t[0]);
    for (let i = 0; i < U.length; i++) {
      const u = U[i], c = u.t;
      let o = '';
      // consoante dobrada: a primeira vira o alongamento da segunda
      if (!u.v && U[i + 1] && U[i + 1].t === c && c.length === 1) {
        const prox = itCons(U, i + 1, frente);
        const ini = prox.replace(/͡.*/, '');
        out.push({ s: u.s, txt: ini });
        continue;
      }
      if (!u.v && U[i + 1] && ((c === 'c' && U[i + 1].t === 'ci') || (c === 'g' && U[i + 1].t === 'gi') || (c === 'c' && U[i + 1].t === 'c' && frente(i + 1)))) {
        out.push({ s: u.s, txt: c === 'g' ? 'd' : 't' }); continue;
      }
      if (u.v) {
        const b = base(c);
        o = u.papel === 'G' ? (b === 'i' ? 'j' : b === 'u' ? 'w' : b) : (c === 'è' ? 'ɛ' : c === 'ò' ? 'ɔ' : b);
      } else o = itCons(U, i, frente);
      out.push({ s: u.s, txt: o });
    }
    return montar(out, n, t);
  }
  function itCons(U, i, frente) {
    const c = U[i].t, ant = U[i - 1], prox = U[i + 1];
    if (c === 'ch') return 'k';
    if (c === 'gh') return 'ɡ';
    if (c === 'gn') return 'ɲ';
    if (c === 'gli') return 'ʎ';
    if (c === 'gl') return 'ʎ';
    if (c === 'sc' || c === 'sci') return 'ʃ';
    if (c === 'ci') return 't͡ʃ';
    if (c === 'gi') return 'd͡ʒ';
    if (c === 'qu' || c === 'q') return 'k';
    if (c === 'c') return frente(i) ? 't͡ʃ' : 'k';
    if (c === 'g') return frente(i) ? 'd͡ʒ' : 'ɡ';
    if (c === 'z') return 't͡s';
    if (c === 'h') return '';
    if (c === 's') return ant && ant.v && prox && prox.v ? 'z' : (prox && 'bdgvlmnr'.includes(prox.t[0]) ? 'z' : 's');
    if (c === 'r') return 'r';
    if (c === 'j') return 'j';
    if (c === 'n' && prox && 'cgkq'.includes(prox.t[0]) && !frente(i + 1)) return 'ŋ';
    return c;
  }

  // ---------- Alemão (aproximação) ----------
  function de(p) {
    const s = p.replace(/ß/g, 'ss');
    const PREF = ['be', 'ge', 'er', 'ver', 'zer', 'ent', 'emp'];
    const NAO_PREF = ['gestern', 'gegen', 'erste', 'ernst', 'erde', 'beste', 'besser', 'bett', 'berg'];
    const pref = NAO_PREF.some(x => s.startsWith(x)) ? null : PREF.find(x => s.startsWith(x) && s.length > x.length + 2 && !isV(s[x.length]) || (x === 'be' || x === 'ge') && s.startsWith(x) && s.length > 4 && !isV(s[2]));
    const PREF_IPA = { be: 'bə', ge: 'ɡə', er: 'ɛɐ̯', ver: 'fɐ', zer: 't͡sɐ', ent: 'ɛnt', emp: 'ɛmp' };
    let o = pref ? PREF_IPA[pref] : '', i = pref ? pref.length : 0, nucleo = pref ? 1 : 0, marcou = false;
    const ATAQ2 = /^(ʃt|ʃp|ʃv|ʃl|ʃm|ʃn|ʃʁ|pl|pʁ|bl|bʁ|kl|kʁ|kv|ɡl|ɡʁ|fl|fʁ|tʁ|dʁ|tv)$/;
    const marca = () => { // ˈ antes do ataque da sílaba tônica
      if (marcou) return;
      if (nucleo === (pref ? 1 : 0)) {
        const m = o.match(/[^aeiouyɛøœɪʊʏɔəɐː̯ˈ]*$/);
        const grupo = m ? m[0] : '';
        const un = grupo.match(/.͡.|./gu) || [];
        let n = un.length;
        if (o.length > grupo.length) n = un.length >= 2 && ATAQ2.test(un.slice(-2).join('')) ? 2 : Math.min(1, un.length);
        const tam = un.slice(un.length - n).join('').length;
        if (pref || o.length > grupo.length) { const k = o.length - tam; o = o.slice(0, k) + 'ˈ' + o.slice(k); }
        marcou = true;
      }
    };
    const consDepois = j => { let k = j; while (k < s.length && !isV(s[k])) k++; return k - j; };
    while (i < s.length) {
      const r = s.slice(i), c = s[i], ant = s[i - 1] || '';
      let m;
      const fimSil = j => j >= s.length || !isV(s[j]);
      if (isV(c)) {
        marca();
        const tri = r.slice(0, 2);
        if (tri === 'ig' && i + 2 === s.length && i > 0) { o += 'ɪç'; i += 2; nucleo++; continue; }
        if (['ei', 'ai', 'ey', 'ay'].includes(tri)) { o += 'aɪ̯'; i += 2; nucleo++; continue; }
        if (['eu', 'äu'].includes(tri)) { o += 'ɔʏ̯'; i += 2; nucleo++; continue; }
        if (tri === 'au') { o += 'aʊ̯'; i += 2; nucleo++; continue; }
        if (tri === 'ie') { o += 'iː'; i += 2; nucleo++; continue; }
        const longo = { a: 'aː', e: 'eː', i: 'iː', o: 'oː', u: 'uː', 'ä': 'ɛː', 'ö': 'øː', 'ü': 'yː', y: 'yː' }[c];
        const curto = { a: 'a', e: 'ɛ', i: 'ɪ', o: 'ɔ', u: 'ʊ', 'ä': 'ɛ', 'ö': 'œ', 'ü': 'ʏ', y: 'ʏ' }[c];
        let j = i + 1;
        let ehLongo;
        if (s[j] === c || (s[j] === 'h' && !isV(s[j + 1] || '#') )) { ehLongo = true; j++; }
        else if (s[j] === 'h') { ehLongo = true; j++; }
        else ehLongo = consDepois(j) <= 1 && j < s.length || j >= s.length;
        if (s.startsWith('sch', j) || s.startsWith('ch', j) && consDepois(j) === 2) ehLongo = s.startsWith('ch', j) ? false : ehLongo;
        if (s.startsWith('ck', j) || s.startsWith('tz', j) || s.startsWith('ng', j)) ehLongo = false;
        // e átono: schwa; -er final: ɐ
        const tonico = nucleo === (pref ? 1 : 0);
        nucleo++;
        if (c === 'e' && !tonico && s[j] !== 'e' && s[j] !== 'h') {
          if (/^r[ns]?$/.test(s.slice(j))) { o += 'ɐ' + s.slice(j + 1); i = s.length; continue; }
          o += 'ə'; i = j; continue;
        }
        o += ehLongo ? longo : curto; i = j; continue;
      }
      if ((m = r.match(/^sch/))) { o += 'ʃ'; i += 3; continue; }
      if ((m = r.match(/^chs/))) { o += 'ks'; i += 3; continue; }
      if (r.startsWith('ch')) { o += /[aou]$/.test(s.slice(0, i)) && !/[ae]u$/.test(s.slice(0, i)) ? 'x' : 'ç'; i += 2; continue; }
      if (r.startsWith('ck')) { o += 'k'; i += 2; continue; }
      if (r.startsWith('ph')) { o += 'f'; i += 2; continue; }
      if (r.startsWith('th')) { o += 't'; i += 2; continue; }
      if (r.startsWith('pf')) { o += 'p͡f'; i += 2; continue; }
      if (r.startsWith('tz')) { o += 't͡s'; i += 2; continue; }
      if (r.startsWith('qu')) { o += 'kv'; i += 2; continue; }
      if (r.startsWith('ng')) { o += 'ŋ'; i += 2; continue; }
      if (r.startsWith('nk')) { o += 'ŋk'; i += 2; continue; }
      if (r.startsWith('ig') && i + 2 === s.length && i > 0) { o += 'ɪç'; i += 2; nucleo++; continue; }
      if ((i === 0 || (pref && i === pref.length)) && /^s[pt]/.test(r)) { o += 'ʃ'; i += 1; continue; }
      if (r.startsWith('ss')) { o += 's'; i += 2; continue; }
      const devoz = fimSil(i + 1) && (i + 1 >= s.length || !isV(s[i + 1]));
      if (c === 's') { o += (isV(s[i + 1] || '#') && (i === 0 || isV(ant) || 'lnrm'.includes(ant))) ? 'z' : 's'; i++; continue; }
      if (c === 'b') { o += devoz ? 'p' : 'b'; i++; continue; }
      if (c === 'd') { o += devoz ? 't' : 'd'; i++; continue; }
      if (c === 'g') { o += devoz ? 'k' : 'ɡ'; i++; continue; }
      if (c === 'v') { o += 'f'; i++; continue; }
      if (c === 'w') { o += 'v'; i++; continue; }
      if (c === 'z') { o += 't͡s'; i++; continue; }
      if (c === 'j') { o += 'j'; i++; continue; }
      if (c === 'c') { o += 'k'; i++; continue; }
      if (c === 'x') { o += 'ks'; i++; continue; }
      if (c === 'h') { o += isV(s[i + 1] || '#') ? 'h' : ''; i++; continue; }
      if (c === 'r') { o += isV(s[i + 1] || '#') || !isV(ant) ? 'ʁ' : 'ɐ̯'; i++; continue; }
      if (s[i + 1] === c) { o += c; i += 2; continue; }
      o += c; i++;
    }
    if (!pref && (o.match(/[aeiouyɛøœɪʊʏɔəɐ](?!̯)/g) || []).length < 2) o = o.replace('ˈ', '');
    if (!pref && !o.includes('ˈ') && (o.match(/[aeiouyɛøœɪʊʏɔəɐ](?!̯)/g) || []).length >= 2) o = 'ˈ' + o;
    if (!pref && o.includes('ˈ') && o.indexOf('ˈ') > 0 && !/[aeiouyɛøœɪʊʏɔəɐ]/.test(o.slice(0, o.indexOf('ˈ')))) o = 'ˈ' + o.replace('ˈ', '');
    return o;
  }

  // ---------- Inglês (CMUdict) ----------
  const ARPA = {
    AA: 'ɑ', AE: 'æ', AH: 'ʌ', AO: 'ɔ', AW: 'aʊ', AY: 'aɪ', EH: 'ɛ', ER: 'ɝ', EY: 'eɪ', IH: 'ɪ', IY: 'i', OW: 'oʊ', OY: 'ɔɪ', UH: 'ʊ', UW: 'u',
    B: 'b', CH: 't͡ʃ', D: 'd', DH: 'ð', F: 'f', G: 'ɡ', HH: 'h', JH: 'd͡ʒ', K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ŋ', P: 'p', R: 'ɹ', S: 's', SH: 'ʃ',
    T: 't', TH: 'θ', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ',
  };
  const ATAQUES_EN = new Set(['pl', 'pɹ', 'bl', 'bɹ', 'tɹ', 'dɹ', 'kl', 'kɹ', 'kw', 'ɡl', 'ɡɹ', 'fl', 'fɹ', 'θɹ', 'ʃɹ', 'sp', 'st', 'sk', 'sm', 'sn', 'sl', 'sw', 'pj', 'bj', 'kj', 'fj', 'mj', 'hj', 'tw', 'dw']);
  let dicEN = null;
  function carregarEN() {
    if (!dicEN) dicEN = fetch('ingles-cmudict.txt').then(r => r.text()).then(txt => {
      const m = new Map();
      txt.split('\n').forEach(l => { const k = l.indexOf(' '); if (k > 0) m.set(l.slice(0, k), l.slice(k + 1)); });
      return m;
    });
    return dicEN;
  }
  function arpaParaIPA(arpa) {
    const fon = arpa.split(' ');
    const seg = fon.map(f => {
      const m = f.match(/^([A-Z]+)(\d)?$/); if (!m) return { t: '' };
      let t = ARPA[m[1]] || '';
      if (m[1] === 'AH' && m[2] === '0') t = 'ə';
      if (m[1] === 'ER' && m[2] === '0') t = 'ɚ';
      return { t, v: m[2] !== undefined, ac: m[2] };
    });
    let o = '';
    seg.forEach((x, i) => {
      if (x.v && (x.ac === '1' || x.ac === '2') && seg.filter(y => y.v).length > 1) {
        // ataque: até duas consoantes antes da vogal, se formarem um ataque possível
        let k = o.length, ant = [];
        for (let j = i - 1; j >= 0 && !seg[j].v; j--) ant.unshift(seg[j].t);
        let n = 0;
        if (ant.length >= 1) n = 1;
        if (ant.length >= 2 && ATAQUES_EN.has(ant.slice(-2).join(''))) n = 2;
        const tam = ant.slice(-n).join('').length;
        k = o.length - tam;
        o = o.slice(0, k) + (x.ac === '1' ? 'ˈ' : 'ˌ') + o.slice(k);
      }
      o += x.t;
    });
    return o;
  }

  const IDIOMAS = [
    ['pt', 'Português (Brasil)'], ['es', 'Espanhol'], ['it', 'Italiano'], ['de', 'Alemão'], ['en', 'Inglês (Estados Unidos)'],
  ];
  const FUNC = { pt, es, it, de };

  async function transcrever(texto, lang) {
    const partes = texto.normalize('NFC').split(/([^\p{L}'’-]+)/u).filter(x => x !== '');
    let dic = null;
    if (lang === 'en') dic = await carregarEN();
    return partes.map(orig => {
      if (!/\p{L}/u.test(orig)) return { orig, ipa: orig.replace(/\s+/g, ' '), sep: true };
      const p = orig.toLowerCase().replace(/’/g, "'");
      if (lang === 'en') {
        const a = dic.get(p) || dic.get(p.replace(/'s$/, '')) && (dic.get(p.replace(/'s$/, '')) + ' Z');
        return a ? { orig, ipa: arpaParaIPA(a) } : { orig, ipa: '', falta: true };
      }
      const f = FUNC[lang];
      try {
        return { orig, ipa: p.split('-').map(x => x.replace(/'/g, '')).filter(Boolean).map(f).join('-') };
      } catch (e) { return { orig, ipa: '', falta: true }; }
    });
  }

  window.TranscreverIPA = { IDIOMAS, transcrever };
})();
