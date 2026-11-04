"""Gera infograficos/dados-da-regiao/novo-cabrais/index.html: página estática (indexável) sobre
Novo Cabrais, com os números escritos no HTML para o Google ler sem JavaScript.
Chamado por gerar.py, que passa o mapa já projetado."""
import json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, '..', '..', 'infograficos', 'dados-da-regiao', 'novo-cabrais', 'index.html')
URL = 'https://juliaroberta.com/infograficos/dados-da-regiao/novo-cabrais/'
PAINEL = '../?regiao=novo-cabrais&amp;municipio=Novo+Cabrais'
MUN = 'Novo Cabrais'
VIZINHOS = ['Cachoeira do Sul', 'Candelária', 'Cerro Branco', 'Paraíso do Sul']


def br(v, casas=1):
    s = f'{v:,.{casas}f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    return s[:-2] if casas == 1 and s.endswith(',0') else s


def pct(v):
    return br(v) + '%'


def mapa_svg(mapa):
    """Recorte do mapa em volta de Novo Cabrais e dos vizinhos ao norte (Cachoeira do Sul,
    muito grande, aparece só em parte)."""
    M = mapa['municipios']
    caixa = []
    for n in [MUN, 'Cerro Branco', 'Paraíso do Sul', 'Candelária']:
        nums = list(map(float, re.findall(r'-?\d+\.?\d*', M[n]['d'])))
        caixa += list(zip(nums[0::2], nums[1::2]))
    x0, x1 = min(p[0] for p in caixa) - 6, max(p[0] for p in caixa) + 6
    y0, y1 = min(p[1] for p in caixa) - 6, max(p[1] for p in caixa) + 40
    fs = (x1 - x0) / 26
    nc = M[MUN]
    # posição dos rótulos (ajustes à mão para não encavalar)
    pos = {MUN: (nc['x'], nc['y'] + fs * 0.4), 'Cerro Branco': (M['Cerro Branco']['x'], M['Cerro Branco']['y'] - fs * 0.6),
           'Paraíso do Sul': (M['Paraíso do Sul']['x'] - fs * 0.8, M['Paraíso do Sul']['y'] + fs * 1.2),
           'Candelária': (M['Candelária']['x'], M['Candelária']['y']), 'Cachoeira do Sul': (nc['x'], y1 - fs)}
    paths, rotulos = [], []
    for n, m in M.items():
        cls = 'nc' if n == MUN else 'viz' if n in VIZINHOS else 'fora'
        paths.append(f'<path class="{cls}" d="{m["d"]}"/>')
        if n in pos:
            x, y = pos[n]
            peso = ' class="forte"' if n == MUN else ''
            rotulos.append(f'<text{peso} x="{x:.1f}" y="{y:.1f}" text-anchor="middle">{n}</text>')
    return (f'<svg viewBox="{x0:.0f} {y0:.0f} {x1 - x0:.0f} {y1 - y0:.0f}" role="img" style="--fs:{fs:.1f}px" '
            f'aria-labelledby="mapa-nc-t"><title id="mapa-nc-t">Mapa de Novo Cabrais, em verde escuro, '
            f'e dos municípios vizinhos Cachoeira do Sul, Candelária, Cerro Branco e Paraíso do Sul, '
            f'em verde claro</title>{"".join(paths)}{"".join(rotulos)}</svg>')


