// Funções compartilhadas pelas duas páginas.
(function () {
  const CHAVE = 'journal2027:v1';

  const CORES = {
    'vermelho': '#c0392b', 'rosa': '#f19cbb', 'laranja': '#e67e22', 'amarelo': '#f4d03f', 'mostarda': '#c9a227',
    'verde': '#6a9a4f', 'azul': '#4a90c2', 'azul claro': '#a9d3ef', 'azul-marinho': '#1f3a5f', 'roxo': '#7d3c98',
    'lilás': '#c3a6db', 'marrom': '#8b5a3c', 'bege': '#e8d8b9', 'branco': '#ffffff', 'preto': '#222222',
    'cinza': '#9a9a9a', 'magenta': '#d0308f', 'rosa neon': '#ff4fb4', 'azul ciano': '#2ad1e6', 'neon': '#39ff88', 'creme': '#f5ecd7', 'vinho': '#6d1f2f', 'terracota': '#c0643f', 'prata': '#c8c8c8', 'dourado': '#d4af37', 'pastel': '#f6d5e5',
    'transparente': 'linear-gradient(135deg,#fff 0 45%,#ddd 45% 55%,#fff 55%)',
    'translúcido': 'linear-gradient(135deg,#fff 0 45%,#e8e8e8 45% 55%,#fff 55%)',
    'holográfico': 'linear-gradient(135deg,#f9c5d1,#c2e9fb,#d4fc79,#fbc2eb)',
    'perolado': 'linear-gradient(135deg,#fdfbfb,#ebedee,#f3e7e9)',
    'metálico': 'linear-gradient(135deg,#d7d2cc,#304352)',
    'glitter': 'radial-gradient(#d4af37 1px,#fff3c4 1px)',
    'multicolorido': 'conic-gradient(#e74c3c,#f1c40f,#2ecc71,#3498db,#9b59b6,#e74c3c)'
  };

  function ler() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE) || '{}');
      return { novos: s.novos || [], editados: s.editados || {}, removidos: s.removidos || [], compras: s.compras || [], feitas: s.feitas || [] };
    } catch (e) {
      return { novos: [], editados: {}, removidos: [], compras: [], feitas: [] };
    }
  }
  function salvar(estado) {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); return true; }
    catch (e) { alert('Não consegui salvar no navegador (talvez o espaço tenha acabado). Exporte um backup e tente com uma foto menor.'); return false; }
  }

  // Lista final = acervo base + edições + novos − removidos
  function materiais() {
    const e = ler();
    const base = (window.MATERIAIS || []).filter(m => !e.removidos.includes(m.id)).map(m => Object.assign({}, m, e.editados[m.id] || {}));
    return base.concat(e.novos.filter(m => !e.removidos.includes(m.id)).map(m => Object.assign({ novo: true }, m)));
  }

  function semAcento(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function bolinha(cor) {
    const v = CORES[cor] || '#ccc';
    return `<span class="bolinha" title="${esc(cor)}" style="background:${v}"></span>`;
  }
  function contar(lista, campo) {
    const c = {};
    lista.forEach(m => [].concat(m[campo] || []).forEach(v => { if (v) c[v] = (c[v] || 0) + 1; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt'));
  }
  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200);
  }

  function detalhesHTML(m) {
    const lista = (arr) => (arr && arr.length) ? arr.map(esc).join(', ') : '—';
    return `
      <button class="fechar" aria-label="Fechar" onclick="this.closest('dialog').close()">×</button>
      <div class="modal">
        <img src="${esc(m.img)}" alt="">
        <div class="txt">
          <span class="etq ${m.novo ? 'novo' : ''}">${esc(m.tipo)}</span>
          <h2 style="margin-top:8px">${esc(m.nome)}</h2>
          <dl>
            <dt>Cores</dt><dd><span class="cores">${(m.cores || []).map(bolinha).join('')}</span> ${lista(m.cores)}</dd>
            <dt>Estilo</dt><dd>${lista(m.estilos)}</dd>
            <dt>Temas</dt><dd>${lista(m.temas)}</dd>
            <dt>Origem</dt><dd>${esc(m.origem || '—')}</dd>
            ${m.obs ? `<dt>Notas</dt><dd>${esc(m.obs)}</dd>` : ''}
            <dt>Código</dt><dd>${esc(m.id)}</dd>
          </dl>
          <div class="acoes"><a class="btn claro" href="atelie.html#editar=${encodeURIComponent(m.id)}">Editar etiquetas</a></div>
        </div>
      </div>`;
  }
  function abrirDetalhes(m) {
    let d = document.getElementById('detalhe');
    if (!d) { d = document.createElement('dialog'); d.id = 'detalhe'; document.body.appendChild(d); d.addEventListener('click', ev => { if (ev.target === d) d.close(); }); }
    d.innerHTML = detalhesHTML(m);
    d.showModal();
  }

  window.J = { CHAVE, CORES, ler, salvar, materiais, semAcento, esc, bolinha, contar, toast, abrirDetalhes };
})();
