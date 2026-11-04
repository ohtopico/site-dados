"""Gera infograficos/familias-de-linguas/dados.js e os CSV para baixar.

Fontes (CC BY 4.0):
- Glottolog 5.2.1 em CLDF: https://github.com/glottolog/glottolog-cldf (cldf/languages.csv, values.csv)
- WALS Online 2020 em CLDF: https://github.com/cldf-datasets/wals (cldf/languages.csv, values.csv, codes.csv)

Uso: python3 _fonte/familias-de-linguas/gerar.py <pasta-glottolog-cldf> <pasta-wals-cldf>
(baixe os CSV com: curl -O https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf/<arquivo>)
"""
import csv, collections, json, os, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
SAIDA = os.path.join(RAIZ, 'infograficos', 'familias-de-linguas')
GL, WA = sys.argv[1], sys.argv[2]

# Nomes das famílias em português (glottocode -> nome). Também usado por outros infográficos.
FAMILIAS_PT = json.load(open(os.path.join(AQUI, 'familias-pt.json'), encoding='utf-8'))
AREAS = ['Africa', 'Eurasia', 'Papunesia', 'Australia', 'North America', 'South America']
AREAS_PT = ['África', 'Eurásia', 'Papunésia', 'Austrália', 'América do Norte', 'América do Sul']
NOMES_PT = {
    'port1283': 'Português', 'stan1288': 'Espanhol', 'stan1293': 'Inglês', 'stan1290': 'Francês', 'ital1282': 'Italiano',
    'stan1295': 'Alemão', 'dutc1256': 'Holandês', 'roma1327': 'Romeno', 'stan1289': 'Catalão', 'gali1258': 'Galego',
    'russ1263': 'Russo', 'poli1260': 'Polonês', 'ukra1253': 'Ucraniano', 'hind1269': 'Híndi', 'beng1280': 'Bengali',
    'urdu1245': 'Urdu', 'mode1248': 'Grego moderno', 'alba1267': 'Albanês', 'nucl1235': 'Armênio oriental', 'lith1251': 'Lituano',
    'iris1253': 'Irlandês', 'wels1247': 'Galês', 'icel1247': 'Islandês', 'swed1254': 'Sueco', 'norw1258': 'Norueguês',
    'dani1285': 'Dinamarquês', 'stan1318': 'Árabe padrão', 'hebr1245': 'Hebraico moderno', 'amha1245': 'Amárico',
    'soma1255': 'Somali', 'haus1257': 'Hauçá', 'yoru1245': 'Iorubá', 'nucl1417': 'Igbo', 'zulu1248': 'Zulu', 'xhos1239': 'Xhosa',
    'swah1253': 'Suaíli', 'kiku1240': 'Quicuio', 'mand1415': 'Mandarim', 'yuec1235': 'Cantonês (yue)', 'tibe1272': 'Tibetano',
    'nucl1310': 'Birmanês', 'nucl1643': 'Japonês', 'kore1280': 'Coreano', 'nucl1301': 'Turco', 'finn1318': 'Finlandês',
    'hung1274': 'Húngaro', 'basq1248': 'Basco', 'tami1289': 'Tâmil', 'telu1262': 'Télugo', 'viet1252': 'Vietnamita',
    'cent1989': 'Khmer', 'thai1261': 'Tailandês', 'indo1316': 'Indonésio', 'taga1270': 'Tagalo', 'maor1246': 'Maori',
    'hawa1245': 'Havaiano', 'samo1305': 'Samoano', 'para1311': 'Guarani paraguaio', 'nhen1239': 'Nheengatu',
    'kain1272': 'Kaingang', 'xava1240': 'Xavante', 'cusc1236': 'Quéchua de Cusco', 'cent2142': 'Aimará', 'nava1243': 'Navajo',
    'kala1399': 'Groenlandês', 'buru1296': 'Burushaski', 'lati1261': 'Latim', 'sans1269': 'Sânscrito', 'goth1244': 'Gótico',
    'hitt1242': 'Hitita', 'guaj1255': 'Guajajara', 'stan1306': 'Malaio', 'wayu1243': 'Wayuu', 'cher1273': 'Cherokee',
    'esto1258': 'Estoniano', 'west2369': 'Persa', 'plat1254': 'Malgaxe', 'mbya1239': 'Guarani mbyá', 'kaiw1246': 'Kaiowá',
    'ticu1245': 'Tikuna', 'yano1262': 'Yanomam', 'mund1330': 'Munduruku', 'kaya1330': 'Mebêngôkre (Kayapó)',
    'baka1277': 'Bakairi', 'boro1282': 'Bororo', 'maxa1247': 'Maxakali', 'sate1243': 'Sateré-Mawé',
    'pira1253': 'Pirahã', 'kara1500': 'Karajá', 'macu1259': 'Makuxi',
    'wapi1253': 'Wapixana', 'kadi1248': 'Kadiwéu', 'fuln1247': 'Yaathe (Fulni-ô)',
}
AES_PT = {'1': 'não ameaçada', '2': 'vulnerável', '3': 'ameaçada', '4': 'muito ameaçada', '5': 'quase extinta', '6': 'extinta'}

