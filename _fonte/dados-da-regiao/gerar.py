"""Gera infograficos/dados-da-regiao/assets/dados.js a partir dos dados do Censo Escolar (INEP),
dos números do Censo IBGE e do mapa dos municípios.

Uso: python3 _fonte/dados-da-regiao/gerar.py
"""
import json, math, os

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, '..', '..', 'infograficos', 'dados-da-regiao', 'assets', 'dados.js')

ESC = json.load(open(os.path.join(AQUI, 'dados-censo-escolar.json')))
DEM = json.load(open(os.path.join(AQUI, 'censo-demografico.json')))
GEO = json.load(open(os.path.join(AQUI, 'municipios.geojson')))

REGIOES = [
    dict(id='candelaria', nome='Candelária e vizinhos', centro='Candelária',
         membros=['Candelária', 'Cachoeira do Sul', 'Rio Pardo', 'Vera Cruz', 'Vale do Sol', 'Novo Cabrais', 'Cerro Branco', 'Lagoa Bonita do Sul', 'Passa Sete']),
    dict(id='novo-cabrais', nome='Novo Cabrais e vizinhos', centro='Novo Cabrais',
         membros=['Novo Cabrais', 'Cerro Branco', 'Paraíso do Sul', 'Candelária', 'Cachoeira do Sul']),
    dict(id='santa-cruz', nome='Região de Santa Cruz do Sul', centro='Santa Cruz do Sul',
         membros=['Santa Cruz do Sul', 'Vera Cruz', 'Mato Leitão', 'Venâncio Aires', 'Estrela Velha', 'Sobradinho', 'Vale do Sol', 'Sinimbu',
                  'Arroio do Tigre', 'Candelária', 'Ibarama', 'Herveiras', 'Gramado Xavier', 'Segredo', 'Lagoa Bonita do Sul', 'Passa Sete']),
]

# (chave no Censo Escolar, id, nome curto, grupo, unidade, maior é melhor?)
ESCOLAR = [
    ('Escolas em atividade', 'escolas', 'Escolas em atividade', 'Escolas', 'n', None),
    ('Escolas municipais', 'esc_mun', 'Escolas municipais', 'Escolas', 'n', None),
    ('Escolas estaduais', 'esc_est', 'Escolas estaduais', 'Escolas', 'n', None),
    ('Escolas privadas', 'esc_priv', 'Escolas privadas', 'Escolas', 'n', None),
    ('Escolas rurais', 'esc_rur', 'Escolas rurais', 'Escolas', 'n', None),
    ('Matrículas: Educação básica (total)', 'mat', 'Matrículas na educação básica', 'Matrículas', 'n', None),
    ('Matrículas: Creche', 'mat_creche', 'Matrículas: creche', 'Matrículas', 'n', None),
    ('Matrículas: Pré-escola', 'mat_pre', 'Matrículas: pré-escola', 'Matrículas', 'n', None),
    ('Matrículas: Fundamental, anos iniciais', 'mat_ai', 'Matrículas: fundamental, anos iniciais', 'Matrículas', 'n', None),
    ('Matrículas: Fundamental, anos finais', 'mat_af', 'Matrículas: fundamental, anos finais', 'Matrículas', 'n', None),
    ('Matrículas: Ensino médio', 'mat_em', 'Matrículas: ensino médio', 'Matrículas', 'n', None),
    ('Matrículas: Educação profissional', 'mat_prof', 'Matrículas: educação profissional', 'Matrículas', 'n', None),
    ('Matrículas: EJA (jovens e adultos)', 'mat_eja', 'Matrículas: EJA (jovens e adultos)', 'Matrículas', 'n', None),
    ('Matrículas: Educação especial', 'mat_esp', 'Matrículas: educação especial', 'Matrículas', 'n', None),
    ('% das matrículas na rede pública', 'p_pub', 'Matrículas na rede pública', 'Matrículas', '%', None),
    ('% das matrículas na rede municipal', 'p_mun', 'Matrículas na rede municipal', 'Matrículas', '%', None),
    ('% das matrículas na rede estadual', 'p_est', 'Matrículas na rede estadual', 'Matrículas', '%', None),
    ('% das matrículas na rede privada', 'p_priv', 'Matrículas na rede privada', 'Matrículas', '%', None),
    ('% das matrículas em escolas rurais', 'p_rur', 'Matrículas em escolas rurais', 'Matrículas', '%', None),
    ('Turmas', 'turmas', 'Turmas', 'Turmas e professores', 'n', None),
    ('Alunos por turma', 'al_turma', 'Alunos por turma', 'Turmas e professores', 'd', False),
    ('Professores (soma por escola)', 'prof', 'Professores (soma por escola)', 'Turmas e professores', 'n', None),
    ('Alunos por professor', 'al_prof', 'Alunos por professor', 'Turmas e professores', 'd', False),
    ('% de escolas com: Internet', 'internet', 'Escolas com internet', 'Estrutura das escolas', '%', True),
    ('% de escolas com: Banda larga', 'banda', 'Escolas com banda larga', 'Estrutura das escolas', '%', True),
    ('% de escolas com: Biblioteca ou sala de leitura', 'biblio', 'Escolas com biblioteca ou sala de leitura', 'Estrutura das escolas', '%', True),
    ('% de escolas com: Laboratório de informática', 'lab_info', 'Escolas com laboratório de informática', 'Estrutura das escolas', '%', True),
    ('% de escolas com: Laboratório de ciências', 'lab_cien', 'Escolas com laboratório de ciências', 'Estrutura das escolas', '%', True),
    ('% de escolas com: Quadra de esportes', 'quadra', 'Escolas com quadra de esportes', 'Estrutura das escolas', '%', True),
    ('% de escolas com: Esgoto da rede pública', 'esgoto', 'Escolas com esgoto da rede pública', 'Estrutura das escolas', '%', True),
    ('% de escolas com: Água potável', 'agua_pot', 'Escolas com água potável', 'Estrutura das escolas', '%', True),
    ('% de escolas: Sem nenhum item de acessibilidade', 'sem_acess', 'Escolas sem nenhum item de acessibilidade', 'Estrutura das escolas', '%', False),
    ('% de escolas com: Oferece alimentação', 'alim', 'Escolas que oferecem alimentação', 'Estrutura das escolas', '%', True),
]
# Itens que o Censo Escolar de 2010 não trazia (vêm como 0 em todos os municípios)
SEM_2010 = {'agua_pot', 'sem_acess'}

