"""Gera infograficos/interesse-por-ia/assets/dados.js com as visualizações mensais de verbetes da
Wikipédia em português (API de pageviews da Wikimedia) e atualiza o resumo estático
de infograficos/interesse-por-ia/index.html.

O jogo "Qual verbete tem mais visitas?" (ohtopico.com.br/material-didatico/jogos/wikipedia.html)
tem a própria cópia dos dados, atualizada pelo repositório ohtopico/site.

Uso: python3 _fonte/interesse-ia/gerar.py            (baixa os dados da Wikimedia)
     python3 _fonte/interesse-ia/gerar.py --sem-baixar     (só refaz o resumo da página com o dados.js atual)

Roda todo mês pela GitHub Action .github/workflows/atualizar-interesse-ia.yml.
"""
import datetime as dt, json, os, re, sys, time, urllib.parse, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.join(AQUI, '..', '..')
SAIDA = os.path.join(RAIZ, 'infograficos', 'interesse-por-ia', 'assets', 'dados.js')
PAGINA = os.path.join(RAIZ, 'infograficos', 'interesse-por-ia', 'index.html')
UA = 'juliaroberta-site/1.0 (https://juliaroberta.com; contato@ohtopico.com.br)'
INICIO = '2016-01'

# (id, grupo, títulos possíveis na Wikipédia em português; vale o primeiro que existir)
VERBETES = [
    ('ia', 'Conceitos de IA', ['Inteligência artificial']),
    ('aprendizado', 'Conceitos de IA', ['Aprendizado de máquina', 'Aprendizagem de máquina']),
    ('profunda', 'Conceitos de IA', ['Aprendizagem profunda', 'Aprendizado profundo']),
    ('redes', 'Conceitos de IA', ['Rede neural artificial', 'Redes neurais artificiais']),
    ('llm', 'Conceitos de IA', ['Modelo de linguagem de grande escala', 'Grande modelo de linguagem', 'Modelo de linguagem grande']),
    ('generativa', 'Conceitos de IA', ['Inteligência artificial generativa', 'IA generativa']),
    ('pln', 'Conceitos de IA', ['Processamento de linguagem natural']),
    ('visao', 'Conceitos de IA', ['Visão computacional']),
    ('dados', 'Conceitos de IA', ['Ciência de dados']),
    ('turing', 'Conceitos de IA', ['Teste de Turing']),
    ('chatgpt', 'Ferramentas', ['ChatGPT']),
    ('gemini', 'Ferramentas', ['Google Gemini', 'Gemini (chatbot)', 'Gemini (assistente)']),
    ('copilot', 'Ferramentas', ['Microsoft Copilot']),
    ('openai', 'Ferramentas', ['OpenAI']),
    ('pensamento', 'Educação e tecnologia', ['Pensamento computacional']),
    ('robotica', 'Educação e tecnologia', ['Robótica educacional', 'Robótica educativa']),
    ('letramento', 'Educação e tecnologia', ['Letramento digital', 'Literacia digital', 'Alfabetização digital']),
    ('programacao', 'Educação e tecnologia', ['Programação de computadores']),
]

# Jogo "Qual verbete tem mais visitas?": temas de escola (além dos verbetes acima).
# "A|B": vale o primeiro título que existir e não for página de desambiguação.
JOGO = [
    ('Computação', ['Computador', 'Internet', 'Algoritmo', 'Linguagem de programação', 'Python (linguagem de programação)|Python', 'Scratch (linguagem de programação)',
                    'Alan Turing', 'Ada Lovelace', 'Sistema de numeração binário|Sistema binário (matemática)|Sistema binário', 'Byte', 'Minecraft', 'Roblox', 'Linux', 'Wikipédia', 'Robô']),
    ('Matemática', ['Matemática', 'Número primo', 'Pi (constante)|Pi', 'Teorema de Pitágoras', 'Pitágoras', 'Fração', 'Porcentagem', 'Geometria',
                    'Triângulo', 'Estatística', 'Probabilidade', 'Equação do segundo grau', 'Sequência de Fibonacci|Fibonacci', '0 (número)|Zero']),
    ('Ciências', ['Sistema Solar', 'Lua (satélite)|Lua', 'Marte (planeta)|Marte', 'Buraco negro', 'Fotossíntese', 'Célula', 'DNA', 'Dinossauro', 'Albert Einstein',
                  'Marie Curie', 'Isaac Newton', 'Charles Darwin', 'Vulcão', 'Água', 'Eletricidade']),
    ('Brasil e RS', ['Brasil', 'Rio Grande do Sul', 'Porto Alegre', 'Santa Cruz do Sul', 'Santos Dumont', 'Amazônia', 'Rio Amazonas',
                     'Chimarrão', 'Pantanal', 'Machado de Assis', 'Futebol', 'Carnaval']),
]


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
    for tentativa in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if tentativa == 3:
                raise
        except (urllib.error.URLError, TimeoutError):
            if tentativa == 3:
                raise
        time.sleep(2 ** tentativa)


