"""Gera os dados.js das páginas BNCC Língua Portuguesa, Literatura e Língua Inglesa em dados (6º ao
9º ano). Método das ligações em _fonte/bncc/rede.py.

Em Língua Portuguesa, a BNCC tem habilidades de um ano (EF06LP) e de blocos (EF67LP para 6º e 7º,
EF89LP para 8º e 9º, EF69LP para os quatro anos). A rede mostra cada grupo numa coluna, na ordem
6º ao 9º, 6º e 7º, 6º, 7º, 8º e 9º, 8º, 9º; o quadro, a lista e o filtro mostram ano a ano.
Literatura é o recorte do campo artístico-literário de Língua Portuguesa.

Entrada: _fonte/bncc-linguagens/habilidades.json (de extrair.py, base aberta bncc.dev).
"""
import json, os, re, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', 'bncc'))
import rede

INF = os.path.join(AQUI, '..', '..', 'infograficos')
GERAIS_LP = 'texto textos genero generos lingua linguag efeito efeitos sentid sentido consid outros recurs modo marcas'.split()
GERAIS_LI = 'lingua ingles textos texto outros recurs modo'.split()
COLUNAS = [[69, '6º ao 9º ano', 'nos quatro anos (6º ao 9º)'], [67, '6º e 7º ano', 'no 6º e 7º ano'], [6, '6º ano'], [7, '7º ano'],
           [89, '8º e 9º ano', 'no 8º e 9º ano'], [8, '8º ano'], [9, '9º ano']]
ANOS_V = [[a, f'{a}º ano'] for a in (6, 7, 8, 9)]
CAMPOS = [['TC', 'Todos os campos de atuação'], ['JM', 'Campo jornalístico/midiático'], ['VP', 'Campo de atuação na vida pública'],
          ['EP', 'Campo das práticas de estudo e pesquisa'], ['AL', 'Campo artístico-literário']]
PRATICAS = [['LE', 'Leitura'], ['PT', 'Produção de textos'], ['OR', 'Oralidade'], ['AN', 'Análise linguística/semiótica']]
EIXOS_LI = [['OR', 'Oralidade'], ['LE', 'Leitura'], ['ES', 'Escrita'], ['CL', 'Conhecimentos linguísticos'], ['DI', 'Dimensão intercultural']]
BASE = {'material': '', 'anosVisao': ANOS_V, 'passo': 'ano', 'trilhaForte': True}


def grupo(codigo):
    return int(codigo[2:4]) if codigo[2] != '0' else int(codigo[3])


def fios_por(habs, chave, nomes=None):
    ordem = []
    for h in habs:
        if h[chave] not in ordem:
            ordem.append(h[chave])
    fios = [{'id': f'f{i}', 'nome': (nomes or {}).get(n, n), 'habs': [h['codigo'] for h in habs if h[chave] == n]} for i, n in enumerate(ordem)]
    return sorted([f for f in fios if len(f['habs']) >= 2], key=lambda f: -len(f['habs']))


def lp(todas, literatura=False):
    cod_campo = {n: k for k, n in CAMPOS}
    cod_prat = {n: k for k, n in PRATICAS}
    habs = []
    for x in todas:
        if x['componente'] != 'LP':
            continue
        campo = x['campos'][0]
        if literatura and campo != 'Campo artístico-literário':
            continue
        h = {'codigo': x['codigo'], 'ano': grupo(x['codigo']), 'anos': x['anos'], 'objeto': x['objetos'][0] if x['objetos'] else '',
             'texto': x['texto'], 'recursos': [], 'campo': campo, 'pratica': x['praticas'][0]}
        h['eixo'] = cod_prat[h['pratica']] if literatura else cod_campo[campo]
        h['fio'] = re.sub(r'([a-zà-ú]) ([A-Z])', lambda m: m.group(1) + ', ' + m.group(2).lower(), h['objeto']) if literatura else h['pratica']
        habs.append(h)
    colunas = [c for c in COLUNAS if any(h['ano'] == c[0] for h in habs)]
    ordem = [c[0] for c in colunas]
    fios = fios_por(habs, 'fio')
    ligacoes, fios = rede.calcular(habs, ordem, gerais_extra=GERAIS_LP, fios_prontos=fios)
    for h in habs:
        for k in ('campo', 'pratica', 'fio'):
            h.pop(k)
    if literatura:
        cfg = {'disciplina': 'Literatura', 'arquivo': 'bncc-literatura', 'eixos': PRATICAS,
               'termoEixo': 'prática de linguagem', 'termoEixos': 'práticas de linguagem'}
        nome, saida = 'bncc-literatura', os.path.join(INF, 'bncc-literatura', 'dados.js')
    else:
        cfg = {'disciplina': 'Língua Portuguesa', 'arquivo': 'bncc-lingua-portuguesa', 'eixos': CAMPOS,
               'termoEixo': 'campo de atuação', 'termoEixos': 'campos de atuação'}
        nome, saida = 'bncc-lingua-portuguesa', os.path.join(INF, 'bncc-lingua-portuguesa', 'dados.js')
    cfg.update(BASE, anos=colunas, periodo='do 6º ao 9º ano', anterior='coluna anterior', seguinte='coluna seguinte')
    rede.gravar(saida, '_fonte/bncc-linguagens/gerar.py', cfg, habs, ligacoes, fios)


def li(todas):
    cod = {'Eixo ' + n.lower(): k for k, n in EIXOS_LI}
    habs = []
    for x in todas:
        if x['componente'] != 'LI':
            continue
        u = x['unidade'][0] if x['unidade'] else ''
        u = re.sub(r'^(Estratégias de escrita).*', r'\1', u)
        u = re.sub(r'^(Práticas de leitura).*', r'\1', u)
        u = re.sub(r'^A língua inglesa no.*', 'A língua inglesa no mundo e no Brasil', u)
        habs.append({'codigo': x['codigo'], 'ano': x['anos'][0], 'eixo': cod[x['eixo'][0]], 'objeto': x['objetos'][0] if x['objetos'] else u,
                     'texto': x['texto'], 'recursos': [], 'fio': u})
    fios = fios_por(habs, 'fio')
    ligacoes, fios = rede.calcular(habs, [6, 7, 8, 9], gerais_extra=GERAIS_LI, fios_prontos=fios)
    for h in habs:
        h.pop('fio')
    cfg = {'disciplina': 'Língua Inglesa', 'arquivo': 'bncc-lingua-inglesa', 'eixos': EIXOS_LI, 'termoEixo': 'eixo', 'termoEixos': 'eixos',
           'anos': ANOS_V, 'periodo': 'do 6º ao 9º ano', 'material': '', 'passo': 'ano', 'trilhaForte': True}
    rede.gravar(os.path.join(INF, 'bncc-lingua-inglesa', 'dados.js'), '_fonte/bncc-linguagens/gerar.py', cfg, habs, ligacoes, fios)


if __name__ == '__main__':
    todas = json.load(open(os.path.join(AQUI, 'habilidades.json'), encoding='utf-8'))
    lp(todas)
    lp(todas, literatura=True)
    li(todas)
