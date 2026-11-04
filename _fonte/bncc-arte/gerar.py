"""Gera infograficos/bncc-arte/dados.js: as habilidades de Arte da BNCC do Ensino Fundamental e as
ligações de conteúdo dos anos iniciais (EF15AR, 1º ao 5º ano) para os anos finais (EF69AR, 6º ao
9º ano). Método em _fonte/bncc/rede.py; os fios são os objetos de conhecimento da BNCC.

Entrada: _fonte/bncc-arte/habilidades.py (textos resumidos).
"""
import os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', 'bncc'))
sys.path.insert(0, AQUI)
import rede, habilidades

SAIDA = os.path.join(AQUI, '..', '..', 'infograficos', 'bncc-arte', 'dados.js')
GERAIS = 'arte artes artist experi aprecia apreci modo indivi coleti colabo divers especi entre outro'.split()
ORDEM = [1, 6, 7, 8, 9]
# Proposta de distribuição das habilidades EF69AR por ano (a BNCC não separa os anos finais).
# Em cada linguagem, elementos e materialidades vêm antes; criação, contexto histórico e análise crítica, depois.
POR_ANO = {
    6: ['04', '05', '10', '11', '20', '21', '29', '32'],
    7: ['01', '06', '12', '13', '22', '23', '26', '30', '35'],
    8: ['02', '07', '09', '14', '18', '19', '24', '27', '34'],
    9: ['03', '08', '15', '16', '17', '25', '28', '31', '33'],
}
ANO_DE = {f'EF69AR{n}': a for a, ns in POR_ANO.items() for n in ns}
assert len(ANO_DE) == 35
LINGUAGENS = [['AV', 'Artes visuais'], ['DA', 'Dança'], ['MU', 'Música'], ['TE', 'Teatro'], ['AI', 'Artes integradas']]
CONFIG = {
    'disciplina': 'Arte', 'arquivo': 'bncc-arte',
    'anos': [[1, '1º ao 5º ano', 'nos anos iniciais (1º ao 5º)'], [6, '6º ano'], [7, '7º ano'], [8, '8º ano'], [9, '9º ano']],
    'periodo': 'do 1º ao 9º ano', 'eixos': LINGUAGENS, 'termoEixo': 'linguagem', 'termoEixos': 'linguagens', 'passo': 'ano', 'trilhaForte': True,
    'etapas': [['iniciais', 'Anos iniciais', [1, 2, 3, 4, 5], 'dos anos iniciais, 1º ao 5º ano'], ['finais', 'Anos finais', [6, 7, 8, 9], 'dos anos finais, 6º ao 9º ano']],
    'material': '', 'anosVisao': [[a, f'{a}º ano'] for a in range(1, 10)],
}


def main():
    habs = habilidades.habilidades()
    for h in habs:
        if h['ano'] == 1:
            h['anos'] = list(range(1, 6))
        else:
            h['ano'] = ANO_DE[h['codigo']]
    objetos = []
    for h in habs:
        if h['objeto'] not in objetos:
            objetos.append(h['objeto'])
    fios = [{'id': f'f{i}', 'nome': o, 'habs': [h['codigo'] for h in habs if h['objeto'] == o]} for i, o in enumerate(objetos)]
    fios.sort(key=lambda f: -len(f['habs']))
    ligacoes, fios = rede.calcular(habs, ORDEM, gerais_extra=GERAIS, fios_prontos=fios)
    rede.gravar(SAIDA, '_fonte/bncc-arte/gerar.py', CONFIG, habs, ligacoes, fios)


if __name__ == '__main__':
    main()
