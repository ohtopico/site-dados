"""Gera os dados do infográfico "Os sons das línguas" (/infograficos/alfabeto-fonetico/).

Fontes:
- PHOIBLE (Moran & McCloy, 2019), data/phoible.csv, CC BY-SA 3.0: inventários de fonemas.
- Glottolog 5.2.1 (glottolog-cldf, cldf/languages.csv), CC BY 4.0: famílias e macroáreas.

Uso: python3 gerar.py   (baixa as fontes para cache/ na primeira vez)
Saída: infograficos/alfabeto-fonetico/dados.js e alfabeto-fonetico.csv
"""
import csv
import json
import os
import unicodedata
import urllib.request
from collections import Counter, defaultdict

import simbolos as S

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
SAIDA = os.path.join(RAIZ, 'infograficos', 'alfabeto-fonetico')
CACHE = os.path.join(AQUI, 'cache')

PHOIBLE_COMMIT = '5f82b9c3fbb0b5c630de20e254c5fdad645e3e56'
FONTES = {
    'phoible.csv': f'https://raw.githubusercontent.com/phoible/dev/{PHOIBLE_COMMIT}/data/phoible.csv',
    'glottolog-languages.csv': 'https://raw.githubusercontent.com/glottolog/glottolog-cldf/v5.2.1/cldf/languages.csv',
}
# Nomes de famílias em português do infográfico de famílias de línguas (mesmo repositório).
FAMILIAS_PT = os.path.join(RAIZ, '_fonte', 'familias-de-linguas', 'familias-pt.json')

# Diacríticos de lugar que não mudam a casa do quadro: dental, apical, laminal,
# avançado, recuado, levantado, abaixado. Assim t̪ conta como t.
DIACRITICOS_LUGAR = {'̪', '̺', '̻', '̟', '̠', '̝', '̞'}

VOGAIS = {v[0] for v in S.VOGAIS}
AREAS = {'Africa': 'África', 'Eurasia': 'Eurásia', 'South America': 'América do Sul',
         'North America': 'América do Norte', 'Australia': 'Austrália', 'Papunesia': 'Papuásia e Pacífico'}
ORDEM_AREAS = ['Africa', 'Eurasia', 'South America', 'North America', 'Australia', 'Papunesia']


def baixar(nome):
    os.makedirs(CACHE, exist_ok=True)
    caminho = os.path.join(CACHE, nome)
    if not os.path.exists(caminho):
        print('baixando', FONTES[nome])
        urllib.request.urlretrieve(FONTES[nome], caminho)
    return caminho


def base(seg):
    # PHOIBLE usa "t̪|t" quando a fonte não diz se é dental ou alveolar: fica a primeira forma.
    d = unicodedata.normalize('NFD', seg.split('|')[0])
    return unicodedata.normalize('NFC', ''.join(c for c in d if c not in DIACRITICOS_LUGAR))


def slug(texto):
    t = unicodedata.normalize('NFD', texto.lower())
    t = ''.join(c for c in t if not unicodedata.combining(c))
    return '-'.join(''.join(c if c.isalnum() else ' ' for c in t).split())