# --- Glottolog ---
L = {r['ID']: r for r in csv.DictReader(open(os.path.join(GL, 'languages.csv'), encoding='utf-8'))}
V = collections.defaultdict(dict)
for r in csv.DictReader(open(os.path.join(GL, 'values.csv'), encoding='utf-8')):
    if r['Parameter_ID'] in ('category', 'classification', 'aes'):
        V[r['Language_ID']][r['Parameter_ID']] = r['Value']
linguas = sorted((k for k in L if V[k].get('category') == 'Spoken_L1_Language'), key=lambda k: L[k]['Name'])

def familia_de(k):
    return L[k]['Family_ID'] or 'ISO'

cont = collections.Counter(familia_de(k) for k in linguas)
fam_ids = [f for f, _ in cont.most_common() if f != 'ISO']
fam_ids.append('ISO')
fam_idx = {f: i for i, f in enumerate(fam_ids)}

def nome_fam(f):
    if f == 'ISO': return 'Línguas isoladas'
    return FAMILIAS_PT.get(f, L[f]['Name'])

# Nós da árvore (grupos internos) com pelo menos uma língua falada.
usados = set()
for k in linguas:
    cl = V[k].get('classification', '')
    for g in cl.split('/') if cl else []:
        usados.add(g)
nos, no_idx = [], {}
def no(g):
    if g in no_idx: return no_idx[g]
    cl = V[g].get('classification', '')
    pai = no(cl.split('/')[-1]) if cl else -1
    no_idx[g] = len(nos)
    nos.append([FAMILIAS_PT.get(g, L[g]['Name']) if not cl else L[g]['Name'], g, pai])
    return no_idx[g]
for g in sorted(usados): no(g)

areas_fam = collections.defaultdict(collections.Counter)
out_ling = []
for k in linguas:
    r = L[k]
    cl = V[k].get('classification', '')
    pai = no_idx[cl.split('/')[-1]] if cl else -1
    lat = round(float(r['Latitude']) * 10) if r['Latitude'] else None
    lon = round(float(r['Longitude']) * 10) if r['Longitude'] else None
    area = AREAS.index(r['Macroarea']) if r['Macroarea'] in AREAS else -1
    f = familia_de(k)
    areas_fam[f][area] += 1
    br = 1 if 'BR' in r['Countries'].split(';') else 0
    out_ling.append([NOMES_PT.get(k, r['Name']), k, pai, fam_idx[f], lat, lon, int(V[k].get('aes') or 0), area, br])

out_fam = []
for f in fam_ids:
    a = areas_fam[f].most_common(1)[0][0]
    out_fam.append([nome_fam(f), f, L[f]['Name'] if f != 'ISO' else 'Isolates', cont[f], a, no_idx.get(f, -1)])

