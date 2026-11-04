"""Ligações de conteúdo entre habilidades da BNCC de um ano (ou etapa) para o seguinte.

Usado pelos geradores de _fonte/bncc-computacao, _fonte/bncc-matematica e _fonte/bncc-arte.

Método:
- texto e objeto de conhecimento viram palavras sem acento, sem palavras vazias e cortadas nas 6
  primeiras letras (programa, programação e programas viram "progra"); verbos e palavras gerais
  da disciplina ficam de fora;
- cada palavra pesa pelo TF-IDF e a semelhança entre duas habilidades é o cosseno entre elas,
  mais 0,10 se forem do mesmo eixo, mais 0,08 se estiverem no mesmo fio temático e mais 0,15 vezes
  a parte dos materiais que trabalham as duas juntas;
- cada habilidade se liga às 2 mais parecidas do ano seguinte, se a semelhança passar de 0,12;
- quem ficou sem ligação vinda do ano anterior ganha a mais forte, se passar de 0,15.
"""
import json, math, os, re, unicodedata
from collections import Counter

VAZIAS = set('''a o as os um uma uns umas de do da dos das em no na nos nas por pelo pela pelos pelas para com sem e ou
que se sua seu suas seus como mais entre sobre ao aos à às este esta estes estas esse essa esses essas isso
ser ter sao são forma formas diferentes diferente uso usando usar utilizar utilizando partir cada outro outros
outras outra ja já sua seu mesmo mesma tipos tipo meio meios demais seus assim bem tambem também lo la los las
etc ate até onde quando qual quais sua'''.split())
# verbos e palavras gerais que aparecem em quase toda habilidade, em qualquer disciplina (6 letras)
GERAIS = set('''criar constr descre compre entend identi analis avalia discut usem funcio questo explor reconh
conhec aplica produz desenv elabor demons aprese utiliz tecnic proble divers relaci formas difere partir
'''.split())
LIMIAR, POR_HAB, LIMIAR_RESGATE = 0.12, 2, 0.15


def sem_acento(w):
    return ''.join(c for c in unicodedata.normalize('NFD', w) if unicodedata.category(c) != 'Mn')


def palavras(t, gerais):
    t = sem_acento(t.lower())
    return [w[:6] for w in re.findall(r'[a-z]+', t) if w not in VAZIAS and len(w) > 2 and w[:6] not in gerais]


def calcular(habs, ordem, fios_def=(), gerais_extra=(), fios_prontos=None, formas_extra=None):
    """habs: dicts com codigo, ano, eixo, objeto, texto, recursos [{id,...}].
    fios_def: [(id, nome, [radicais])]; ou fios_prontos: [{id, nome, habs}].
    Devolve (ligacoes, fios)."""
    gerais = GERAIS | set(gerais_extra)
    formas = {}
    for h in habs:
        for w in re.findall(r'[a-zà-ú]+', (h['objeto'] + ' ' + h['texto']).lower()):
            formas.setdefault(sem_acento(w)[:6], Counter())[w] += 1
    for r, w in (formas_extra or {}).items():
        formas[r] = Counter({w: 1})

    def inteira(r):
        return max(formas[r].items(), key=lambda x: (x[1], len(x[0])))[0] if r in formas else r

    docs = {h['codigo']: palavras(h['objeto'], gerais) * 2 + palavras(h['texto'], gerais) for h in habs}
    df = Counter(w for d in docs.values() for w in set(d))
    n = len(habs)
    vet = {}
    for c, d in docs.items():
        tf = Counter(d)
        v = {w: (1 + math.log(k)) * math.log((n + 1) / (df[w] + 1)) for w, k in tf.items()}
        norma = math.sqrt(sum(x * x for x in v.values())) or 1
        vet[c] = {w: x / norma for w, x in v.items()}
    rec = {h['codigo']: {r['id'] for r in h['recursos']} for h in habs}
    por_ano = {a: [h for h in habs if h['ano'] == a] for a in ordem}

    if fios_prontos is not None:
        fios = fios_prontos
    else:
        def no_fio(h, chaves):
            ws = set(palavras(h['objeto'] + ' ' + h['texto'], set()))
            return any(any(w.startswith(k) or k.startswith(w) for w in ws) for k in chaves)
        fios = [{'id': i, 'nome': nome, 'habs': [h['codigo'] for h in habs if no_fio(h, chaves)]} for i, nome, chaves in fios_def]
    fios_de = {h['codigo']: {f['id'] for f in fios if h['codigo'] in f['habs']} for h in habs}

    def sim(a, b):
        cos = sum(x * vet[b['codigo']].get(w, 0) for w, x in vet[a['codigo']].items())
        cos += 0.08 if fios_de[a['codigo']] & fios_de[b['codigo']] else 0
        juntos = rec[a['codigo']] & rec[b['codigo']]
        uniao = rec[a['codigo']] | rec[b['codigo']]
        return cos + (0.10 if a['eixo'] == b['eixo'] else 0) + (0.15 * len(juntos) / len(uniao) if uniao else 0), sorted(juntos)

    def ligacao(h, p, s, juntos):
        comuns = sorted(set(vet[h['codigo']]) & set(vet[p['codigo']]), key=lambda w: -(vet[h['codigo']][w] * vet[p['codigo']][w]))
        return {'de': h['codigo'], 'para': p['codigo'], 'peso': round(s, 3), 'palavras': [inteira(w) for w in comuns[:3]], 'materiais': juntos}

    ligacoes = []
    for i, ano in enumerate(ordem[:-1]):
        prox = por_ano[ordem[i + 1]]
        for h in por_ano[ano]:
            cand = sorted(((sim(h, p), p) for p in prox), key=lambda x: -x[0][0])
            for (s, juntos), p in cand[:POR_HAB]:
                if s >= LIMIAR:
                    ligacoes.append(ligacao(h, p, s, juntos))
    for i, ano in enumerate(ordem[1:]):
        for p in por_ano[ano]:
            if any(l['para'] == p['codigo'] for l in ligacoes):
                continue
            (s, juntos), h = max(((sim(h, p), h) for h in por_ano[ordem[i]]), key=lambda x: x[0][0])
            if s >= LIMIAR_RESGATE:
                ligacoes.append(ligacao(h, p, s, juntos))
    return ligacoes, fios


def verbo(texto):
    return texto.split()[0].strip(',').capitalize()


def gravar(saida, gerador, config, habs, ligacoes, fios):
    for h in habs:
        h.setdefault('verbo', verbo(h['texto']))
        h['recursos'] = [{k: r[k] for k in ('tipo', 'titulo') if k in r} for r in h['recursos']]
    dados = {'config': config, 'habilidades': habs, 'ligacoes': ligacoes, 'fios': fios}
    os.makedirs(os.path.dirname(saida), exist_ok=True)
    with open(saida, 'w', encoding='utf-8') as f:
        f.write(f'/* Gerado por {gerador}. Não editar à mão. */\nwindow.BNCC = ' + json.dumps(dados, ensure_ascii=False, separators=(',', ':')) + ';\n')
    sem = [h['codigo'] for h in habs if h['ano'] != config['anos'][0][0] and not any(l['para'] == h['codigo'] for l in ligacoes)]
    print(len(habs), 'habilidades,', len(ligacoes), 'ligações; sem ligação vinda de antes:', len(sem), sem[:12])
    for fi in fios:
        print(' ', fi['nome'], len(fi['habs']))
