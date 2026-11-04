"""Calcula as ligações entre as habilidades de Computação da BNCC de um ano para o seguinte
e gera infograficos/bncc-computacao/dados.js.

Entrada: _fonte/bncc-computacao/habilidades.json (de extrair.js, a partir do catálogo do ohtopico.com.br).

Como a ligação é calculada (o mesmo texto aparece na página):
- texto e objeto de conhecimento viram palavras sem acento, sem palavras vazias e cortadas nas 6
  primeiras letras (programa, programação e programas viram "progra"); verbos e palavras gerais
  (criar, analisar, digital, tecnologia...) ficam de fora, para a ligação vir do conteúdo;
- cada palavra pesa pelo TF-IDF: palavras raras no conjunto pesam mais que as comuns;
- a semelhança entre duas habilidades é o cosseno entre os vetores, mais 0,10 se forem do mesmo
  eixo, mais 0,08 se estiverem no mesmo fio temático e mais 0,15 vezes a parte dos materiais do ohtopico.com.br que trabalham as duas juntas;
- cada habilidade se liga às 2 mais parecidas do ano seguinte, se a semelhança passar de 0,12;
- quem ficou sem ligação vinda do ano anterior ganha a mais forte, se passar de 0,15.
"""
import json, math, os, re, unicodedata
from collections import Counter

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, '..', '..', 'infograficos', 'bncc-computacao', 'dados.js')
VAZIAS = set('''a o as os um uma uns umas de do da dos das em no na nos nas por pelo pela pelos pelas para com sem e ou
que se sua seu suas seus como mais entre sobre ao aos à às este esta estes estas esse essa esses essas isso
ser ter sao são forma formas diferentes diferente uso usando usar utilizar utilizando partir cada outro outros
outras outra ja já sua seu mesmo mesma tipos tipo meio meios demais seus assim bem tambem também lo la los las
etc ate até onde quando qual quais sua'''.split())
# verbos e palavras gerais que aparecem em quase toda habilidade (cortadas em 6 letras)
GERAIS = set('''criar constr descre compre entend identi analis avalia discut usem funcio questo explor reconh
conhec aplica produz desenv elabor demons aprese utiliz tecnic proble digita tecnol comput soluco indivi
divers relaci formas difere partir'''.split())
LIMIAR, POR_HAB = 0.12, 2
ORDEM = [6, 7, 8, 9, 10]

# Fios temáticos: grupos de palavras que atravessam os anos (radicais de 6 letras, sem acento)
FIOS = [
    ('algoritmos', 'Algoritmos e programação', ['algori', 'progra', 'automa', 'lingua', 'decomp', 'recurs', 'reuso', 'refina', 'abstra', 'metapr', 'erros', 'eficie']),
    ('estruturas', 'Estruturas de dados', ['dados', 'regist', 'matriz', 'listas', 'grafos', 'arvore', 'coleco', 'conjun', 'tabela', 'consul', 'repres']),
    ('redes', 'Redes e internet', ['rede', 'redes', 'intern', 'protoc', 'pacote', 'transm', 'distri', 'parale']),
    ('seguranca', 'Segurança e privacidade', ['segura', 'privac', 'crimin', 'malwar', 'ataque', 'cripto', 'pessoa', 'protec', 'cibern', 'riscos']),
    ('informacao', 'Informação e mídias', ['inform', 'fontes', 'veraci', 'credib', 'confia', 'midias', 'public', 'conteu', 'produt', 'autori', 'autora']),
    ('sociedade', 'Tecnologia, ética e sociedade', ['socied', 'etica', 'impact', 'ambien', 'descar', 'consum', 'trabal', 'direit', 'cyberb', 'empati', 'respei', 'saude', 'desigu', 'politi', 'cidada', 'comuni']),
]


def palavras(t):
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return [w[:6] for w in re.findall(r'[a-z]+', t) if w not in VAZIAS and len(w) > 2 and w[:6] not in GERAIS]


def sem_acento(w):
    return ''.join(c for c in unicodedata.normalize('NFD', w) if unicodedata.category(c) != 'Mn')


