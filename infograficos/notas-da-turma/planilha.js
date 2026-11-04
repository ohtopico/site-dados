/* Leitura de planilhas no navegador (.xlsx, .ods, .csv e texto colado), sem bibliotecas.
   Devolve uma lista de abas: [{ nome, linhas: [[célula, ...], ...] }].
   Nada é enviado: o arquivo é lido com FileReader e descompactado com DecompressionStream. */
(function () {
  'use strict';

  // ---------- ZIP ----------
  async function lerZip(buf) {
    const dv = new DataView(buf);
    let fim = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { fim = i; break; }
    }
    if (fim < 0) throw new Error('O arquivo não parece ser uma planilha .xlsx ou .ods.');
    const total = dv.getUint16(fim + 10, true);
    let p = dv.getUint32(fim + 16, true);
    const arquivos = {};
    const dec = new TextDecoder();
    for (let k = 0; k < total; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const metodo = dv.getUint16(p + 10, true);
      const tamComp = dv.getUint32(p + 20, true);
      const nLen = dv.getUint16(p + 28, true), eLen = dv.getUint16(p + 30, true), cLen = dv.getUint16(p + 32, true);
      const local = dv.getUint32(p + 42, true);
      const nome = dec.decode(new Uint8Array(buf, p + 46, nLen));
      arquivos[nome] = { metodo, tamComp, local };
      p += 46 + nLen + eLen + cLen;
    }
    return {
      nomes: Object.keys(arquivos),
      async texto(nome) {
        const a = arquivos[nome];
        if (!a) return null;
        const l = a.local;
        const ini = l + 30 + dv.getUint16(l + 26, true) + dv.getUint16(l + 28, true);
        const dados = new Uint8Array(buf, ini, a.tamComp);
        if (a.metodo === 0) return dec.decode(dados);
        if (a.metodo !== 8) throw new Error('Compactação não suportada.');
        if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador não abre .xlsx. Salve como CSV ou copie e cole as células.');
        const fluxo = new Blob([dados]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        return await new Response(fluxo).text();
      }
    };
  }

  const xml = (t) => new DOMParser().parseFromString(t, 'application/xml');
  const filhos = (el, nome) => Array.from(el.children).filter((c) => c.localName === nome);

  // ---------- XLSX ----------
  function colIndice(ref) {
    const m = /^([A-Z]+)/.exec(ref || '');
    if (!m) return -1;
    let n = 0;
    for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
  }

  async function lerXlsx(zip) {
    const wb = await zip.texto('xl/workbook.xml');
    if (!wb) throw new Error('Não encontrei as abas da planilha.');
    const rels = xml(await zip.texto('xl/_rels/workbook.xml.rels') || '<r/>');
    const alvo = {};
    for (const r of rels.getElementsByTagName('*')) {
      if (r.localName === 'Relationship') alvo[r.getAttribute('Id')] = r.getAttribute('Target');
    }
    const compartilhadas = [];
    const ss = await zip.texto('xl/sharedStrings.xml');
    if (ss) {
      for (const si of xml(ss).documentElement.children) {
        if (si.localName !== 'si') continue;
        let t = '';
        for (const n of si.getElementsByTagName('*')) {
          if (n.localName === 't' && !(n.parentNode && n.parentNode.localName === 'rPh')) t += n.textContent;
        }
        compartilhadas.push(t);
      }
    }
    const abas = [];
    for (const s of xml(wb).getElementsByTagName('*')) {
      if (s.localName !== 'sheet') continue;
      let rid = null;
      for (const at of s.attributes) if (at.localName === 'id') rid = at.value;
      let caminho = alvo[rid] || '';
      caminho = caminho.startsWith('/') ? caminho.slice(1) : 'xl/' + caminho.replace(/^\.\//, '');
      const txt = await zip.texto(caminho);
      if (!txt) continue;
      const linhas = [];
      const doc = xml(txt);
      for (const row of doc.getElementsByTagName('*')) {
        if (row.localName !== 'row') continue;
        const r = parseInt(row.getAttribute('r'), 10) - 1;
        const linha = [];
        let proxima = 0;
        for (const c of filhos(row, 'c')) {
          let j = colIndice(c.getAttribute('r'));
          if (j < 0) j = proxima;
          proxima = j + 1;
          const tipo = c.getAttribute('t');
          const v = filhos(c, 'v')[0];
          let valor = '';
          if (tipo === 's') valor = compartilhadas[parseInt(v ? v.textContent : '-1', 10)] || '';
          else if (tipo === 'inlineStr') valor = c.textContent;
          else if (tipo === 'b') valor = v && v.textContent === '1' ? 'VERDADEIRO' : 'FALSO';
          else if (tipo === 'e') valor = '';
          else if (v) valor = tipo === 'str' ? v.textContent : (isNaN(Number(v.textContent)) ? v.textContent : Number(v.textContent));
          linha[j] = valor;
        }
        linhas[isNaN(r) ? linhas.length : r] = linha;
      }
      abas.push({ nome: s.getAttribute('name') || 'Planilha', linhas: limpar(linhas) });
    }
    return abas;
  }

  // ---------- ODS ----------
  async function lerOds(zip) {
    const txt = await zip.texto('content.xml');
    if (!txt) throw new Error('Não encontrei o conteúdo da planilha .ods.');
    const doc = xml(txt);
    const abas = [];
    for (const tab of doc.getElementsByTagName('*')) {
      if (tab.localName !== 'table' || tab.namespaceURI.indexOf('table') < 0) continue;
      const linhas = [];
      const linhasEl = [];
      (function coletar(el) {
        for (const c of el.children) {
          if (c.localName === 'table-row') linhasEl.push(c);
          else if (/^table-(row-group|header-rows|rows)$/.test(c.localName)) coletar(c);
        }
      })(tab);
      for (const row of linhasEl) {
        const rep = Math.min(parseInt(attr(row, 'number-rows-repeated') || '1', 10), 2000);
        const linha = [];
        for (const c of row.children) {
          if (c.localName !== 'table-cell' && c.localName !== 'covered-table-cell') continue;
          const n = Math.min(parseInt(attr(c, 'number-columns-repeated') || '1', 10), 500);
          const tipo = attr(c, 'value-type');
          let valor;
          if (tipo === 'float' || tipo === 'percentage' || tipo === 'currency') valor = Number(attr(c, 'value'));
          else valor = filhos(c, 'p').map((p) => p.textContent).join('\n');
          for (let k = 0; k < n; k++) linha.push(valor);
        }
        const vazia = linha.every((v) => v === '' || v == null);
        for (let k = 0; k < rep; k++) linhas.push(vazia ? [] : linha.slice());
        if (linhas.length > 5000) break;
      }
      abas.push({ nome: attr(tab, 'name') || 'Planilha', linhas: limpar(linhas) });
    }
    return abas;
  }
  function attr(el, local) {
    for (const a of el.attributes) if (a.localName === local) return a.value;
    return null;
  }

  // ---------- CSV / texto colado ----------
  function lerTexto(t) {
    t = t.replace(/^﻿/, '');
    const amostra = t.split(/\r?\n/).slice(0, 10).join('\n');
    const conta = (ch) => (amostra.match(new RegExp(ch === '|' ? '\\|' : ch, 'g')) || []).length;
    const sep = ['\t', ';', ','].sort((a, b) => conta(b) - conta(a))[0];
    const linhas = [];
    let linha = [], campo = '', aspas = false;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (aspas) {
        if (ch === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else aspas = false; }
        else campo += ch;
      } else if (ch === '"' && campo === '') aspas = true;
      else if (ch === sep) { linha.push(campo); campo = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && t[i + 1] === '\n') i++;
        linha.push(campo); linhas.push(linha); linha = []; campo = '';
      } else campo += ch;
    }
    if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }
    return [{ nome: 'Planilha', linhas: limpar(linhas) }];
  }

  function limpar(linhas) {
    const out = [];
    for (let i = 0; i < linhas.length; i++) {
      const l = linhas[i] || [];
      const nl = [];
      for (let j = 0; j < l.length; j++) {
        const v = l[j];
        nl[j] = v == null ? '' : (typeof v === 'string' ? v.trim() : v);
      }
      out.push(nl);
    }
    while (out.length && out[out.length - 1].every((v) => v === '')) out.pop();
    return out;
  }

  async function lerArquivo(arquivo) {
    const nome = (arquivo.name || '').toLowerCase();
    if (/\.(csv|tsv|txt)$/.test(nome)) {
      const buf = await arquivo.arrayBuffer();
      let t = new TextDecoder('utf-8').decode(buf);
      if (t.indexOf('�') >= 0) t = new TextDecoder('windows-1252').decode(buf);
      return lerTexto(t);
    }
    if (/\.xls$/.test(nome)) throw new Error('Arquivos .xls antigos não abrem aqui. Salve como .xlsx ou .csv e tente de novo.');
    const buf = await arquivo.arrayBuffer();
    const zip = await lerZip(buf);
    if (zip.nomes.indexOf('xl/workbook.xml') >= 0) return lerXlsx(zip);
    if (zip.nomes.indexOf('content.xml') >= 0) return lerOds(zip);
    throw new Error('Formato não reconhecido. Use .xlsx, .ods ou .csv.');
  }

  window.Planilha = { lerArquivo, lerTexto };
})();