def canonicos(titulos):
    """Segue redirecionamentos e diz quais títulos existem (sem páginas de desambiguação).
    Devolve {pedido: título canônico}."""
    saida = {}
    for i in range(0, len(titulos), 40):
        lote = titulos[i:i + 40]
        url = 'https://pt.wikipedia.org/w/api.php?' + urllib.parse.urlencode(
            dict(action='query', titles='|'.join(lote), redirects=1, prop='pageprops', ppprop='disambiguation',
                 format='json', formatversion=2))
        q = get(url)['query']
        mapa = {t: t for t in lote}
        for n in q.get('normalized', []):
            for k, v in mapa.items():
                if v == n['from']:
                    mapa[k] = n['to']
        for _ in range(3):  # redirecionamento em cadeia
            for rd in q.get('redirects', []):
                for k, v in mapa.items():
                    if v == rd['from']:
                        mapa[k] = rd['to']
        existe = {p['title'] for p in q['pages']
                  if not p.get('missing') and not p.get('invalid') and 'disambiguation' not in p.get('pageprops', {})}
        saida.update({k: v for k, v in mapa.items() if v in existe})
        time.sleep(0.2)
    return saida


def redirecionamentos(titulo):
    """Títulos que redirecionam para o verbete. Quando um verbete muda de nome, as visitas
    antigas ficam no título velho, que vira redirecionamento; somar tudo dá a série completa."""
    url = 'https://pt.wikipedia.org/w/api.php?' + urllib.parse.urlencode(
        dict(action='query', titles=titulo, prop='redirects', rdnamespace=0, rdlimit='max', format='json', formatversion=2))
    q = get(url)['query']
    time.sleep(0.2)
    return [r['title'] for p in q['pages'] for r in p.get('redirects', [])]


def meses_ate(fim):
    a, m = map(int, INICIO.split('-'))
    out = []
    while (a, m) <= fim:
        out.append(f'{a:04d}-{m:02d}')
        a, m = (a + 1, 1) if m == 12 else (a, m + 1)
    return out


def visitas(titulo, meses):
    ini = meses[0].replace('-', '') + '0100'
    a, m = map(int, meses[-1].split('-'))
    ult = (dt.date(a + (m == 12), m % 12 + 1, 1) - dt.timedelta(days=1)).strftime('%Y%m%d') + '00'
    art = urllib.parse.quote(titulo.replace(' ', '_'), safe='')
    url = f'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/pt.wikipedia/all-access/user/{art}/monthly/{ini}/{ult}'
    j = get(url)
    por_mes = {it['timestamp'][:4] + '-' + it['timestamp'][4:6]: it['views'] for it in (j or {}).get('items', [])}
    time.sleep(0.1)
    return [por_mes.get(mm, 0) for mm in meses]


