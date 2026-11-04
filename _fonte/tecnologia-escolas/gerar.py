"""Gera infograficos/tecnologia-nas-escolas/dados.js a partir dos microdados do
Censo Escolar da Educação Básica (INEP), tabela de escolas.

Uso:
  python3 _fonte/tecnologia-escolas/gerar.py <pasta com microdados_censo_escolar_AAAA.zip>

Os zips ficam em https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_AAAA.zip
(a Action atualizar-tecnologia-escolas.yml baixa e roda este script).

Saída: para o Brasil, cada estado e cada município do RS, em cada ano e em
cada recorte de rede/localização, uma lista com
  [escolas, matrículas, % internet, % banda larga, % internet para os alunos,
   % laboratório de informática, % com computador ou tablet para alunos,
   alunos por computador]
Escolas em atividade (TP_SITUACAO_FUNCIONAMENTO = 1). Percentuais sobre as
escolas que responderam ao item.
"""
import csv, io, json, os, re, sys, zipfile
from collections import defaultdict

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.join(AQUI, '..', '..')
SAIDA = os.path.join(RAIZ, 'infograficos', 'tecnologia-nas-escolas', 'dados.js')
RESUMO = os.path.join(AQUI, 'resumo.json')

csv.field_size_limit(10 ** 8)

RECORTES = {
    'tot': lambda d, l: True,
    'pub': lambda d, l: d in ('1', '2', '3'),
    'mun': lambda d, l: d == '3',
    'est': lambda d, l: d == '2',
    'fed': lambda d, l: d == '1',
    'priv': lambda d, l: d == '4',
    'pubrur': lambda d, l: d in ('1', '2', '3') and l == '2',
    'pubura': lambda d, l: d in ('1', '2', '3') and l == '1',
}

IND = ['IN_INTERNET', 'IN_BANDA_LARGA', 'IN_INTERNET_ALUNOS', 'IN_LABORATORIO_INFORMATICA']
QT_DISP = ['QT_DESKTOP_ALUNO', 'QT_COMP_PORTATIL_ALUNO', 'QT_TABLET_ALUNO']


def num(v):
    v = (v or '').strip()
    if v == '':
        return None
    try:
        return float(v.replace(',', '.'))
    except ValueError:
        return None


class Acum:
    __slots__ = ('esc', 'mat', 'sim', 'resp', 'disp_sim', 'disp_resp', 'mat_c', 'disp_c')

    def __init__(self):
        self.esc = 0
        self.mat = 0
        self.sim = [0] * len(IND)
        self.resp = [0] * len(IND)
        self.disp_sim = 0
        self.disp_resp = 0
        self.mat_c = 0   # matrículas das escolas com contagem de equipamentos
        self.disp_c = 0  # equipamentos dessas escolas

    def linha(self):
        p = lambda s, r: round(100 * s / r, 1) if r else None
        apc = round(self.mat_c / self.disp_c, 1) if self.disp_c and self.mat_c else None
        return [self.esc, self.mat or None] + [p(s, r) for s, r in zip(self.sim, self.resp)] + \
               [p(self.disp_sim, self.disp_resp), apc]


def membro_csv(z):
    nomes = [n for n in z.namelist() if re.search(r'microdados_ed_basica_\d{4}\.csv$', n, re.I)]
    if not nomes:
        nomes = [n for n in z.namelist() if n.lower().endswith('.csv') and 'escola' in n.lower()]
    return nomes[0]


