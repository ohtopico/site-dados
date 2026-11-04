/* Transcrição para o IPA de línguas escritas em romanização (ou na própria escrita, quando a
   conversão é direta): tupi antigo, guarani, mandarim (pinyin), japonês (rōmaji ou kana),
   coreano (romanização revisada ou hangul), árabe (romanização), suaíli, iorubá e turco.
   Cada função recebe uma palavra em minúsculas e devolve o IPA (ou lança erro se não reconhece).
   As regras são aproximadas e foram escritas para esta página. */
(function () {
  const NFD = s => s.normalize('NFD');

  // ---------- Motor simples para ortografias quase fonêmicas ----------
  // tabela: [[grafia, ipa, vogal?]], tentada da grafia mais longa para a mais curta.
  // acento: 'ultima' | 'penultima' | 'nenhum'; acentoGrafico: vogais com acento marcam a tônica.
  function motor(tabela, opcoes = {}) {
    const t = [...tabela].sort((a, b) => b[0].length - a[0].length);
    return function (p) {
      const seg = [];
      for (let i = 0; i < p.length;) {
        const r = t.find(([g]) => p.startsWith(g, i));
        if (!r) { if ("-'".includes(p[i]) && !opcoes.apostrofo) { i++; continue; } throw new Error('letra ' + p[i]); }
        seg.push({ ipa: r[1], v: !!r[2], tonico: !!r[3] });
        i += r[0].length;
      }
      if (opcoes.depois) opcoes.depois(seg);
      const vog = seg.map((s, k) => s.v ? k : -1).filter(k => k >= 0);
      if (vog.length > 1 && opcoes.acento !== 'nenhum') {
        let alvo = seg.findIndex(s => s.tonico);
        if (alvo < 0) alvo = opcoes.acento === 'penultima' ? vog[vog.length - 2] : vog[vog.length - 1];
        let k = alvo;
        if (k > 0 && !seg[k - 1].v) k--;
        seg[k].ipa = 'ˈ' + seg[k].ipa;
      }
      return seg.map(s => s.ipa).join('');
    };
  }

  // ---------- Tupi antigo (grafia de Eduardo Navarro) ----------
  const tupi = motor([
    ['a', 'a', 1], ['e', 'e', 1], ['i', 'i', 1], ['o', 'o', 1], ['u', 'u', 1], ['y', 'ɨ', 1],
    ['á', 'a', 1, 1], ['é', 'e', 1, 1], ['í', 'i', 1, 1], ['ó', 'o', 1, 1], ['ú', 'u', 1, 1], ['ý', 'ɨ', 1, 1],
    ['ã', 'ã', 1], ['ẽ', 'ẽ', 1], ['ĩ', 'ĩ', 1], ['õ', 'õ', 1], ['ũ', 'ũ', 1], ['ỹ', 'ɨ̃', 1],
    ['î', 'j'], ['û', 'w'], ['ŷ', 'ɨ̯'], ['gû', 'ɡʷ'], ['kû', 'kʷ'],
    ['mb', 'ᵐb'], ['nd', 'ⁿd'], ['ng', 'ᵑɡ'], ['nh', 'ɲ'], ['ç', 's'],
    ['b', 'β'], ['k', 'k'], ['c', 'k'], ['g', 'ɡ'], ['m', 'm'], ['n', 'n'], ['p', 'p'], ['r', 'ɾ'], ['s', 's'], ['t', 't'],
    ['x', 'ʃ'], ['j', 'j'], ['w', 'w'], ['h', 'h'], ["'", 'ʔ'], ['’', 'ʔ'], ['-', ''],
  ], { acento: 'ultima', apostrofo: true });

  // ---------- Guarani (grafia oficial do Paraguai) ----------
  const guarani = motor([
    ['a', 'a', 1], ['e', 'e', 1], ['i', 'i', 1], ['o', 'o', 1], ['u', 'u', 1], ['y', 'ɨ', 1],
    ['á', 'a', 1, 1], ['é', 'e', 1, 1], ['í', 'i', 1, 1], ['ó', 'o', 1, 1], ['ú', 'u', 1, 1], ['ý', 'ɨ', 1, 1],
    ['ã', 'ã', 1], ['ẽ', 'ẽ', 1], ['ĩ', 'ĩ', 1], ['õ', 'õ', 1], ['ũ', 'ũ', 1], ['ỹ', 'ɨ̃', 1],
    ['ch', 'ʃ'], ['g̃', 'ŋ'], ['mb', 'ᵐb'], ['nd', 'ⁿd'], ['ng', 'ᵑɡ'], ['nt', 'ⁿt'], ['rr', 'r'], ['ñ', 'ɲ'],
    ['g', 'ɣ'], ['h', 'h'], ['j', 'd͡ʒ'], ['k', 'k'], ['l', 'l'], ['m', 'm'], ['n', 'n'], ['p', 'p'], ['r', 'ɾ'], ['s', 's'],
    ['t', 't'], ['v', 'ʋ'], ["'", 'ʔ'], ['’', 'ʔ'], ['-', ''],
  ], { acento: 'ultima', apostrofo: true });

  // ---------- Suaíli ----------
  const suaili = motor([
    ['a', 'ɑ', 1], ['e', 'ɛ', 1], ['i', 'i', 1], ['o', 'ɔ', 1], ['u', 'u', 1],
    ["ng'", 'ŋ'], ['ng’', 'ŋ'], ['ny', 'ɲ'], ['ng', 'ᵑɡ'], ['mb', 'ᵐb'], ['nd', 'ⁿd'], ['nj', 'ⁿd͡ʒ'], ['nz', 'ⁿz'],
    ['ch', 't͡ʃ'], ['sh', 'ʃ'], ['th', 'θ'], ['dh', 'ð'], ['gh', 'ɣ'],
    ['b', 'b'], ['d', 'd'], ['f', 'f'], ['g', 'ɡ'], ['h', 'h'], ['j', 'd͡ʒ'], ['k', 'k'], ['l', 'l'], ['m', 'm'], ['n', 'n'],
    ['p', 'p'], ['r', 'r'], ['s', 's'], ['t', 't'], ['v', 'v'], ['w', 'w'], ['y', 'j'], ['z', 'z'], ['-', ''],
  ], { acento: 'penultima' });

  // ---------- Turco ----------
  const turcoBase = motor([
    ['a', 'a', 1], ['e', 'e', 1], ['ı', 'ɯ', 1], ['i', 'i', 1], ['o', 'o', 1], ['ö', 'ø', 1], ['u', 'u', 1], ['ü', 'y', 1],
    ['â', 'aː', 1], ['î', 'iː', 1], ['û', 'uː', 1],
    ['b', 'b'], ['c', 'd͡ʒ'], ['ç', 't͡ʃ'], ['d', 'd'], ['f', 'f'], ['g', 'ɡ'], ['ğ', 'ː'], ['h', 'h'], ['j', 'ʒ'], ['k', 'k'],
    ['l', 'l'], ['m', 'm'], ['n', 'n'], ['p', 'p'], ['r', 'ɾ'], ['s', 's'], ['ş', 'ʃ'], ['t', 't'], ['v', 'v'], ['y', 'j'], ['z', 'z'], ["'", ''],
  ], { acento: 'ultima', depois: seg => { // ğ entre vogais iguais some; depois de vogal, alonga
    seg.forEach((s, k) => { if (s.ipa === 'ː') { s.v = false; if (!seg[k - 1] || !seg[k - 1].v) s.ipa = ''; } });
  } });

  const turco = p => turcoBase(p.replace(/\u0307/g, ''));

  // ---------- Árabe (romanização) ----------
  // Aceita a romanização acadêmica (ḥ, ṣ, ʿ, ā) e a usada na internet (7, 3, 2, 5, aa).
  const arabeTab = [
    ['th', 'θ'], ['dh', 'ð'], ['kh', 'x'], ['gh', 'ɣ'], ['sh', 'ʃ'],
    ['ḥ', 'ħ'], ['7', 'ħ'], ['ḫ', 'x'], ['5', 'x'], ['ṣ', 'sˤ'], ['ḍ', 'dˤ'], ['ṭ', 'tˤ'], ['ẓ', 'ðˤ'], ['ġ', 'ɣ'], ['š', 'ʃ'], ['ǧ', 'd͡ʒ'], ['ṯ', 'θ'], ['ḏ', 'ð'],
    ['ʿ', 'ʕ'], ['`', 'ʕ'], ['‘', 'ʕ'], ['3', 'ʕ'], ['ʾ', 'ʔ'], ["'", 'ʔ'], ['’', 'ʔ'], ['2', 'ʔ'],
    ['aa', 'aː', 1], ['ā', 'aː', 1], ['â', 'aː', 1], ['ii', 'iː', 1], ['ee', 'iː', 1], ['ī', 'iː', 1], ['î', 'iː', 1],
    ['uu', 'uː', 1], ['oo', 'uː', 1], ['ū', 'uː', 1], ['û', 'uː', 1],
    ['a', 'a', 1], ['i', 'i', 1], ['u', 'u', 1], ['e', 'a', 1], ['o', 'u', 1],
    ['b', 'b'], ['t', 't'], ['j', 'd͡ʒ'], ['d', 'd'], ['r', 'r'], ['z', 'z'], ['s', 's'], ['f', 'f'], ['q', 'q'], ['k', 'k'],
    ['l', 'l'], ['m', 'm'], ['n', 'n'], ['h', 'h'], ['w', 'w'], ['y', 'j'], ['g', 'ɡ'], ['v', 'v'], ['p', 'p'], ['-', ''],
  ];
  const arabe = motor(arabeTab, { acento: 'nenhum', apostrofo: true, depois: seg => {
    // consoante dobrada vira consoante longa (muʿallima -> muʕalːima)
    for (let k = seg.length - 1; k > 0; k--) if (!seg[k].v && seg[k].ipa && seg[k].ipa === seg[k - 1].ipa) { seg[k - 1].ipa += 'ː'; seg[k].ipa = ''; }
  } });

  // ---------- Iorubá (com tons) ----------
  function ioruba(p) {
    const d = NFD(p);
    const s = []; // {base, sub (ponto embaixo), tom}
    for (const ch of d) {
      if (/[̀-ͯ]/.test(ch)) {
        const u = s[s.length - 1]; if (!u) continue;
        if (ch === '̣') u.ponto = true; else if (ch === '́') u.tom = '́'; else if (ch === '̀') u.tom = '̀'; else if (ch === '̄') u.tom = '̄';
      } else s.push({ c: ch });
    }
    const V = { a: 'a', e: 'e', i: 'i', o: 'o', u: 'u' }, VP = { e: 'ɛ', o: 'ɔ' };
    const NAS = { a: 'ã', 'ɛ': 'ɛ̃', i: 'ĩ', 'ɔ': 'ɔ̃', u: 'ũ', e: 'ẽ', o: 'õ' };
    let o = '';
    for (let k = 0; k < s.length; k++) {
      const u = s[k], c = u.c, n = s[k + 1];
      if (V[c]) {
        let v = u.ponto && VP[c] ? VP[c] : V[c];
        // vogal + n no fim da sílaba: vogal nasal
        if (n && n.c === 'n' && (!s[k + 2] || !V[s[k + 2].c])) { v = NAS[v] || v; k++; }
        o += v + (u.tom || '');
        continue;
      }
      if (c === 'g' && n && n.c === 'b') { o += 'ɡ͡b'; k++; continue; }
      if (c === 's' && u.ponto) { o += 'ʃ'; continue; }
      if (c === 'n' && u.tom) { o += 'n' + u.tom; continue; } // n silábico com tom
      const C = { b: 'b', d: 'd', f: 'f', g: 'ɡ', h: 'h', j: 'ɟ', k: 'k', l: 'l', m: 'm', n: 'n', p: 'k͡p', r: 'ɾ', s: 's', t: 't', w: 'w', y: 'j', "'": '', '-': '' };
      if (C[c] === undefined) throw new Error('letra ' + c);
      o += C[c];
    }
    return o.normalize('NFC');
  }

  // ---------- Mandarim (pinyin) ----------
  const ZH_INI = { b: 'p', p: 'pʰ', m: 'm', f: 'f', d: 't', t: 'tʰ', n: 'n', l: 'l', g: 'k', k: 'kʰ', h: 'x', j: 't͡ɕ', q: 't͡ɕʰ', x: 'ɕ',
    zh: 'ʈ͡ʂ', ch: 'ʈ͡ʂʰ', sh: 'ʂ', r: 'ʐ', z: 't͡s', c: 't͡sʰ', s: 's', '': '' };
  const ZH_FIN = { a: 'a', o: 'o', e: 'ɤ', ai: 'aɪ̯', ei: 'eɪ̯', ao: 'ɑʊ̯', ou: 'oʊ̯', an: 'an', en: 'ən', ang: 'ɑŋ', eng: 'ɤŋ', ong: 'ʊŋ', er: 'aɚ',
    i: 'i', ia: 'ja', ie: 'jɛ', iao: 'jɑʊ̯', iu: 'joʊ̯', ian: 'jɛn', in: 'in', iang: 'jɑŋ', ing: 'iŋ', iong: 'jʊŋ',
    u: 'u', ua: 'wa', uo: 'wo', uai: 'waɪ̯', ui: 'weɪ̯', uan: 'wan', un: 'wən', uang: 'wɑŋ', ueng: 'wɤŋ',
    'ü': 'y', 'üe': 'ɥɛ', 'üan': 'ɥɛn', 'ün': 'yn' };
  const ZH_ZERO = { yi: 'i', ya: 'ia', ye: 'ie', yao: 'iao', you: 'iu', yan: 'ian', yin: 'in', yang: 'iang', ying: 'ing', yong: 'iong',
    yu: 'ü', yue: 'üe', yuan: 'üan', yun: 'ün', wu: 'u', wa: 'ua', wo: 'uo', wai: 'uai', wei: 'ui', wan: 'uan', wen: 'un', wang: 'uang', weng: 'ueng' };
  const ZH_TOM = { 1: '˥', 2: '˧˥', 3: '˨˩˦', 4: '˥˩', 5: '' };
  function zhSilaba(s) { // s sem tom; devolve IPA ou null
    if (ZH_ZERO[s]) return zhFinal('', ZH_ZERO[s]);
    if (ZH_FIN[s] !== undefined && /^[aoe]/.test(s)) return ZH_FIN[s];
    for (const ini of ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's']) {
      if (!s.startsWith(ini)) continue;
      let fin = s.slice(ini.length);
      if ('jqx'.includes(ini) && fin[0] === 'u') fin = 'ü' + fin.slice(1);
      if (ZH_FIN[fin] === undefined) return null;
      return zhFinal(ini, fin);
    }
    return null;
  }
  function zhFinal(ini, fin) {
    let f = ZH_FIN[fin];
    if (fin === 'i' && ['z', 'c', 's'].includes(ini)) f = 'ɹ̩';
    if (fin === 'i' && ['zh', 'ch', 'sh', 'r'].includes(ini)) f = 'ɻ̩';
    return ZH_INI[ini] + f;
  }
  function mandarim(p) {
    // separa os tons marcados nas vogais (ā á ǎ à) e troca v/ü
    let txt = '', tons = [];
    for (const ch of NFD(p.replace(/v/g, 'ü'))) {
      const t = { '̄': 1, '́': 2, '̌': 3, '̀': 4 }[ch];
      if (t) { tons.push([txt.length, t]); continue; }
      if (ch === '\u0308' && txt.endsWith('u')) { txt = txt.slice(0, -1) + 'ü'; continue; }
      txt += ch;
    }
    txt = txt.normalize('NFC');
    // divide em sílabas (a mais longa que deixa o resto divisível)
    const partes = txt.split(/['’-]/);
    const sil = [];
    let pos = 0;
    for (const parte of partes) {
      const memo = {};
      const dividir = i => {
        if (i === parte.length) return [];
        if (memo[i] !== undefined) return memo[i];
        for (let L = Math.min(6, parte.length - i); L >= 1; L--) {
          const s = parte.slice(i, i + L);
          if (/\d/.test(s)) continue;
          if (zhSilaba(s) === null) continue;
          let j = i + L, num = null;
          if (/[1-5]/.test(parte[j] || '')) { num = +parte[j]; j++; }
          const resto = dividir(j);
          if (resto) return (memo[i] = [{ s, ini: i, fim: i + L, num }, ...resto]);
        }
        return (memo[i] = null);
      };
      const r = dividir(0);
      if (!r) throw new Error('pinyin');
      r.forEach(x => sil.push({ ...x, ini: x.ini + pos, fim: x.fim + pos }));
      pos += parte.length + 1;
    }
    return sil.map(x => {
      const tm = tons.find(([k]) => k > x.ini && k <= x.fim);
      const tom = x.num || (tm ? tm[1] : 5);
      return zhSilaba(x.s) + ZH_TOM[tom];
    }).join(' ').replace(/ /g, '');
  }

  // ---------- Japonês (rōmaji Hepburn ou kana) ----------
  const KANA = 'あa いi うu えe おo かka きki くku けke こko さsa しshi すsu せse そso たta ちchi つtsu てte とto なna にni ぬnu ねne のno はha ひhi ふfu へhe ほho まma みmi むmu めme もmo やya ゆyu よyo らra りri るru れre ろro わwa をo んn\' がga ぎgi ぐgu げge ごgo ざza じji ずzu ぜze ぞzo だda ぢji づzu でde どdo ばba びbi ぶbu べbe ぼbo ぱpa ぴpi ぷpu ぺpe ぽpo ゃya ゅyu ょyo ぁa ぃi ぅu ぇe ぉo';
  const KANA_MAP = {};
  KANA.split(' ').forEach(x => { const k = x[0], r = x.slice(1); KANA_MAP[k] = r; KANA_MAP[String.fromCharCode(k.charCodeAt(0) + 0x60)] = r; });
  function kanaParaRomaji(p) {
    let o = '';
    const chars = [...p];
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i], n = chars[i + 1];
      if (c === 'っ' || c === 'ッ') { const r = KANA_MAP[n] || ''; o += r.startsWith('ch') ? 't' : r[0] || ''; continue; }
      if (c === 'ー') { const v = o.match(/[aeiou]$/); o += v ? v[0] : ''; continue; }
      if (n && 'ゃゅょャュョ'.includes(n) && KANA_MAP[c]) {
        const base = KANA_MAP[c].slice(0, -1), y = KANA_MAP[n];
        o += /^(sh|ch|j)$/.test(base) ? base + y.slice(1) : base + y; i++; continue;
      }
      if (KANA_MAP[c] === undefined) throw new Error('kanji');
      o += KANA_MAP[c];
    }
    return o;
  }
  const JA_SIL = [
    ['kya', 'kʲa'], ['kyu', 'kʲɯ'], ['kyo', 'kʲo'], ['sha', 'ɕa'], ['shu', 'ɕɯ'], ['sho', 'ɕo'], ['shi', 'ɕi'], ['she', 'ɕe'],
    ['cha', 't͡ɕa'], ['chu', 't͡ɕɯ'], ['cho', 't͡ɕo'], ['chi', 't͡ɕi'], ['che', 't͡ɕe'], ['tsu', 't͡sɯ'],
    ['nya', 'ɲa'], ['nyu', 'ɲɯ'], ['nyo', 'ɲo'], ['hya', 'ça'], ['hyu', 'çɯ'], ['hyo', 'ço'], ['mya', 'mʲa'], ['myu', 'mʲɯ'], ['myo', 'mʲo'],
    ['rya', 'ɾʲa'], ['ryu', 'ɾʲɯ'], ['ryo', 'ɾʲo'], ['gya', 'ɡʲa'], ['gyu', 'ɡʲɯ'], ['gyo', 'ɡʲo'], ['bya', 'bʲa'], ['byu', 'bʲɯ'], ['byo', 'bʲo'],
    ['pya', 'pʲa'], ['pyu', 'pʲɯ'], ['pyo', 'pʲo'], ['ja', 'd͡ʑa'], ['ju', 'd͡ʑɯ'], ['jo', 'd͡ʑo'], ['ji', 'd͡ʑi'], ['je', 'd͡ʑe'],
    ['fu', 'ɸɯ'], ['hi', 'çi'], ['ni', 'ɲi'], ['si', 'ɕi'], ['ti', 't͡ɕi'], ['tu', 't͡sɯ'], ['zu', 'zɯ'], ['di', 'd͡ʑi'], ['du', 'zɯ'],
  ];
  const JA_C = { k: 'k', s: 's', t: 't', n: 'n', h: 'h', m: 'm', y: 'j', r: 'ɾ', w: 'w', g: 'ɡ', z: 'z', d: 'd', b: 'b', p: 'p', f: 'ɸ', v: 'v', j: 'd͡ʑ' };
  const JA_V = { a: 'a', i: 'i', u: 'ɯ', e: 'e', o: 'o', 'ā': 'aː', 'ī': 'iː', 'ū': 'ɯː', 'ē': 'eː', 'ō': 'oː', 'â': 'aː', 'î': 'iː', 'û': 'ɯː', 'ê': 'eː', 'ô': 'oː' };
  function japones(p) {
    if (/[぀-ヿ]/.test(p)) p = kanaParaRomaji(p.replace(/([ちん])は$/, '$1わ'));
    if (/[一-鿿]/.test(p)) throw new Error('kanji');
    if (p === 'wo') return 'o';
    const seg = []; // {ipa, v, surda}
    const SURDA = /^(k|s|t|p|h|ɕ|t͡ɕ|t͡s|ç|ɸ)/;
    for (let i = 0; i < p.length;) {
      const r = p.slice(i);
      if (r[0] === "'" || r[0] === '-') { i++; continue; }
      if (r[0] === 'n' && (r.length === 1 || r[1] === "'" || (!JA_V[r[1]] && r[1] !== 'y'))) {
        const n = r[1] === "'" ? r[2] : r[1];
        seg.push({ ipa: !n ? 'ɴ' : 'pbm'.includes(n) ? 'm' : 'kg'.includes(n) ? 'ŋ' : 'n' }); i += r[1] === "'" ? 2 : 1; continue;
      }
      if (r[0] === r[1] && JA_C[r[0]] && r[0] !== 'n') { seg.push({ ipa: r[0] === 's' && r[2] === 'h' ? 'ɕ' : JA_C[r[0]] === 'd͡ʑ' ? 'd' : JA_C[r[0]], dobra: true }); i++; continue; }
      if (r.startsWith('tch')) { seg.push({ ipa: 't', dobra: true }); i++; continue; }
      if (JA_V[r[0]]) {
        // ou e ei longos; vogal igual repetida
        let v = JA_V[r[0]], L = 1;
        if ((r[0] === 'o' && r[1] === 'u') || (r[0] === r[1] && 'aiueo'.includes(r[0])) || (r[0] === 'e' && r[1] === 'i')) { v += 'ː'; L = 2; }
        seg.push({ ipa: v, v: true }); i += L; continue;
      }
      const sil = JA_SIL.find(([g]) => r.startsWith(g));
      if (sil) {
        const vog = sil[1].match(/[aiɯeo]$/)[0];
        seg.push({ ipa: sil[1].slice(0, -1) }); seg.push({ ipa: vog, v: true }); i += sil[0].length;
        if (r[sil[0].length] === r[sil[0].length - 1] && 'aiueo'.includes(r[sil[0].length]) || (vog === 'o' && r[sil[0].length] === 'u')) { seg[seg.length - 1].ipa += 'ː'; i++; }
        continue;
      }
      if (JA_C[r[0]]) { seg.push({ ipa: JA_C[r[0]] }); i++; continue; }
      throw new Error('letra ' + r[0]);
    }
    // i e u entre consoantes surdas (ou u final depois de s) ficam surdos: desu -> desɯ̥
    seg.forEach((s, k) => {
      if (!s.v || !/^[iɯ]$/.test(s.ipa)) return;
      const a = seg[k - 1], d = seg[k + 1];
      if (a && !a.v && SURDA.test(a.ipa) && ((d && !d.v && SURDA.test(d.ipa)) || (!d && a.ipa === 's'))) s.ipa += '̥';
    });
    return seg.map(s => s.ipa).join('');
  }

  // ---------- Coreano (romanização revisada ou hangul) ----------
  const KO_L = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
  const KO_V = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
  const KO_T = ['', 'g', 'kk', 'gs', 'n', 'nj', 'nh', 'd', 'l', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'b', 'bs', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', 'h'];
  const KO_VIPA = { a: 'a', ae: 'ɛ', ya: 'ja', yae: 'jɛ', eo: 'ʌ', e: 'e', yeo: 'jʌ', ye: 'je', o: 'o', wa: 'wa', wae: 'wɛ', oe: 'we', yo: 'jo', u: 'u', wo: 'wʌ', we: 'we', wi: 'ɥi', yu: 'ju', eu: 'ɯ', ui: 'ɰi', i: 'i' };
  function koDeHangul(p) {
    const sil = [];
    for (const ch of p) {
      const c = ch.charCodeAt(0) - 0xAC00;
      if (c < 0 || c > 11171) throw new Error('hangul');
      sil.push({ on: KO_L[Math.floor(c / 588)], v: KO_V[Math.floor((c % 588) / 28)], cod: KO_T[c % 28] });
    }
    return sil;
  }
  function koDeRomanizacao(p) {
    const VS = ['yae', 'wae', 'yeo', 'eo', 'eu', 'ae', 'oe', 'wi', 'ui', 'ya', 'ye', 'yo', 'yu', 'wa', 'wo', 'we', 'a', 'e', 'i', 'o', 'u'];
    const CS = ['kk', 'tt', 'pp', 'ss', 'jj', 'ch', 'ng', 'g', 'k', 'n', 'd', 't', 'r', 'l', 'm', 'b', 'p', 's', 'j', 'h'];
    const tok = [];
    for (let i = 0; i < p.length;) {
      if (p[i] === '-' || p[i] === "'") { tok.push({ sep: true }); i++; continue; }
      const v = VS.find(x => p.startsWith(x, i));
      if (v) { tok.push({ v }); i += v.length; continue; }
      const c = CS.find(x => p.startsWith(x, i));
      if (c) { tok.push({ c }); i += c.length; continue; }
      throw new Error('letra ' + p[i]);
    }
    const sil = [];
    let cons = [];
    for (const t of tok) {
      if (t.sep) { if (cons.length && sil.length) { sil[sil.length - 1].cod = cons.join(''); cons = []; } continue; }
      if (t.c) { cons.push(t.c); continue; }
      let on = '';
      if (sil.length) {
        const ant = sil[sil.length - 1];
        if (cons.length === 1) { if (cons[0] === 'ng') ant.cod = 'ng'; else on = cons[0]; }
        else if (cons.length >= 2) { ant.cod = cons.slice(0, -1).join(''); on = cons[cons.length - 1]; }
      } else on = cons.join('');
      // na romanização, k/t/p no ataque são as aspiradas e g/d/b/j as brandas
      sil.push({ on, v: t.v, cod: '' });
      cons = [];
    }
    if (cons.length && sil.length) sil[sil.length - 1].cod = cons.join('');
    if (!sil.length) throw new Error('coreano');
    return sil;
  }
  const KO_ON = { g: 'k', kk: 'k͈', n: 'n', d: 't', tt: 't͈', r: 'ɾ', l: 'l', m: 'm', b: 'p', pp: 'p͈', s: 's', ss: 's͈', '': '', j: 't͡ɕ', jj: 't͡ɕ͈', ch: 't͡ɕʰ', k: 'kʰ', t: 'tʰ', p: 'pʰ', h: 'h' };
  const KO_COD = { '': '', g: 'k̚', k: 'k̚', kk: 'k̚', gs: 'k̚', lg: 'k̚', n: 'n', nj: 'n', nh: 'n', d: 't̚', t: 't̚', s: 't̚', ss: 't̚', j: 't̚', ch: 't̚', h: 't̚',
    l: 'l', lm: 'm', lb: 'l', ls: 'l', lt: 'l', lh: 'l', lp: 'p̚', m: 'm', b: 'p̚', p: 'p̚', bs: 'p̚', ng: 'ŋ' };
  function coreano(p) {
    const hangul = /[가-힣]/.test(p);
    const sil = hangul ? koDeHangul(p) : koDeRomanizacao(p);
    if (hangul) {
      // ligação: consoante final passa para a sílaba seguinte que começa por vogal
      for (let k = 0; k < sil.length - 1; k++) {
        const a = sil[k], b = sil[k + 1];
        if (b.on === '' && a.cod && a.cod !== 'ng' && a.cod !== 'h') {
          if (a.cod.length > 1 && KO_T.includes(a.cod) && !['kk', 'ss', 'ch'].includes(a.cod)) { b.on = a.cod.slice(-1); a.cod = a.cod.slice(0, -1); }
          else { b.on = a.cod; a.cod = ''; }
        }
        if (b.on === 'h' && /^(g|d|b|j|k|t|p)$/.test(a.cod)) { b.on = { g: 'k', k: 'k', d: 't', t: 't', b: 'p', p: 'p', j: 'ch' }[a.cod]; a.cod = ''; }
        if (a.cod === 'h' && /^(g|d|j)$/.test(b.on)) { b.on = { g: 'k', d: 't', j: 'ch' }[b.on]; a.cod = ''; }
        if (a.cod === 'h' && b.on === '') a.cod = '';
      }
    }
    let o = '';
    sil.forEach((s, k) => {
      const ant = sil[k - 1];
      let on = KO_ON[s.on] !== undefined ? KO_ON[s.on] : s.on;
      const codAnt = ant ? (KO_COD[ant.cod] !== undefined ? KO_COD[ant.cod] : '') : null;
      const sonoroAntes = ant && (!ant.cod || ['n', 'm', 'ŋ', 'l'].includes(codAnt));
      if (hangul && ant && /̚$/.test(codAnt) && ['g', 'd', 'b', 's', 'j'].includes(s.on)) on = { g: 'k͈', d: 't͈', b: 'p͈', s: 's͈', j: 't͡ɕ͈' }[s.on];
      else if (sonoroAntes && ['g', 'd', 'b', 'j'].includes(s.on)) on = { g: 'ɡ', d: 'd', b: 'b', j: 'd͡ʑ' }[s.on];
      if (sonoroAntes && s.on === 'h') on = 'ɦ';
      if (s.on === 'r' && ant && codAnt === 'l') on = 'l';
      if (s.on === 'r' && !ant) on = 'ɾ';
      if ((s.on === 's' || s.on === 'ss') && /^(i|y|wi)/.test(s.v)) on = on.replace('s', 'ɕ');
      // assimilação nasal: k̚ t̚ p̚ antes de n ou m
      if (ant && /̚$/.test(codAnt) && ['n', 'm'].includes(s.on)) o = o.replace(/(k̚|t̚|p̚)$/, x => ({ 'k̚': 'ŋ', 't̚': 'n', 'p̚': 'm' }[x]));
      o += on + KO_VIPA[s.v] + (KO_COD[s.cod] !== undefined ? KO_COD[s.cod] : '');
    });
    return o;
  }

  window.TranscreverIPA_MAIS = {
    IDIOMAS: [
      ['tupi', 'Tupi antigo'], ['gn', 'Guarani'], ['zh', 'Mandarim (pinyin)'], ['ja', 'Japonês (rōmaji ou kana)'],
      ['ko', 'Coreano (romanização ou hangul)'], ['ar', 'Árabe (romanização)'], ['sw', 'Suaíli'], ['yo', 'Iorubá'], ['tr', 'Turco'],
    ],
    FUNC: { tupi, gn: guarani, zh: mandarim, ja: japones, ko: coreano, ar: arabe, sw: suaili, yo: ioruba, tr: turco },
    // como digitar cada uma
    DICAS: {
      tupi: 'Grafia do tupi antigo de Eduardo Navarro: y para [ɨ], î e û para as semivogais, apóstrofo para a parada glotal. Sem acento escrito, a tônica é a última sílaba.',
      gn: 'Grafia oficial do guarani: y para [ɨ], apóstrofo (puso) para a parada glotal, til para as vogais nasais.',
      zh: 'Pinyin com os tons nas vogais (nǐ hǎo) ou em números (ni3 hao3). Os números de tom viram letras de tom do IPA.',
      ja: 'Rōmaji (Hepburn) ou hiragana e katakana. Kanji não dá para transcrever sem saber a leitura. Vogais longas: ā ou ou.',
      ko: 'Romanização revisada (annyeonghaseyo) ou hangul (안녕하세요). Com hangul, a transcrição aplica a ligação e as mudanças de som entre as sílabas.',
      ar: 'Romanização: ā ī ū para vogais longas, ḥ ṣ ḍ ṭ ẓ para as enfáticas, ʿ para o ʿayn; também vale o jeito da internet (3, 7, 2, aa). A escrita árabe não marca as vogais curtas, por isso aqui se digita romanizado.',
      sw: 'Escrita padrão do suaíli. A tônica é sempre a penúltima sílaba.',
      yo: 'Escrita padrão do iorubá, com os pontos (ẹ ọ ṣ) e os tons (á alto, à baixo, sem marca médio). Os tons ficam nas vogais.',
      tr: 'Escrita padrão do turco. A tônica costuma ser a última sílaba.',
    },
    EXEMPLOS: {
      tupi: 'Ybytu, paranã, abá, kunhã, ybyrá',
      gn: "Mba'éichapa reiko?",
      zh: 'Nǐ hǎo, wǒ shì lǎoshī',
      ja: 'Konnichiwa, watashi wa sensei desu',
      ko: 'Annyeonghaseyo, gamsahamnida',
      ar: 'Marḥaban, ana muʿallima',
      sw: 'Habari yako? Jina langu ni Julia',
      yo: 'Ẹ káàárọ̀, ẹ ṣé',
      tr: 'Merhaba, ben öğretmenim',
    },
  };
})();
