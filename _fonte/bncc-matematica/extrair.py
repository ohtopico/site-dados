"""Lê do repositório ohtopico/site as habilidades de Matemática da BNCC (1º ao 9º ano) e os materiais
que as trabalham, e grava habilidades.json.

Fontes no ohtopico/site:
- _fonte/matematica-adaptada/bncc.py: as 247 habilidades (1º ao 5º ano resumidas, 6º ao 9º texto oficial);
- _fonte/planejamento/habilidades.json: objeto de conhecimento do 6º ao 9º ano;
- material-didatico/assets/dados.js: catálogo de jogos, planos, fichas e recursos 3D (via node);
- _fonte/matematica-adaptada/indice.json: fichas adaptadas.
Uso: python3 _fonte/bncc-matematica/extrair.py CAMINHO_DO_REPO_OHTOPICO
"""
import json, os, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
repo = sys.argv[1] if len(sys.argv) > 1 else sys.exit('Informe o caminho do repositório ohtopico/site.')
sys.path.insert(0, os.path.join(repo, '_fonte', 'matematica-adaptada'))
import bncc  # noqa: E402

js = ("const fs=require('fs'),vm=require('vm');const c=fs.readFileSync(process.argv[1],'utf8')+';globalThis.__={HABILIDADES,RECURSOS};';"
      "const x={};vm.createContext(x);vm.runInContext(c,x);console.log(JSON.stringify(x.__));")
cat = json.loads(subprocess.check_output(['node', '-e', js, os.path.join(repo, 'material-didatico/assets/dados.js')]))
obj_cat = {h['codigo']: h['objeto'] for h in cat['HABILIDADES'] if h.get('comp') == 'MA'}
plan = json.load(open(os.path.join(repo, '_fonte/planejamento/habilidades.json'), encoding='utf-8'))['MA']
obj_plan = {h['codigo']: h['objeto'] for h in plan}
fichas = json.load(open(os.path.join(repo, '_fonte/matematica-adaptada/indice.json'), encoding='utf-8'))['fichas']
paginas = set(os.listdir(os.path.join(repo, 'material-didatico/bncc')))

saida = []
for h in bncc.habilidades():
    c = h['codigo']
    rec = [{'id': r['id'], 'tipo': r['tipo'], 'titulo': r['titulo']} for r in cat['RECURSOS'] if c in (r.get('habs') or [])]
    proprias = [f for f in fichas if c in f['habilidades']]
    rec += [{'id': 'ad-' + f['slug'], 'tipo': 'revisao' if f['revisao'] else 'adaptada', 'titulo': f['titulo']} for f in proprias]
    objeto = obj_cat.get(c) or obj_plan.get(c, '')
    if c.lower() in paginas:
        link, texto = f'https://ohtopico.com.br/material-didatico/bncc/{c.lower()}/', f'Ver planos, jogos e fichas de {c}'
    else:
        uma = next((f for f in proprias if not f['revisao']), proprias[0] if proprias else None)
        link, texto = (f'https://ohtopico.com.br/matematica-adaptada/fichas/{uma["slug"]}/', f'Ficha adaptada de {c}') if uma else ('', '')
    saida.append({'codigo': c, 'ano': h['ano'], 'eixo': h['unidade'], 'objeto': objeto, 'texto': h['texto'],
                  'recursos': rec, 'link': link, 'linkTexto': texto})
json.dump(saida, open(os.path.join(AQUI, 'habilidades.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(saida), 'habilidades de Matemática;', sum(1 for h in saida if h['recursos']), 'com material')