def gerar(mapa, ESC, DEM):
    e = {k: v[MUN] for k, v in ESC['mun'].items() if MUN in v}
    rs = {k: v['RS'] for k, v in ESC['mun'].items() if 'RS' in v}
    d = {k: i['valores'][MUN] for k, i in DEM['indicadores'].items()}

    esc = e['Escolas em atividade'][2]
    esc_mun = e['Escolas municipais'][2]
    esc_est = e['Escolas estaduais'][2]

    # Estrutura das escolas: 2010, 2022, 2025 e o RS em 2025 (só itens em que maior é melhor)
    estrutura = [
        ('Internet', '% de escolas com: Internet'),
        ('Banda larga', '% de escolas com: Banda larga'),
        ('Biblioteca ou sala de leitura', '% de escolas com: Biblioteca ou sala de leitura'),
        ('Laboratório de informática', '% de escolas com: Laboratório de informática'),
        ('Laboratório de ciências', '% de escolas com: Laboratório de ciências'),
        ('Quadra de esportes', '% de escolas com: Quadra de esportes'),
        ('Esgoto da rede pública', '% de escolas com: Esgoto da rede pública'),
        ('Água potável', '% de escolas com: Água potável'),
        ('Alimentação escolar', '% de escolas com: Oferece alimentação'),
    ]
    linhas = []
    for nome, k in estrutura:
        a, b, c = e[k]
        a = '<span class="est">não perguntado</span>' if k.endswith('Água potável') else pct(a)
        cls = ' class="melhor"' if c >= rs[k][2] else ''
        linhas.append(f'<tr><td>{nome}</td><td>{a}</td><td>{pct(b)}</td><td{cls}>{pct(c)}</td><td>{pct(rs[k][2])}</td></tr>')
    tabela = ''.join(linhas)

    kpis = [
        ('Escolas com internet', pct(e['% de escolas com: Internet'][2]), f'eram {pct(e["% de escolas com: Internet"][0])} em 2010', '2025'),
        ('Escolas com biblioteca', pct(e['% de escolas com: Biblioteca ou sala de leitura'][2]), f'eram {pct(e["% de escolas com: Biblioteca ou sala de leitura"][0])} em 2010', '2025'),
        ('Casas com coleta de lixo', pct(d['lixo'][1]), f'eram {pct(d["lixo"][0])} em 2010', '2022'),
        ('Renda média do trabalho', 'R$ ' + br(d['renda'][1], 0), '80% acima da inflação desde 2010', '2022'),
    ]
    kpi_html = ''.join(f'<div class="kpi"><div class="rot">{r} ({ano})</div><div class="num">{n}</div>'
                       f'<div class="var sobe">{v}</div></div>' for r, n, v, ano in kpis)

    faq = [
        ('Quantas escolas tem Novo Cabrais?',
         f'Pelo Censo Escolar 2025 (INEP), Novo Cabrais tem {esc} escolas em atividade: {esc_mun} municipais e {esc_est} estadual. '
         'Todas são públicas e todas têm internet, água potável e alimentação escolar.'),
        ('Quantos habitantes tem Novo Cabrais?',
         'O Censo 2022 do IBGE contou 3.568 moradores em Novo Cabrais, em 1.458 casas ocupadas. A idade mediana é de 43 anos.'),
        ('O que melhorou em Novo Cabrais de 2010 a 2022?',
         f'A coleta de lixo chegou a {pct(d["lixo"][1])} das casas, a água da rede a {pct(d["agua"][1])}, a renda média do trabalho '
         'subiu 80% acima da inflação e o PIB por habitante 54%. Entre os quatro vizinhos, Novo Cabrais foi o que mais avançou na média de 10 indicadores.'),
        ('Como estão as escolas de Novo Cabrais em comparação com o RS?',
         f'Em 2025, {pct(e["% de escolas com: Laboratório de informática"][2])} das escolas de Novo Cabrais têm laboratório de informática '
         f'(no RS são {pct(rs["% de escolas com: Laboratório de informática"][2])}) e {pct(e["% de escolas com: Laboratório de ciências"][2])} '
         f'têm laboratório de ciências (no RS, {pct(rs["% de escolas com: Laboratório de ciências"][2])}). As turmas têm em média '
         f'{br(e["Alunos por turma"][1])} alunos, contra {br(rs["Alunos por turma"][1])} no estado (2022).'),
    ]
    faq_html = ''.join(f'<details class="pergunta"{" open" if i == 0 else ""}><summary><h3>{p}</h3></summary><p>{r}</p></details>'
                       for i, (p, r) in enumerate(faq))

    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'WebPage', '@id': URL, 'url': URL, 'inLanguage': 'pt-BR',
         'name': 'Novo Cabrais (RS): escolas, educação e dados do município',
         'about': {'@id': URL + '#municipio'}, 'author': {'@id': 'https://juliaroberta.com/#julia'},
         'breadcrumb': {'@id': URL + '#trilha'}, 'primaryImageOfPage': URL + 'novo-cabrais-em-12-anos.jpg'},
        {'@type': 'City', '@id': URL + '#municipio', 'name': 'Novo Cabrais',
         'containedInPlace': {'@type': 'State', 'name': 'Rio Grande do Sul'},
         'geo': {'@type': 'GeoCoordinates', 'latitude': -29.76, 'longitude': -52.99},
         'identifier': {'@type': 'PropertyValue', 'propertyID': 'Código IBGE', 'value': '4313391'},
         'sameAs': ['https://pt.wikipedia.org/wiki/Novo_Cabrais', 'https://cidades.ibge.gov.br/brasil/rs/novo-cabrais/panorama']},
        {'@type': 'Dataset', 'name': 'Dados da educação e do Censo em Novo Cabrais (RS), 2010 a 2025',
         'description': 'Escolas, matrículas e estrutura das escolas (Censo Escolar INEP 2010, 2022 e 2025) e indicadores do Censo IBGE 2010 e 2022 de Novo Cabrais, Rio Grande do Sul.',
         'url': URL, 'inLanguage': 'pt-BR', 'spatialCoverage': {'@id': URL + '#municipio'}, 'temporalCoverage': '2010/2025',
         'creator': {'@type': 'Person', '@id': 'https://juliaroberta.com/#julia', 'name': 'Júlia Roberta Quoos Alves', 'url': 'https://juliaroberta.com/curriculo/'},
         'isPartOf': 'https://juliaroberta.com/infograficos/dados-da-regiao/',
         'isBasedOn': ['https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar', 'https://sidra.ibge.gov.br/'],
         'license': 'https://creativecommons.org/licenses/by/4.0/'},
        {'@type': 'BreadcrumbList', '@id': URL + '#trilha', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Início', 'item': 'https://juliaroberta.com/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Dados da região', 'item': 'https://juliaroberta.com/infograficos/dados-da-regiao/'},
            {'@type': 'ListItem', 'position': 3, 'name': 'Novo Cabrais', 'item': URL}]},
        {'@type': 'FAQPage', 'mainEntity': [
            {'@type': 'Question', 'name': p, 'acceptedAnswer': {'@type': 'Answer', 'text': r}} for p, r in faq]},
    ]}

    html = PAGINA.format(painel=PAINEL, kpis=kpi_html, tabela=tabela, faq=faq_html, mapa=mapa_svg(mapa),
                         ld=json.dumps(ld, ensure_ascii=False), esc=esc, esc_mun=esc_mun, esc_est=esc_est,
                         lixo0=pct(d['lixo'][0]), lixo1=pct(d['lixo'][1]), agua0=pct(d['agua'][0]), agua1=pct(d['agua'][1]),
                         alfa0=pct(d['alfa'][0]), alfa1=pct(d['alfa'][1]),
                         creche0=e['Matrículas: Creche'][0], creche1=e['Matrículas: Creche'][1],
                         esp0=e['Matrículas: Educação especial'][0], esp1=e['Matrículas: Educação especial'][1],
                         prof0=e['Professores (soma por escola)'][0], prof1=e['Professores (soma por escola)'][1],
                         alprof=br(e['Alunos por professor'][1]), alprof_rs=br(rs['Alunos por professor'][1]))
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    open(SAIDA, 'w').write(html)
    print(SAIDA, len(html) // 1024, 'KB')


PAGINA = '''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Novo Cabrais (RS): escolas e dados da educação | Júlia Quoos</title>
<meta name="description" content="Escolas e educação em Novo Cabrais (RS) de 2010 a 2025: internet e bibliotecas nas escolas, saneamento, renda e alfabetização, com dados do INEP e do IBGE.">
<meta property="og:title" content="Novo Cabrais (RS): escolas, educação e dados do município">
<meta property="og:description" content="O que melhorou em Novo Cabrais de 2010 a 2025, com dados do Censo Escolar e do Censo IBGE.">
<meta property="og:url" content="https://juliaroberta.com/infograficos/dados-da-regiao/novo-cabrais/">
<meta property="og:image" content="https://juliaroberta.com/infograficos/dados-da-regiao/novo-cabrais/novo-cabrais-em-12-anos.jpg">
<meta property="og:image:alt" content="Infográfico Novo Cabrais em 12 anos, com os avanços de 2010 a 2022">
<meta property="og:type" content="article">
<meta property="og:locale" content="pt_BR">
<meta name="author" content="Júlia Roberta Quoos Alves">
<meta name="geo.region" content="BR-RS">
<meta name="geo.placename" content="Novo Cabrais">
<link rel="canonical" href="https://juliaroberta.com/infograficos/dados-da-regiao/novo-cabrais/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sniglet:wght@400;800&family=Lexend:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/md.css">
<link rel="stylesheet" href="../assets/painel.css?v=202610280100">
<style>
  .trilha {{ font-size: 14px; color: var(--ink-2); margin-bottom: 10px; }}
  .trilha a {{ color: inherit; }}
  .texto {{ max-width: 760px; font-size: 16.5px; }}
  .texto p {{ margin: 0 0 14px; }}
  .mapa-nc svg {{ width: 100%; height: auto; display: block; }}
  .mapa-nc path {{ stroke: var(--paper); stroke-width: 1.2; cursor: default; }}
  .mapa-nc path.fora {{ fill: var(--fora); }}
  .mapa-nc path.viz {{ fill: var(--g2); }}
  .mapa-nc path.nc {{ fill: var(--g4); stroke: var(--ink); stroke-width: 1.6; }}
  .mapa-nc text {{ font-family: var(--body); font-size: var(--fs); font-weight: 500; fill: var(--ink); paint-order: stroke; stroke: var(--paper); stroke-width: calc(var(--fs) / 4); }}
  .mapa-nc text.forte {{ font-weight: 700; }}
  .pergunta {{ border: 1.5px solid var(--ink); border-radius: 18px; padding: 12px 18px; margin-bottom: 10px; }}
  .pergunta summary {{ cursor: pointer; }}
  .pergunta summary h3 {{ display: inline; font-size: 17px; }}
  .pergunta p {{ margin: 10px 0 2px; }}
  .infografico {{ max-width: 620px; }}
  .infografico img {{ width: 100%; height: auto; border: 1.5px solid var(--ink); border-radius: 18px; }}
  .chamada {{ border: 1.5px solid var(--ink); border-radius: 22px; padding: 18px 22px; background: var(--g1); box-shadow: 6px 6px 0 var(--ink); max-width: 760px; }}
</style>
<script>
  try {{ const t = JSON.parse(localStorage.getItem('iapraprof:theme')); if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t; }} catch (e) {{}}
</script>
<script type="application/ld+json">{ld}</script>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Z7QDTBLC4K"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());

  gtag('config', 'G-Z7QDTBLC4K');
</script>
</head>
<body>
<header class="topbar">
  <a class="brand" href="../../../">Júlia Quoos</a>
  <a class="brand-sub" href="../">/ dados da região</a>
  <span class="spacer"></span>
  <nav class="topnav" aria-label="Seções">
    <a href="/blog/">Blog</a>
    <a href="/infograficos/">Infográficos</a>
    <a href="/infograficos/interesse-por-ia/notebooks/">Notebooks</a>
    <a href="/curriculo/">Currículo</a>
    <a href="https://ohtopico.com.br/">Formação de professores</a>
  </nav>
  <button class="icon-btn" id="theme-btn" type="button" aria-label="Alternar tema claro/escuro">Tema</button>
</header>

<main>
  <section class="hero">
    <div class="wrap"><div class="hero-inner">
      <nav class="trilha" aria-label="Você está em"><a href="../../../">Início</a> / <a href="../../">Infográficos</a> / <a href="../">Dados da região</a> / Novo Cabrais</nav>
      <span class="terminal">$ novo-cabrais.txt</span>
      <h1>Novo Cabrais (RS): <mark>escolas e educação</mark></h1>
      <p class="lead">O que melhorou nas escolas e na vida de quem mora em Novo Cabrais de 2010 a 2025, com dados do Censo Escolar (INEP) e do Censo Demográfico (IBGE).</p>
      <p class="small muted">Dados reunidos e analisados por <a href="/curriculo/">Júlia Roberta Quoos Alves</a>, professora de computação e formadora de professores.</p>
    </div></div>
  </section>

  <section class="block">
    <div class="wrap">
      <span class="eyebrow">Resumo</span>
      <h2>Novo Cabrais em números</h2>
      <div class="kpis">{kpis}</div>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <div class="duas">
        <div class="texto">
          <span class="eyebrow">O município</span>
          <h2>Onde fica Novo Cabrais</h2>
          <p>Novo Cabrais é um município da região central do Rio Grande do Sul, vizinho de Cachoeira do Sul, Candelária, Cerro Branco e Paraíso do Sul. O Censo 2022 do IBGE contou 3.568 moradores e 1.458 casas ocupadas. A agropecuária responde por mais da metade da economia local.</p>
          <p>Entre 2010 e 2022, Novo Cabrais foi o município que mais avançou entre os quatro vizinhos, na média de 10 indicadores do Censo. Ficou em 1º lugar em água, coleta de lixo, renda e riqueza por habitante.</p>
        </div>
        <figure class="painel mapa-nc" style="margin:0">
          {mapa}
          <figcaption class="legenda">
            <span><i style="background:var(--g4)"></i>Novo Cabrais</span>
            <span><i style="background:var(--g2)"></i>Municípios vizinhos</span>
          </figcaption>
        </figure>
      </div>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <span class="eyebrow">Escolas</span>
      <h2>Escolas de Novo Cabrais</h2>
      <div class="texto">
        <p>Pelo Censo Escolar 2025, Novo Cabrais tem <b>{esc} escolas em atividade</b>: {esc_mun} da rede municipal e {esc_est} da rede estadual. Todas são públicas e a maior parte fica na área rural, perto das famílias.</p>
        <p>A estrutura das escolas cresceu em quase todos os itens. Hoje todas têm internet, água potável e alimentação escolar, e nenhuma está sem item de acessibilidade. Em laboratório de informática, laboratório de ciências e biblioteca, Novo Cabrais está acima da média do Rio Grande do Sul.</p>
        <p>O atendimento também ficou mais próximo: as matrículas em creche passaram de {creche0} para {creche1}, as matrículas na educação especial de {esp0} para {esp1}, e o número de professores subiu de {prof0} para {prof1} (2010 a 2022). São {alprof} alunos por professor, contra {alprof_rs} no estado.</p>
      </div>
      <div class="painel" style="margin-top:18px">
        <h3>Estrutura das escolas de Novo Cabrais</h3>
        <p class="sub">Percentual das escolas com cada item. Em verde, os itens em que Novo Cabrais está igual ou acima do RS em 2025.</p>
        <div class="tabela-wrap">
          <table class="tab">
            <thead><tr><th scope="col">Item</th><th scope="col">2010</th><th scope="col">2022</th><th scope="col">2025</th><th scope="col">RS 2025</th></tr></thead>
            <tbody>{tabela}</tbody>
          </table>
        </div>
      </div>
      <p class="nota"><a href="{painel}">Abrir Novo Cabrais no painel interativo</a> para ver matrículas, turmas, mapa e comparações com os vizinhos.</p>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <span class="eyebrow">Censo IBGE</span>
      <h2>O que melhorou em Novo Cabrais em 12 anos</h2>
      <div class="texto">
        <ul>
          <li>Casas com coleta de lixo: de {lixo0} para <b>{lixo1}</b>.</li>
          <li>Casas com água da rede: de {agua0} para <b>{agua1}</b>.</li>
          <li>Pessoas de 15 anos ou mais que sabem ler e escrever: de {alfa0} para <b>{alfa1}</b>.</li>
          <li>Renda média do trabalho: de R$ 1.318 para <b>R$ 2.380</b> por mês, 80% acima da inflação.</li>
          <li>PIB por habitante: de R$ 23,9 mil para <b>R$ 36,7 mil</b>, 54% acima da inflação.</li>
          <li>No campo: área de soja +131% e produção de leite +133%.</li>
        </ul>
      </div>
      <figure class="infografico">
        <img src="novo-cabrais-em-12-anos.jpg" width="1200" height="2692" loading="lazy" decoding="async"
          alt="Infográfico Novo Cabrais em 12 anos, 2010 a 2022. Hoje: 3.568 moradores, idade mediana de 43 anos e 1.458 casas ocupadas. O que melhorou: casas com água da rede de 67,5% para 81,4%; coleta de lixo de 82,3% para 97,2%; pessoas de 15 anos ou mais que sabem ler e escrever de 91,3% para 94,7%; renda média do trabalho de R$ 1.318 para R$ 2.380, 80% acima da inflação; PIB por habitante de R$ 23,9 mil para R$ 36,7 mil, 54% acima da inflação. Entre os vizinhos, Novo Cabrais ficou em 1º lugar na média de 10 indicadores, à frente de Candelária, Cachoeira do Sul, Paraíso do Sul e Cerro Branco. No campo: soja +131%, leite +133% e valor das lavouras +75%. Fonte: IBGE.">
        <figcaption class="nota">Infográfico "Novo Cabrais em 12 anos", por Júlia Roberta Quoos Alves. Fonte: IBGE, Censos 2010 e 2022.</figcaption>
      </figure>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <span class="eyebrow">Perguntas frequentes</span>
      <h2>Sobre Novo Cabrais</h2>
      <div class="texto">{faq}</div>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <div class="chamada">
        <h2 style="margin-top:0">Quem organizou estes dados</h2>
        <p>Júlia Roberta Quoos Alves é professora de computação, formadora de professores e mestranda na UFSM. Trabalhou na Prefeitura de Novo Cabrais e editou em Novo Cabrais o guia <a href="../../../ia-pra-prof/">IA pra Prof</a>, sobre inteligência artificial na sala de aula.</p>
        <p>Escolas de Novo Cabrais e da região podem conhecer a <a href="https://ohtopico.com.br/formacao-continuada/">formação continuada para professores em IA</a> e o <a href="https://ohtopico.com.br/material-didatico/">material didático gratuito</a> de computação e matemática.</p>
      </div>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <span class="eyebrow">Sobre os dados</span>
      <h2>Fontes</h2>
      <div class="fonte-box"><ul>
        <li><b>Censo Escolar:</b> INEP, microdados do Censo Escolar da Educação Básica 2010, 2022 e 2025 (escolas em atividade). Água potável e acessibilidade não eram perguntadas em 2010.</li>
        <li><b>Censo Demográfico:</b> IBGE, Censos 2010 e 2022 (Sidra), PIB dos Municípios e Produção Agrícola e Pecuária Municipal. Valores de 2010 corrigidos pelo IPCA. Em 2022, "água da rede" conta as casas que usam a rede como forma principal, por isso a comparação com 2010 é aproximada.</li>
        <li>Uso livre com citação da fonte. Correções e sugestões: <a href="mailto:contato@ohtopico.com.br">contato@ohtopico.com.br</a>.</li>
      </ul></div>
    </div>
  </section>
</main>

<footer class="footer"><div class="wrap">
  <p>Página de Novo Cabrais no <a href="../">painel de dados da educação na região</a>, organizado por <a href="/curriculo/">Júlia Roberta Quoos Alves</a>.</p>
</div></footer>

<script>
  document.getElementById('theme-btn').addEventListener('click', () => {{
    const root = document.documentElement;
    const escuro = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = escuro ? 'light' : 'dark';
    try {{ localStorage.setItem('iapraprof:theme', JSON.stringify(root.dataset.theme)); }} catch (e) {{}}
  }});
</script>
</body>
</html>
'''
