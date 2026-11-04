"""Copia da base aberta bncc.dev (github.com/bncc-dev/bncc-dados, CC BY 4.0, mantida pela Profy) as
habilidades de Língua Portuguesa e Língua Inglesa do 6º ao 9º ano, com os nomes dos campos de
atuação, práticas de linguagem, eixos, unidades temáticas e objetos de conhecimento, e grava
habilidades.json. Os textos são os oficiais da BNCC.
Uso: python3 -I _fonte/bncc-linguagens/extrair.py CAMINHO_DO_CLONE_BNCC_DADOS
"""
import csv, json, os, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
base = sys.argv[1] if len(sys.argv) > 1 else sys.exit('Informe o caminho do clone de bncc-dev/bncc-dados.')
csvs = os.path.join(base, 'derivados', 'csv')
nomes = {r['id']: r['nome'] for r in csv.DictReader(open(os.path.join(csvs, 'contextos-organizacao.csv'), encoding='utf-8'))}
lista = lambda v: [x.strip() for x in v.split('|') if x.strip()]
saida = []
for r in csv.DictReader(open(os.path.join(csvs, 'habilidades-ef.csv'), encoding='utf-8')):
    if r['componente'] not in ('ef-comp-lp', 'ef-comp-li') or r['vigencia_status'] != 'vigente':
        continue
    anos = [int(a) for a in lista(r['anos'])]
    if not any(a >= 6 for a in anos):
        continue
    n = lambda campo: [nomes.get(x, x) for x in lista(r[campo])]
    saida.append({'codigo': r['codigo'], 'componente': 'LP' if r['componente'] == 'ef-comp-lp' else 'LI', 'anos': anos,
                  'campos': n('campos_atuacao'), 'praticas': n('pratica_linguagem'), 'eixo': n('eixo'),
                  'unidade': n('unidade_tematica'), 'objetos': n('objetos_conhecimento'), 'texto': r['texto'],
                  'fonte': r['fonte_localizador_pdf']})
json.dump(saida, open(os.path.join(AQUI, 'habilidades.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(saida), 'habilidades;', sum(h['componente'] == 'LP' for h in saida), 'LP,', sum(h['componente'] == 'LI' for h in saida), 'LI')