def baixar():
    hoje = dt.date.today()
    fim = (hoje.year - (hoje.month == 1), (hoje.month - 2) % 12 + 1)  # último mês completo
    meses = meses_ate(fim)
    pedidos = sorted({t for _, _, ts in VERBETES for t in ts} | {t for _, ts in JOGO for x in ts for t in x.split('|')})
    can = canonicos(pedidos)
    series = []
    for vid, grupo, ts in VERBETES:
        t = next((can[x] for x in ts if x in can), None)
        if not t:
            print('  sem verbete:', ts, file=sys.stderr)
            continue
        v = visitas(t, meses)
        rds = redirecionamentos(t)
        for r in rds:
            v = [a + b for a, b in zip(v, visitas(r, meses))]
        series.append(dict(id=vid, grupo=grupo, titulo=t, v=v))
        print('  ', t, '+', len(rds), 'redirecionamentos:', sum(v[-12:]))
    jogo = []
    for tema, ts in JOGO:
        for x in ts:
            t = next((can[a] for a in x.split('|') if a in can), None)
            if not t:
                print('  jogo, sem verbete:', x, file=sys.stderr)
                continue
            jogo.append(dict(t=t, tema=tema, v=sum(visitas(t, meses[-12:]))))
    for s in series:
        jogo.append(dict(t=s['titulo'], tema='Computação' if s['grupo'] == 'Educação e tecnologia' else 'Inteligência artificial', v=sum(s['v'][-12:])))
    vistos, unicos = set(), []
    for j in jogo:
        if j['t'] not in vistos and j['v'] > 0:
            vistos.add(j['t']); unicos.append(j)
    dados = dict(atualizado=hoje.isoformat(), meses=meses, series=series, jogo=unicos)
    return dados


# ---------- resumo estático (texto indexável, sem depender de JavaScript) ----------
MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
mes_txt = lambda m: f'{MESES[int(m[5:]) - 1]} de {m[:4]}'
nf = lambda n: f'{n:,.0f}'.replace(',', '.')


def resumo(d):
    meses, S = d['meses'], d['series']
    ia = [s for s in S if s['grupo'] != 'Educação e tecnologia']
    ult12 = sum(sum(s['v'][-12:]) for s in ia)
    soma_mes = [sum(s['v'][i] for s in ia) for i in range(len(meses))]
    rec = max(range(len(meses)), key=soma_mes.__getitem__)
    mais = max(S, key=lambda s: sum(s['v'][-12:]))
    # crescimento: últimos 12 meses contra os 12 meses antes do lançamento do ChatGPT (dez/2021 a nov/2022)
    i0 = meses.index('2021-12') if '2021-12' in meses else 0
    cresc = []
    for s in S:
        antes, agora = sum(s['v'][i0:i0 + 12]), sum(s['v'][-12:])
        if antes >= 1000 and agora > antes:
            cresc.append((agora / antes, s))
    cresc.sort(key=lambda x: -x[0])
    itens = [f'<li>Nos últimos 12 meses, os verbetes de inteligência artificial acompanhados aqui somaram <b>{nf(ult12)} visitas</b> na Wikipédia em português.</li>',
             f'<li>O mês com mais visitas a esses verbetes foi <b>{mes_txt(meses[rec])}</b>, com {nf(soma_mes[rec])} visitas.</li>',
             f'<li>O verbete mais lido no período foi <b>{mais["titulo"]}</b>, com {nf(sum(mais["v"][-12:]))} visitas.</li>']
    for r, s in cresc[:3]:
        fator = f'{r:.1f}'.replace('.', ',')
        itens.append(f'<li><b>{s["titulo"]}</b> teve {fator} vezes as visitas do ano anterior ao lançamento do ChatGPT.</li>')
    return '<ul class="resumo-lista">\n' + '\n'.join(itens) + '\n</ul>', d['meses'][-1]


def main():
    if '--sem-baixar' in sys.argv:
        js = open(SAIDA).read()
        d = json.loads(js[js.index('{'):js.rindex('}') + 1])
    else:
        d = baixar()
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    js = '/* Gerado por _fonte/interesse-ia/gerar.py. Não editar à mão. */\nwindow.DADOS_WIKI = ' + \
         json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(SAIDA, 'w').write(js)
    print(SAIDA, len(js) // 1024, 'KB')
    if not os.path.exists(PAGINA):
        return
    html = open(PAGINA).read()
    lista, ultimo = resumo(d)
    html = re.sub(r'(<!-- resumo:inicio -->).*?(<!-- resumo:fim -->)', lambda m: m.group(1) + '\n' + lista + '\n' + m.group(2), html, flags=re.S)
    html = re.sub(r'(<span id="ate">).*?(</span>)', lambda m: m.group(1) + mes_txt(ultimo) + m.group(2), html)
    html = re.sub(r'(assets/\w+\.(?:js|css))\?v=\d+', lambda m: m.group(1) + '?v=' + d['atualizado'].replace('-', ''), html)
    open(PAGINA, 'w').write(html)


if __name__ == '__main__':
    main()
