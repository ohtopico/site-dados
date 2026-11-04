// Lê material-didatico/assets/dados.js do repositório ohtopico/site e salva as habilidades de
// Computação (6º ano ao Ensino Médio) com os recursos do catálogo que usam cada uma.
// Uso: node _fonte/bncc-computacao/extrair.js CAMINHO_DO_REPO_OHTOPICO
const fs = require('fs'), vm = require('vm'), path = require('path');
const repo = process.argv[2];
if (!repo) { console.error('Informe o caminho do repositório ohtopico/site.'); process.exit(1); }
const code = fs.readFileSync(path.join(repo, 'material-didatico/assets/dados.js'), 'utf8') + '\n;globalThis.__ = {HABILIDADES, RECURSOS};';
const ctx = {}; vm.createContext(ctx); vm.runInContext(code, ctx);
const { HABILIDADES, RECURSOS } = ctx.__;
const habs = HABILIDADES.filter(h => h.comp === 'CO').map(h => ({
  codigo: h.codigo, ano: h.ano, eixo: h.eixo, objeto: h.objeto, texto: h.texto,
  recursos: RECURSOS.filter(r => (r.habs || []).includes(h.codigo)).map(r => ({ id: r.id, tipo: r.tipo, titulo: r.titulo }))
}));
fs.writeFileSync(path.join(__dirname, 'habilidades.json'), JSON.stringify(habs, null, 1));
console.log(habs.length, 'habilidades de Computação');