def ler_ano(caminho, acum, nomes_mun, nomes_uf):
    with zipfile.ZipFile(caminho) as z:
        nome = membro_csv(z)
        print('  lendo', nome, flush=True)
        with z.open(nome) as f:
            leitor = csv.DictReader(io.TextIOWrapper(f, encoding='latin-1', newline=''), delimiter=';')
            cols = set(leitor.fieldnames)
            faltam = [c for c in IND + QT_DISP + ['QT_MAT_BAS'] if c not in cols]
            if faltam:
                print('  colunas ausentes:', faltam)
            ano = None
            for r in leitor:
                if r.get('TP_SITUACAO_FUNCIONAMENTO') != '1':
                    continue
                ano = ano or int(r['NU_ANO_CENSO'])
                uf = r['SG_UF']
                nomes_uf[uf] = r.get('NO_UF') or uf
                chaves = ['BR', uf]
                if uf == 'RS':
                    cod = r['CO_MUNICIPIO']
                    nomes_mun[cod] = r['NO_MUNICIPIO']
                    chaves.append(cod)
                dep, loc = r.get('TP_DEPENDENCIA'), r.get('TP_LOCALIZACAO')
                recs = [k for k, f in RECORTES.items() if f(dep, loc)]
                mat = num(r.get('QT_MAT_BAS'))
                vals = [num(r.get(c)) for c in IND]
                qts = [num(r.get(c)) for c in QT_DISP]
                qts = [None if q is not None and q >= 88888 else q for q in qts]
                # equipamento em branco numa escola que respondeu a parte de estrutura = nenhum
                tem_qt = any(q is not None for q in qts) or vals[0] is not None
                disp = sum(q for q in qts if q is not None)
                for ch in chaves:
                    for rc in recs:
                        a = acum[(ano, ch, rc)]
                        a.esc += 1
                        if mat:
                            a.mat += int(mat)
                        for i, v in enumerate(vals):
                            if v is not None:
                                a.resp[i] += 1
                                if v >= 1:
                                    a.sim[i] += 1
                        if tem_qt:
                            a.disp_resp += 1
                            if disp > 0:
                                a.disp_sim += 1
                            if mat:
                                a.mat_c += int(mat)
                                a.disp_c += int(disp)
            return ano


def main():
    pasta = sys.argv[1]
    zips = sorted(os.path.join(pasta, n) for n in os.listdir(pasta) if n.endswith('.zip'))
    acum = defaultdict(Acum)
    nomes_mun, nomes_uf = {}, {}
    anos = []
    for z in zips:
        print(z, flush=True)
        anos.append(ler_ano(z, acum, nomes_mun, nomes_uf))
    anos = sorted(a for a in anos if a)
    unidades = ['BR'] + sorted(nomes_uf) + sorted(nomes_mun, key=lambda c: nomes_mun[c])
    dados = {}
    for u in unidades:
        dados[u] = {}
        for rc in RECORTES:
            serie = []
            for ano in anos:
                a = acum.get((ano, u, rc))
                serie.append(a.linha() if a else None)
            if any(serie):
                dados[u][rc] = serie
    saida = {
        'anos': anos,
        'campos': ['escolas', 'matriculas', 'internet', 'banda_larga', 'internet_alunos',
                   'lab_informatica', 'computador_alunos', 'alunos_por_computador'],
        'uf': {k: nomes_uf[k] for k in sorted(nomes_uf)},
        'mun': {k: nomes_mun[k] for k in sorted(nomes_mun, key=lambda c: nomes_mun[c])},
        'dados': dados,
    }
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, 'w', encoding='utf-8') as f:
        f.write('// Gerado por _fonte/tecnologia-escolas/gerar.py a partir dos microdados do Censo Escolar (INEP).\n')
        f.write('window.TEC_ESCOLAS = ')
        json.dump(saida, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')
    br = dados['BR']['tot'][-1]
    with open(RESUMO, 'w', encoding='utf-8') as f:
        json.dump({'anos': anos, 'BR_tot_ultimo': br, 'RS_pub_ultimo': dados['RS']['pub'][-1],
                   'municipios_rs': len(nomes_mun)}, f, ensure_ascii=False, indent=1)
    print('anos', anos, 'BR', br, 'municípios RS', len(nomes_mun))


if __name__ == '__main__':
    main()