# --- WALS ---
TRACOS = [
    ('81A', 'Ordem de sujeito, objeto e verbo', 'Em que ordem a frase costuma vir. Em português, "A menina (S) comeu (V) a maçã (O)" é SVO.',
     ['SOV', 'SVO', 'VSO', 'VOS', 'OVS', 'OSV', 'sem ordem dominante']),
    ('87A', 'Adjetivo antes ou depois do substantivo', 'Em português o mais comum é "casa amarela" (substantivo e depois adjetivo); em inglês é "yellow house".',
     ['adjetivo + substantivo', 'substantivo + adjetivo', 'sem ordem dominante', 'só orações relativas internas']),
    ('85A', 'Preposições ou posposições', 'O português usa preposições ("na casa"). Línguas como o japonês e o turco usam posposições, que vêm depois do nome ("casa-em").',
     ['posposições', 'preposições', 'inposições', 'sem ordem dominante', 'sem adposições']),
    ('26A', 'Prefixos ou sufixos', 'Onde a língua coloca as marcas de gramática nas palavras. O português é fortemente sufixal: cant-ava-mos.',
     ['pouca afixação', 'fortemente sufixal', 'mais sufixal', 'prefixos e sufixos igual', 'mais prefixal', 'fortemente prefixal']),
    ('13A', 'Tom', 'Se a altura da voz muda o significado da palavra. No mandarim, "ma" com tons diferentes pode ser mãe ou cavalo. O português não tem tom.',
     ['sem tom', 'tom simples', 'tom complexo']),
    ('30A', 'Número de gêneros', 'Quantos gêneros gramaticais os substantivos têm. O português tem dois (o livro, a mesa).',
     ['nenhum', 'dois', 'três', 'quatro', 'cinco ou mais']),
    ('33A', 'Como se marca o plural', 'O português marca o plural com sufixo (casa-s). Outras línguas usam prefixo, repetição da palavra ou nem marcam.',
     ['prefixo', 'sufixo', 'mudança no radical', 'tom', 'repetição da palavra', 'misto', 'palavra de plural', 'clítico', 'sem plural']),
    ('138A', 'A palavra para chá', 'Quase todas as línguas que têm uma palavra para chá a pegaram do chinês: "chá" veio do cantonês e do mandarim, "tea" do min nan, pelo caminho do mar.',
     ['vem de "cha"', 'vem de "te"', 'outra origem']),
]
WL = {r['ID']: r for r in csv.DictReader(open(os.path.join(WA, 'languages.csv'), encoding='utf-8'))}
wals_val = collections.defaultdict(dict)
for r in csv.DictReader(open(os.path.join(WA, 'values.csv'), encoding='utf-8')):
    wals_val[r['Parameter_ID']][r['Language_ID']] = int(r['Value'])

def fam_wals(w):
    g = w['Glottocode']
    if g in L:
        f = L[g]['Family_ID']
        if f: return fam_idx.get(f, -1)
        if g in fam_idx: return fam_idx[g]
        return fam_idx['ISO'] if L[g]['Is_Isolate'] == 'true' or V[g].get('category') == 'Spoken_L1_Language' else -1
    return -1

out_tracos = []
for pid, nome, desc, valores in TRACOS:
    pts = []
    for wid, v in sorted(wals_val[pid].items()):
        w = WL[wid]
        pts.append([w['Name'], round(float(w['Latitude']) * 10), round(float(w['Longitude']) * 10), fam_wals(w), v - 1])
    pt = wals_val[pid].get('por')
    out_tracos.append({'id': pid, 'nome': nome, 'desc': desc, 'valores': valores, 'por': pt - 1 if pt else None, 'pts': pts})

dados = {
    'fontes': {'glottolog': '5.2.1', 'wals': '2020'},
    'areas': AREAS_PT, 'aes': AES_PT,
    'fam': out_fam, 'nos': nos, 'ling': out_ling, 'tracos': out_tracos,
}
os.makedirs(SAIDA, exist_ok=True)
with open(os.path.join(SAIDA, 'dados.js'), 'w', encoding='utf-8') as fh:
    fh.write('// Gerado por _fonte/familias-de-linguas/gerar.py. Glottolog 5.2.1 e WALS Online (CC BY 4.0).\n')
    fh.write('window.LINGUAS=' + json.dumps(dados, ensure_ascii=False, separators=(',', ':')) + ';\n')

with open(os.path.join(SAIDA, 'familias.csv'), 'w', encoding='utf-8', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['familia', 'nome_glottolog', 'glottocode', 'linguas', 'area_principal'])
    for f in out_fam: w.writerow([f[0], f[2], f[1] if f[1] != 'ISO' else '', f[3], AREAS_PT[f[4]] if f[4] >= 0 else ''])
with open(os.path.join(SAIDA, 'linguas.csv'), 'w', encoding='utf-8', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['lingua', 'glottocode', 'familia', 'macroarea', 'latitude', 'longitude', 'situacao', 'no_brasil'])
    for l in out_ling:
        w.writerow([l[0], l[1], out_fam[l[3]][0], AREAS_PT[l[7]] if l[7] >= 0 else '', l[4] / 10 if l[4] is not None else '',
                    l[5] / 10 if l[5] is not None else '', AES_PT.get(str(l[6]), ''), 'sim' if l[8] else 'não'])
print(len(out_ling), 'línguas,', len(out_fam) - 1, 'famílias,', cont['ISO'], 'isoladas,', len(nos), 'grupos')
for t in out_tracos: print(t['id'], len(t['pts']), 'por=', t['por'])
