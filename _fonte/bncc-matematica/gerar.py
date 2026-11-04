"""Gera infograficos/bncc-matematica/dados.js: as habilidades de Matemática da BNCC (1º ao 9º ano)
e as ligações de conteúdo entre anos seguidos. Método em _fonte/bncc/rede.py.

Entrada: _fonte/bncc-matematica/habilidades.json (de extrair.py, a partir do repositório ohtopico/site).
"""
import json, os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', 'bncc'))
import rede

SAIDA = os.path.join(AQUI, '..', '..', 'infograficos', 'bncc-matematica', 'dados.js')
GERAIS = 'dia dias dois indica numero numeri proble situac envolv contex result regist calcul estrat recurs repres'.split()
ORDEM = list(range(1, 10))
UNIDADES = [['N', 'Números'], ['A', 'Álgebra'], ['G', 'Geometria'], ['M', 'Grandezas e medidas'], ['P', 'Probabilidade e estatística']]
FIOS = [
    ('contagem', 'Contagem e sistema de numeração', ['contag', 'contar', 'ordem', 'ordens', 'decomp', 'compor', 'sistem', 'agrupa', 'decima', 'valor', 'posica']),
    ('operacoes', 'Adição, subtração, multiplicação e divisão', ['adicao', 'subtra', 'multip', 'divisa', 'dobro', 'metade', 'triplo', 'produt', 'quocie', 'operac']),
    ('fracoes', 'Frações, decimais e porcentagem', ['fracao', 'fracoe', 'racion', 'decima', 'porcen', 'numera', 'denomi', 'partes', 'razao', 'propor']),
    ('algebra', 'Padrões, sequências e equações', ['sequen', 'padrao', 'regula', 'equaca', 'equaco', 'iguald', 'incogn', 'variav', 'expres', 'funcao', 'algebr']),
    ('figuras', 'Figuras planas e espaciais', ['figura', 'polign', 'poligo', 'triang', 'quadri', 'circun', 'circul', 'espaci', 'solido', 'prisma', 'piramid', 'cilind', 'angulo', 'simetr']),
    ('localizacao', 'Localização e plano cartesiano', ['locali', 'desloc', 'mapa', 'malha', 'plano', 'cartes', 'coorde', 'ortogo', 'trajet']),
    ('medidas', 'Comprimento, massa, capacidade e tempo', ['compri', 'massa', 'capaci', 'tempo', 'horas', 'calend', 'tempe', 'medida', 'medir', 'area', 'perime', 'volume']),
    ('dinheiro', 'Dinheiro e educação financeira', ['monet', 'dinhei', 'cedula', 'moedas', 'compra', 'juros', 'financ', 'preco', 'troco', 'descon']),
    ('estatistica', 'Tabelas, gráficos e pesquisa', ['tabela', 'grafic', 'pesqui', 'dados', 'media', 'moda', 'median', 'amostr', 'frequen', 'planil']),
    ('probabilidade', 'Chance e probabilidade', ['probab', 'chance', 'aleato', 'evento', 'certeza', 'imposs', 'amostr']),
]
CONFIG = {
    'disciplina': 'Matemática', 'arquivo': 'bncc-matematica',
    'anos': [[a, f'{a}º ano'] for a in ORDEM], 'periodo': 'do 1º ao 9º ano',
    'eixos': UNIDADES, 'termoEixo': 'unidade temática', 'termoEixos': 'unidades temáticas', 'passo': 'ano', 'trilhaForte': True,
    'etapas': [['iniciais', 'Anos iniciais', [1, 2, 3, 4, 5], 'dos anos iniciais, 1º ao 5º ano'], ['finais', 'Anos finais', [6, 7, 8, 9], 'dos anos finais, 6º ao 9º ano']],
    'material': 'material gratuito no ohtopico.com.br', 'materiais': 'materiais gratuitos no ohtopico.com.br',
}


def main():
    habs = json.load(open(os.path.join(AQUI, 'habilidades.json'), encoding='utf-8'))
    cod = {n: k for k, n in UNIDADES}
    for h in habs:
        h['eixo'] = cod[h['eixo']]
    ligacoes, fios = rede.calcular(habs, ORDEM, FIOS, GERAIS)
    nome = dict(UNIDADES)
    for h in habs:
        h['objeto'] = (h['objeto'].split(':')[0].strip() or nome[h['eixo']])
    rede.gravar(SAIDA, '_fonte/bncc-matematica/gerar.py', CONFIG, habs, ligacoes, fios)


if __name__ == '__main__':
    main()