def limpa(vals, ind):
    vals = [None if v is None else round(v, 2) for v in vals]
    if ind in SEM_2010:
        vals[0] = None
    return vals

indicadores = []
for chave, iid, nome, grupo, un, bom in ESCOLAR:
    mun = ESC['mun'][chave]
    rec = ESC['rec'][chave]
    valores = {m: limpa(v, iid) for m, v in mun.items() if m not in ('RS', 'Brasil')}
    regioes = {r['id']: limpa([rec[a * 3 + i] for a in range(3)], iid) for i, r in enumerate(REGIOES)}
    indicadores.append(dict(id=iid, nome=nome, grupo=grupo, unidade=un, bom=bom, fonte='escolar',
                            anos=['2010', '2022', '2025'], valores=valores, regioes=regioes,
                            rs=limpa(mun['RS'], iid), brasil=limpa(mun['Brasil'], iid)))

GRUPO_DEM = 'Censo IBGE (população)'
for iid, ind in DEM['indicadores'].items():
    n = len(ind['anos'])
    indicadores.append(dict(id=iid, nome=ind['nome'], grupo=GRUPO_DEM, unidade='r' if ind['unidade'] == 'R$' else ind['unidade'],
                            bom=None if iid == 'pop' else True, fonte='ibge', anos=ind['anos'], valores=ind['valores'],
                            regioes={}, rs=ind.get('rs', [None] * n), brasil=ind.get('brasil', [None] * n),
                            estimado=ind.get('estimado', []), variacao=iid == 'pop'))
# Alfabetização da microrregião de Santa Cruz do Sul (16 municípios)
for ind in indicadores:
    if ind['id'] == 'alfa':
        ind['regioes'] = {'santa-cruz': [94.6, 96.3]}

# ---------- mapa: projeção simples e simplificação Douglas-Peucker ----------
def rings(f):
    g = f['geometry']
    return g['coordinates'] if g['type'] == 'Polygon' else [r for p in g['coordinates'] for r in p]

xs, ys = [], []
for f in GEO['features']:
    for r in rings(f):
        xs += [p[0] for p in r]; ys += [p[1] for p in r]
k = math.cos(math.radians((min(ys) + max(ys)) / 2))
x0, x1, y0, y1 = min(xs) * k, max(xs) * k, min(ys), max(ys)
L = 600
s = L / max(x1 - x0, y1 - y0)
W, H = round((x1 - x0) * s), round((y1 - y0) * s)
P = lambda lon, lat: ((lon * k - x0) * s, (y1 - lat) * s)

def dp(pts, eps):
    if len(pts) < 3:
        return pts
    (ax, ay), (bx, by) = pts[0], pts[-1]
    dx, dy = bx - ax, by - ay
    nrm = math.hypot(dx, dy) or 1e-9
    i, dmax = 0, 0
    for j in range(1, len(pts) - 1):
        d = abs(dy * pts[j][0] - dx * pts[j][1] + bx * ay - by * ax) / nrm
        if d > dmax:
            i, dmax = j, d
    if dmax > eps:
        return dp(pts[:i + 1], eps)[:-1] + dp(pts[i:], eps)
    return [pts[0], pts[-1]]

mapa = {}
for f in GEO['features']:
    nome = f['properties']['name']
    d, cx, cy, area = '', 0, 0, 0
    for r in rings(f):
        pts = [P(*p) for p in r]
        meio = len(pts) // 2  # anel fechado: simplifica as duas metades
        pts = dp(pts[:meio + 1], 0.6)[:-1] + dp(pts[meio:], 0.6)[:-1]
        d += 'M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z'
        # centroide do polígono (para o rótulo)
        for (xa, ya), (xb, yb) in zip(pts, pts[1:] + pts[:1]):
            c = xa * yb - xb * ya
            area += c; cx += (xa + xb) * c; cy += (ya + yb) * c
    mapa[nome] = dict(d=d, x=round(cx / (3 * area), 1), y=round(cy / (3 * area), 1))

dados = dict(regioes=REGIOES, indicadores=indicadores, mapa=dict(w=W, h=H, municipios=mapa),
             destaques=DEM['destaques'])
js = '/* Gerado por _fonte/dados-da-regiao/gerar.py. Não editar à mão. */\nwindow.DADOS_REGIAO = ' + \
     json.dumps(dados, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(SAIDA, 'w').write(js)
print(SAIDA, len(js) // 1024, 'KB')

# Página estática de Novo Cabrais (indexável, sem depender de JavaScript)
import pagina_novo_cabrais
pagina_novo_cabrais.gerar(dados['mapa'], ESC, DEM)