def main():
    glotto = {r['ID']: r for r in csv.DictReader(open(baixar('glottolog-languages.csv'), encoding='utf-8'))}
    linhas = list(csv.DictReader(open(baixar('phoible.csv'), encoding='utf-8')))

    nomes_pt = {}
    if os.path.exists(FAMILIAS_PT):
        nomes_pt = json.load(open(FAMILIAS_PT, encoding='utf-8'))

    def lingua(gc):
        r = glotto[gc]
        return r['Language_ID'] if r['Level'] == 'dialect' and r['Language_ID'] else gc

    def familia(lc):
        r = glotto[lc]
        if r['Family_ID']:
            return r['Family_ID']
        if r['Level'] == 'family':
            return lc
        return 'isoladas'

    # Fonemas por língua (união dos inventários da mesma língua)
    fonemas = defaultdict(set)
    inventarios = set()
    for r in linhas:
        gc = r['Glottocode']
        if gc not in glotto:
            continue
        inventarios.add(r['InventoryID'])
        fonemas[lingua(gc)].add(unicodedata.normalize('NFC', r['Phoneme']))

    linguas = sorted(fonemas)
    fam_de = {l: familia(l) for l in linguas}
    area_de = {}
    for l in linguas:
        a = glotto[l]['Macroarea'].split(';')[0]
        area_de[l] = ORDEM_AREAS.index(a) if a in ORDEM_AREAS else -1

    fam_cont = Counter(fam_de.values())
    familias = [f for f, _ in fam_cont.most_common()]
    fam_idx = {f: i for i, f in enumerate(familias)}

    def nome_fam(f):
        if f == 'isoladas':
            return 'Línguas isoladas'
        return nomes_pt.get(f) or glotto[f]['Name']

    # Todos os segmentos de cada língua já reduzidos à base
    bases = {l: {base(s) for s in fonemas[l]} for l in linguas}
    contagem_seg = Counter(s for l in linguas for s in fonemas[l])

    simbolos = []
    for s, nome, modo, lugar, larg, sonora, ex, pt in S.CONSOANTES:
        simbolos.append(dict(s=s, nome=nome, tipo='c', modo=modo, lugar=lugar, larg=larg, sonora=sonora, ex=ex, pt=pt))
    for s, nome, alt, pos, arr, ex, pt in S.VOGAIS:
        simbolos.append(dict(s=s, nome=nome, tipo='v', alt=alt, pos=pos, arr=arr, ex=ex, pt=pt))
    for s, nome, grupo, ex, pt in S.OUTROS:
        simbolos.append(dict(s=s, nome=nome, tipo='o', grupo=grupo, ex=ex, pt=pt))

    audio = json.load(open(os.path.join(AQUI, 'audio-commons.json'), encoding='utf-8'))
    # O português fica de fora dos exemplos: a página marca à parte o que é do português do Brasil.
    exemplos_pref = [g for g in S.LINGUAS_PT if g in fonemas and g != 'port1283']

    csv_linhas = []
    for i, d in enumerate(simbolos):
        s = d['s']
        if d.get('grupo') == 'Cliques':
            # Os cliques aparecem sempre com um acompanhamento (kǃ, ɡǃ, ŋǃ): conta qualquer um.
            tem = [l for l in linguas if any(s in b for b in bases[l])]
        else:
            tem = [l for l in linguas if s in bases[l]]
        presente = set(tem)
        d['n'] = len(tem)
        fc = Counter(fam_idx[fam_de[l]] for l in tem)
        d['fam'] = sorted(([k, v] for k, v in fc.items()), key=lambda x: -x[1])
        ac = Counter(area_de[l] for l in tem if area_de[l] >= 0)
        d['area'] = [ac.get(k, 0) for k in range(len(ORDEM_AREAS))]
        # Formas aparentadas: segmentos que começam pelo símbolo (tʰ, tː, tʷ...)
        var = Counter()
        for seg, n in contagem_seg.items():
            b = base(seg)
            resto = b[len(s):]
            if b != s and b.startswith(s) and len(resto) <= 2 and not any(ch in VOGAIS for ch in resto):
                var[b] += n
        d['var'] = [[k, v] for k, v in var.most_common(6) if v >= 5]
        d['linguas'] = [S.LINGUAS_PT[g] for g in exemplos_pref if g in presente][:8]
        a = audio.get(s)
        if a and a[2]:
            d['som'] = 'sons/' + slug(d['nome']) + '.mp3'
            d['commons'] = a[1]
        csv_linhas.append([s, d['nome'], d['n'], round(100 * d['n'] / len(linguas), 1), len(fc),
                           '; '.join(f'{nome_fam(familias[k])} ({v})' for k, v in d['fam'][:10])])

    dados = {
        'meta': {
            'linguas': len(linguas), 'inventarios': len(inventarios), 'familias': len(familias),
            'areas': [AREAS[a] for a in ORDEM_AREAS],
            'areaTotal': [sum(1 for l in linguas if area_de[l] == k) for k in range(len(ORDEM_AREAS))],
        },
        'lugares': S.LUGARES, 'modos': S.MODOS, 'impossiveis': S.IMPOSSIVEIS,
        'alturas': S.ALTURAS, 'posicoes': S.POSICOES,
        'familias': [[f, nome_fam(f), fam_cont[f]] for f in familias],
        'simbolos': simbolos,
    }
    os.makedirs(SAIDA, exist_ok=True)
    with open(os.path.join(SAIDA, 'dados.js'), 'w', encoding='utf-8') as fp:
        fp.write('// Gerado por _fonte/alfabeto-fonetico/gerar.py. Fontes: PHOIBLE 2.0 e Glottolog 5.2.1.\n')
        fp.write('window.DADOS_IPA = ' + json.dumps(dados, ensure_ascii=False, separators=(',', ':')) + ';\n')
    with open(os.path.join(SAIDA, 'alfabeto-fonetico.csv'), 'w', encoding='utf-8', newline='') as fp:
        w = csv.writer(fp)
        w.writerow(['simbolo', 'nome', 'linguas', 'percentual_linguas', 'familias', 'principais_familias'])
        w.writerows(csv_linhas)
    print(len(linguas), 'línguas,', len(inventarios), 'inventários,', len(familias), 'famílias,', len(simbolos), 'símbolos')
    for d in sorted(simbolos, key=lambda d: -d['n'])[:12]:
        print(d['s'], d['n'], d['linguas'][:4], d['var'][:3])
    print('raros:', [(d['s'], d['n']) for d in sorted(simbolos, key=lambda d: d['n'])[:12]])
    print('sem exemplo de língua:', [d['s'] for d in simbolos if not d['linguas']])


if __name__ == '__main__':
    main()