def main():
    habs = json.load(open(os.path.join(AQUI, 'habilidades.json'), encoding='utf-8'))
    # para mostrar ao leitor: cada radical vira a palavra inteira mais frequente que o gerou
    formas = {}
    for h in habs:
        for w in re.findall(r'[a-zà-ú]+', (h['objeto'] + ' ' + h['texto']).lower()):
            formas.setdefault(sem_acento(w)[:6], Counter())[w] += 1
    formas['automa'] = Counter({'automatizar': 1})  # "automatizá-las" no texto
    def inteira(r):
        return max(formas[r].items(), key=lambda x: (x[1], len(x[0])))[0] if r in formas else r
    docs = {h['codigo']: palavras(h['objeto']) * 2 + palavras(h['texto']) for h in habs}
    df = Counter(w for d in docs.values() for w in set(d))
    n = len(habs)
    vet = {}
    for c, d in docs.items():
        tf = Counter(d)
        v = {w: (1 + math.log(k)) * math.log((n + 1) / (df[w] + 1)) for w, k in tf.items()}
        norma = math.sqrt(sum(x * x for x in v.values())) or 1
        vet[c] = {w: x / norma for w, x in v.items()}
    rec = {h['codigo']: {r['id'] for r in h['recursos']} for h in habs}
    por_ano = {a: [h for h in habs if h['ano'] == a] for a in ORDEM}

    def no_fio(h, chaves):
        ws = set(palavras(h['objeto'] + ' ' + h['texto']))
        return any(any(w.startswith(k) or k.startswith(w) for w in ws) for k in chaves)
    fios = [{'id': i, 'nome': nome, 'habs': [h['codigo'] for h in habs if no_fio(h, chaves)]} for i, nome, chaves in FIOS]
    fios_de = {h['codigo']: {f['id'] for f in fios if h['codigo'] in f['habs']} for h in habs}

    def sim(a, b):
        cos = sum(x * vet[b['codigo']].get(w, 0) for w, x in vet[a['codigo']].items())
        cos += 0.08 if fios_de[a['codigo']] & fios_de[b['codigo']] else 0
        juntos = rec[a['codigo']] & rec[b['codigo']]
        uniao = rec[a['codigo']] | rec[b['codigo']]
        return cos + (0.10 if a['eixo'] == b['eixo'] else 0) + (0.15 * len(juntos) / len(uniao) if uniao else 0), sorted(juntos)

    ligacoes = []
    for i, ano in enumerate(ORDEM[:-1]):
        prox = por_ano[ORDEM[i + 1]]
        for h in por_ano[ano]:
            cand = sorted(((sim(h, p), p) for p in prox), key=lambda x: -x[0][0])
            for (s, juntos), p in cand[:POR_HAB]:
                if s >= LIMIAR:
                    comuns = sorted(set(vet[h['codigo']]) & set(vet[p['codigo']]), key=lambda w: -(vet[h['codigo']][w] * vet[p['codigo']][w]))
                    ligacoes.append({'de': h['codigo'], 'para': p['codigo'], 'peso': round(s, 3), 'palavras': [inteira(w) for w in comuns[:3]], 'materiais': juntos})
    # quem ficou sem ligação vinda do ano anterior ganha a mais forte, se passar de 0,15
    for i, ano in enumerate(ORDEM[1:]):
        for p in por_ano[ano]:
            if any(l['para'] == p['codigo'] for l in ligacoes):
                continue
            (s, juntos), h = max(((sim(h, p), h) for h in por_ano[ORDEM[i]]), key=lambda x: x[0][0])
            if s >= 0.15:
                comuns = sorted(set(vet[h['codigo']]) & set(vet[p['codigo']]), key=lambda w: -(vet[h['codigo']][w] * vet[p['codigo']][w]))
                ligacoes.append({'de': h['codigo'], 'para': p['codigo'], 'peso': round(s, 3), 'palavras': [inteira(w) for w in comuns[:3]], 'materiais': juntos})
    for h in habs:
        h['verbo'] = h['texto'].split()[0].strip(',')
        h['recursos'] = [{'tipo': r['tipo'], 'titulo': r['titulo']} for r in h['recursos']]
    dados = {'habilidades': habs, 'ligacoes': ligacoes, 'fios': fios}
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    open(SAIDA, 'w', encoding='utf-8').write('/* Gerado por _fonte/bncc-computacao/gerar.py. Não editar à mão. */\nwindow.BNCC_CO = ' + json.dumps(dados, ensure_ascii=False, separators=(',', ':')) + ';\n')
    sem_entrada = [h['codigo'] for h in habs if h['ano'] != 6 and not any(l['para'] == h['codigo'] for l in ligacoes)]
    print(len(ligacoes), 'ligações; sem ligação vinda do ano anterior:', sem_entrada)
    for f in fios: print(f['nome'], len(f['habs']))
    return ligacoes


if __name__ == '__main__':
    for l in main(): print(l['de'], '->', l['para'], l['peso'], l['palavras'], l['materiais'])
