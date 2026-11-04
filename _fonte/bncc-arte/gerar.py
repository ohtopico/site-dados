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
ORDEM = [1, 6]
LINGUAGENS = [['AV', 'Artes visuais'], ['DA', 'Dança'], ['MU', 'Música'], ['TE', 'Teatro'], ['AI', 'Artes integradas']]
CONFIG = {
    'disciplina': 'Arte', 'arquivo': 'bncc-arte',
    'anos': [[1, '1º ao 5º ano', 'nos anos iniciais (1º ao 5º)'], [6, '6º ao 9º ano', 'nos anos finais (6º ao 9º)']],
    'periodo': 'do 1º ao 9º ano', 'eixos': LINGUAGENS, 'termoEixo': 'linguagem', 'termoEixos': 'linguagens', 'passo': 'etapa',
    'material': '',
}


def main():
    habs = habilidades.habilidades()
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
