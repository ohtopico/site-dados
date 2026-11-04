"""Gera infograficos/bncc-computacao/dados.js: as habilidades de Computação da BNCC (6º ano ao
Ensino Médio) e as ligações de conteúdo entre anos seguidos. Método em _fonte/bncc/rede.py.

Entrada: _fonte/bncc-computacao/habilidades.json (de extrair.js, a partir do catálogo do ohtopico.com.br).
"""
import json, os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', 'bncc'))
import rede

SAIDA = os.path.join(AQUI, '..', '..', 'infograficos', 'bncc-computacao', 'dados.js')
GERAIS = 'digita tecnol comput soluco indivi'.split()
ORDEM = [6, 7, 8, 9, 10]
FIOS = [
    ('algoritmos', 'Algoritmos e programação', ['algori', 'progra', 'automa', 'lingua', 'decomp', 'recurs', 'reuso', 'refina', 'abstra', 'metapr', 'erros', 'eficie']),
    ('estruturas', 'Estruturas de dados', ['dados', 'regist', 'matriz', 'listas', 'grafos', 'arvore', 'coleco', 'conjun', 'tabela', 'consul', 'repres']),
    ('redes', 'Redes e internet', ['rede', 'redes', 'intern', 'protoc', 'pacote', 'transm', 'distri', 'parale']),
    ('seguranca', 'Segurança e privacidade', ['segura', 'privac', 'crimin', 'malwar', 'ataque', 'cripto', 'pessoa', 'protec', 'cibern', 'riscos']),
    ('informacao', 'Informação e mídias', ['inform', 'fontes', 'veraci', 'credib', 'confia', 'midias', 'public', 'conteu', 'produt', 'autori', 'autora']),
    ('sociedade', 'Tecnologia, ética e sociedade', ['socied', 'etica', 'impact', 'ambien', 'descar', 'consum', 'trabal', 'direit', 'cyberb', 'empati', 'respei', 'saude', 'desigu', 'politi', 'cidada', 'comuni']),
]
CONFIG = {
    'disciplina': 'Computação', 'arquivo': 'bncc-computacao',
    'anos': [[6, '6º ano'], [7, '7º ano'], [8, '8º ano'], [9, '9º ano'], [10, 'Ensino Médio']],
    'eixos': [['PC', 'Pensamento computacional'], ['MD', 'Mundo digital'], ['CD', 'Cultura digital']],
    'periodo': 'do 6º ano ao Ensino Médio', 'termoEixo': 'eixo', 'termoEixos': 'eixos', 'passo': 'ano',
    'material': 'material gratuito no ohtopico.com.br', 'materiais': 'materiais gratuitos no ohtopico.com.br',
}


def main():
    habs = json.load(open(os.path.join(AQUI, 'habilidades.json'), encoding='utf-8'))
    ligacoes, fios = rede.calcular(habs, ORDEM, FIOS, GERAIS, formas_extra={'automa': 'automatizar'})
    for h in habs:
        h['link'] = 'https://ohtopico.com.br/material-didatico/bncc/' + h['codigo'].lower() + '/'
    rede.gravar(SAIDA, '_fonte/bncc-computacao/gerar.py', CONFIG, habs, ligacoes, fios)


if __name__ == '__main__':
    main()
