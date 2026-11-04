// Gera infograficos/notas-da-turma/habilidades.js: texto e link de material de cada
// habilidade da BNCC que já está nas páginas "BNCC em dados".
// Uso: node _fonte/notas-da-turma/gerar.js (na raiz do repositório)
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..', '..');
const paginas = ['computacao', 'matematica', 'arte', 'lingua-portuguesa', 'literatura', 'lingua-inglesa'];
const saida = {};
for (const p of paginas) {
  global.window = {};
  require(path.join(raiz, 'infograficos', 'bncc-' + p, 'dados.js'));
  const disc = window.BNCC.config.disciplina;
  for (const h of window.BNCC.habilidades) {
    if (saida[h.codigo]) continue;
    saida[h.codigo] = [h.texto, disc, h.link || '', '/infograficos/bncc-' + p + '/'];
  }
}
const js = '/* Gerado por _fonte/notas-da-turma/gerar.js. Não editar à mão. */\n' +
  'window.HABILIDADES = ' + JSON.stringify(saida) + ';\n';
fs.writeFileSync(path.join(raiz, 'infograficos', 'notas-da-turma', 'habilidades.js'), js);
console.log(Object.keys(saida).length, 'habilidades');
