"""Gera infograficos/bncc-<disciplina>/index.html das páginas "BNCC ... em dados".

O comportamento está em infograficos/assets/bncc-rede.js e o estilo em bncc-rede.css; aqui ficam só
os textos de cada página. Rodar depois de mudar um texto: python3 _fonte/bncc/paginas.py
"""
import html, json, os

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.join(AQUI, '..', '..')
V = '202611041630'
METODO = ('o texto e o objeto de conhecimento de cada habilidade viram palavras sem acento, sem palavras vazias e sem verbos gerais, '
          'cortadas nas 6 primeiras letras. Cada palavra pesa pelo TF-IDF e a semelhança entre duas habilidades é o cosseno entre elas, '
          'com um pequeno bônus quando são {bonus}. Cada habilidade se liga às duas mais parecidas {seguinte}, se a semelhança passar de 0,12. '
          'É uma leitura automática do texto, não a progressão oficial: serve para planejar e conversar, não para substituir o documento.')

PAGINAS = [
    {
        'slug': 'bncc-computacao', 'disciplina': 'Computação', 'n': 68, 'terminal': 'bncc computação',
        'title': 'BNCC Computação em dados: como as habilidades se ligam',
        'description': 'Infográfico interativo das 68 habilidades de Computação da BNCC, do 6º ano ao Ensino Médio: como os conteúdos se ligam de um ano para o outro, eixos, verbos e material pronto.',
        'og': '68 habilidades, do 6º ano ao Ensino Médio: clique em uma e veja de onde ela vem e para onde vai.',
        'og_alt': 'BNCC Computação em dados: as habilidades do 6º ano ao Ensino Médio ligadas por conteúdo',
        'lead': 'As 68 habilidades de Computação do 6º ano ao Ensino Médio, ligadas pelo conteúdo de um ano para o outro. Clique em uma habilidade para ver de onde ela vem e para onde vai.',
        'pilulas': ['68 habilidades', '6º ano ao Ensino Médio', '3 eixos', 'dados para baixar'],
        'progressao': 'Cada caixinha é uma habilidade, na coluna do seu ano. As linhas ligam habilidades de anos seguidos que tratam do mesmo conteúdo; quanto mais grossa, mais forte a ligação. Escolha um fio para seguir um tema, ou clique em uma habilidade para ver a trilha inteira dela.',
        'eixos_eyebrow': 'Eixos', 'eixos_h2': 'Pensamento computacional, mundo digital e cultura digital, ano a ano',
        'eixos_p': 'Quantas habilidades de cada eixo há em cada ano. Clique em um quadro para ver a lista.',
        'verbos_p': 'O verbo que abre cada habilidade diz o tipo de trabalho esperado: compreender, criar, analisar. Clique em uma barra para ver as habilidades.',
        'material_h2': 'Quanto material gratuito já existe para cada ano',
        'material_p': 'Média de jogos, planos, fichas e recursos 3D por habilidade no <a href="https://ohtopico.com.br/material-didatico/">material didático do ohtopico.com.br</a>. Mostra onde ainda falta material.',
        'busca': 'Buscar por código ou palavra, por exemplo: algoritmo',
        'dataset': 'As 68 habilidades de Computação da BNCC do 6º ano do Ensino Fundamental ao Ensino Médio, com eixo, objeto de conhecimento, verbo, materiais didáticos que as trabalham e ligações de conteúdo calculadas por semelhança de texto.',
        'base': ['http://portal.mec.gov.br/conselho-nacional-de-educacao/base-nacional-comum-curricular-bncc', 'https://ohtopico.com.br/material-didatico/bncc/'],
        'sobre': [
            '<b>Habilidades:</b> BNCC Computação, complemento à BNCC aprovado no Parecer CNE/CEB nº 2/2022 e homologado na Resolução CNE/CEB nº 1/2022. São as 42 habilidades do 6º ao 9º ano e as 26 do Ensino Médio. Os textos aparecem resumidos, como no catálogo do ohtopico.com.br; para citar, use o documento oficial.',
            '<b>Materiais:</b> jogos, planos de aula, fichas e recursos 3D do <a href="https://ohtopico.com.br/material-didatico/">material didático gratuito</a>, contados pela lista de habilidades de cada material.',
            '<b>Ligações:</b> ' + METODO.format(bonus='do mesmo eixo, do mesmo fio temático ou trabalhadas pelos mesmos materiais', seguinte='do ano seguinte'),
            '<b>Fios temáticos:</b> grupos de palavras escolhidos à mão (por exemplo, rede, internet, protocolo e pacote para "Redes e internet"). Uma habilidade entra no fio quando o texto ou o objeto de conhecimento tem uma dessas palavras.',
        ],
        'fonte': 'bncc-computacao',
        'rodape': 'Planos, jogos e fichas para cada habilidade estão no <a href="https://ohtopico.com.br/material-didatico/bncc/">site de docência</a>.',
    },
    {
        'slug': 'bncc-matematica', 'disciplina': 'Matemática', 'n': 247, 'terminal': 'bncc matemática',
        'title': 'BNCC Matemática em dados: como as habilidades se ligam',
        'description': 'Infográfico interativo das 247 habilidades de Matemática da BNCC, do 1º ao 9º ano: como os conteúdos se ligam de um ano para o outro, unidades temáticas, verbos e material pronto.',
        'og': '247 habilidades, do 1º ao 9º ano: clique em uma e veja de onde ela vem e para onde vai.',
        'og_alt': 'BNCC Matemática em dados: as habilidades do 1º ao 9º ano ligadas por conteúdo',
        'lead': 'As 247 habilidades de Matemática do 1º ao 9º ano, ligadas pelo conteúdo de um ano para o outro. Clique em uma habilidade para ver de onde ela vem e para onde vai, das primeiras contagens às equações.',
        'pilulas': ['247 habilidades', '1º ao 9º ano', '5 unidades temáticas', 'dados para baixar'],
        'progressao': 'Cada caixinha é uma habilidade, na coluna do seu ano. As linhas ligam habilidades de anos seguidos que tratam do mesmo conteúdo; quanto mais grossa, mais forte a ligação. Escolha um fio para seguir um tema, como frações ou gráficos, ou clique em uma habilidade para ver a trilha inteira dela. Em telas pequenas, arraste para o lado.',
        'eixos_eyebrow': 'Unidades temáticas', 'eixos_h2': 'Números, álgebra, geometria, medidas e estatística, ano a ano',
        'eixos_p': 'Quantas habilidades de cada unidade temática há em cada ano. Clique em um quadro para ver a lista.',
        'verbos_p': 'O verbo que abre cada habilidade diz o tipo de trabalho esperado: resolver, reconhecer, construir. Clique em uma barra para ver as habilidades.',
        'material_h2': 'Quanto material gratuito já existe para cada ano',
        'material_p': 'Média de fichas adaptadas, jogos, planos e fichas por habilidade, somando o <a href="https://ohtopico.com.br/material-adaptado/">material adaptado</a> e o <a href="https://ohtopico.com.br/material-didatico/">material didático</a> do ohtopico.com.br.',
        'busca': 'Buscar por código ou palavra, por exemplo: fração',
        'dataset': 'As 247 habilidades de Matemática da BNCC do 1º ao 9º ano do Ensino Fundamental, com unidade temática, objeto de conhecimento, verbo, materiais didáticos que as trabalham e ligações de conteúdo calculadas por semelhança de texto.',
        'base': ['http://basenacionalcomum.mec.gov.br/', 'https://ohtopico.com.br/material-adaptado/'],
        'sobre': [
            '<b>Habilidades:</b> BNCC, Matemática do Ensino Fundamental (Resolução CNE/CP nº 2/2017). Do 6º ao 9º ano, o texto é o oficial; do 1º ao 5º ano, aparece resumido. Para citar, use o documento oficial.',
            '<b>Materiais:</b> fichas adaptadas (versões A, B e C) do <a href="https://ohtopico.com.br/material-adaptado/">material adaptado</a> e jogos, planos e fichas do <a href="https://ohtopico.com.br/material-didatico/">material didático</a>, contados pela lista de habilidades de cada material.',
            '<b>Ligações:</b> ' + METODO.format(bonus='da mesma unidade temática, do mesmo fio ou trabalhadas pelos mesmos materiais', seguinte='do ano seguinte'),
            '<b>Fios temáticos:</b> grupos de palavras escolhidos à mão (por exemplo, fração, numerador e denominador para "Frações"). Uma habilidade entra no fio quando o texto tem uma dessas palavras.',
        ],
        'fonte': 'bncc-matematica',
        'rodape': 'Fichas adaptadas para cada habilidade estão no <a href="https://ohtopico.com.br/material-adaptado/">site de docência</a>.',
    },
    {
        'slug': 'bncc-arte', 'disciplina': 'Arte', 'n': 61, 'terminal': 'bncc arte',
        'title': 'BNCC Arte em dados: como as habilidades se ligam',
        'description': 'Infográfico interativo das 61 habilidades de Arte da BNCC no Ensino Fundamental: como artes visuais, dança, música, teatro e artes integradas passam dos anos iniciais para os anos finais.',
        'og': '61 habilidades de Arte, dos anos iniciais aos anos finais: clique em uma e veja para onde ela vai.',
        'og_alt': 'BNCC Arte em dados: as habilidades dos anos iniciais aos anos finais ligadas por conteúdo',
        'lead': 'As 61 habilidades de Arte do Ensino Fundamental, ligadas pelo conteúdo dos anos iniciais (1º ao 5º ano) para o 6º, 7º, 8º e 9º ano. Clique em uma habilidade para ver de onde ela vem e para onde vai.',
        'pilulas': ['61 habilidades', '1º ao 9º ano', '5 linguagens', 'dados para baixar'],
        'progressao': 'A BNCC agrupa Arte em blocos: 26 habilidades para o 1º ao 5º ano e 35 para o 6º ao 9º. Aqui, as 35 dos anos finais estão distribuídas uma vez só, em um ano, numa proposta de Júlia Roberta Quoos Alves (veja "Sobre os dados"). Cada caixinha é uma habilidade, na coluna do seu ano. As linhas ligam habilidades de anos seguidos que tratam do mesmo conteúdo; quanto mais grossa, mais forte a ligação. Os fios seguem os objetos de conhecimento, como processos de criação ou patrimônio cultural.',
        'eixos_eyebrow': 'Linguagens', 'eixos_h2': 'Artes visuais, dança, música, teatro e artes integradas',
        'eixos_p': 'Quantas habilidades de cada linguagem há em cada ano. Do 1º ao 5º ano os números se repetem, porque a BNCC vale para o bloco inteiro; do 6º ao 9º, seguem a distribuição proposta. Clique em um quadro para ver a lista.',
        'verbos_p': 'O verbo que abre cada habilidade diz o tipo de trabalho esperado: explorar, experimentar, criar, analisar. Clique em uma barra para ver as habilidades.',
        'material_h2': '', 'material_p': '',
        'busca': 'Buscar por código ou palavra, por exemplo: música',
        'dataset': 'As 61 habilidades de Arte da BNCC do Ensino Fundamental (EF15AR e EF69AR), com linguagem, objeto de conhecimento, verbo e ligações de conteúdo entre os anos iniciais e os anos finais calculadas por semelhança de texto.',
        'base': ['http://basenacionalcomum.mec.gov.br/'],
        'sobre': [
            '<b>Habilidades:</b> BNCC, Arte do Ensino Fundamental (Resolução CNE/CP nº 2/2017): EF15AR01 a EF15AR26 para o 1º ao 5º ano e EF69AR01 a EF69AR35 para o 6º ao 9º ano. Os textos aparecem resumidos; para citar, use o documento oficial.',
            '<b>Distribuição do 6º ao 9º ano:</b> a BNCC e os currículos estaduais consultados (Referencial Curricular Gaúcho e Currículo da Rede Estadual Paranaense) repetem as habilidades dos anos finais em todos os anos. A distribuição por ano desta página é uma proposta para planejamento: em cada linguagem, elementos e materialidades vêm primeiro, depois criação, e o contexto histórico e a análise crítica ficam para o 8º e o 9º ano. Cada escola ou rede pode distribuir de outro jeito.',
            '<b>Linguagens:</b> artes visuais, dança, música, teatro e artes integradas, as unidades temáticas da BNCC de Arte.',
            '<b>Ligações:</b> ' + METODO.format(bonus='da mesma linguagem ou do mesmo objeto de conhecimento', seguinte='do ano seguinte (do bloco do 1º ao 5º ano para o 6º ano)'),
            '<b>Fios:</b> os objetos de conhecimento da BNCC (contextos e práticas, elementos da linguagem, materialidades, processos de criação e os das artes integradas).',
        ],
        'fonte': 'bncc-arte',
        'rodape': 'Materiais de Computação e Matemática para a sala de aula estão no <a href="https://ohtopico.com.br/material-didatico/">site de docência</a>.',
    },
    {
        'slug': 'bncc-lingua-portuguesa', 'disciplina': 'Língua Portuguesa', 'n': 185, 'terminal': 'bncc língua portuguesa',
        'title': 'BNCC Língua Portuguesa em dados: como as habilidades se ligam',
        'description': 'Infográfico interativo das 185 habilidades de Língua Portuguesa da BNCC do 6º ao 9º ano: campos de atuação, práticas de linguagem, verbos e como os conteúdos se ligam de um ano para o outro.',
        'og': '185 habilidades de Língua Portuguesa, do 6º ao 9º ano: clique em uma e veja de onde ela vem e para onde vai.',
        'og_alt': 'BNCC Língua Portuguesa em dados: as habilidades do 6º ao 9º ano ligadas por conteúdo',
        'lead': 'As 185 habilidades de Língua Portuguesa do 6º ao 9º ano, ligadas pelo conteúdo. Clique em uma habilidade para ver de onde ela vem e para onde vai.',
        'pilulas': ['185 habilidades', '6º ao 9º ano', '5 campos de atuação', 'dados para baixar'],
        'progressao': 'Na BNCC, parte das habilidades de Língua Portuguesa vale para um ano só (EF06LP, EF07LP...) e parte para blocos: EF69LP para os quatro anos, EF67LP para o 6º e 7º e EF89LP para o 8º e 9º. Cada coluna é um desses grupos, na ordem em que entram no percurso. As linhas ligam habilidades de colunas seguidas que tratam do mesmo conteúdo; quanto mais grossa, mais forte a ligação. Os fios são as práticas de linguagem: leitura, produção de textos, oralidade e análise linguística/semiótica. Para ver ano a ano, use o quadro de campos ou o filtro de ano na lista.',
        'eixos_eyebrow': 'Campos de atuação', 'eixos_h2': 'Jornalístico, vida pública, estudo e pesquisa, artístico-literário, ano a ano',
        'eixos_p': 'Quantas habilidades de cada campo de atuação valem em cada ano, somando as do ano e as dos blocos que incluem aquele ano. Clique em um quadro para ver a lista.',
        'verbos_p': 'O verbo que abre cada habilidade diz o tipo de trabalho esperado: analisar, identificar, produzir. Clique em uma barra para ver as habilidades.',
        'material_h2': '', 'material_p': '',
        'busca': 'Buscar por código ou palavra, por exemplo: notícia',
        'dataset': 'As 185 habilidades de Língua Portuguesa da BNCC do 6º ao 9º ano, com campo de atuação, prática de linguagem, objeto de conhecimento, verbo e ligações de conteúdo calculadas por semelhança de texto.',
        'base': ['http://basenacionalcomum.mec.gov.br/', 'https://github.com/bncc-dev/bncc-dados'],
        'sobre': [
            '<b>Habilidades:</b> BNCC, Língua Portuguesa do Ensino Fundamental (Resolução CNE/CP nº 2/2017), com o texto oficial, a partir da base aberta <a href="https://github.com/bncc-dev/bncc-dados">bncc.dev</a> (CC BY 4.0, mantida pela Profy).',
            '<b>Campos de atuação e práticas:</b> como na BNCC. Cada habilidade aparece no seu campo e na sua prática de linguagem principais.',
            '<b>Ligações:</b> ' + METODO.format(bonus='do mesmo campo de atuação ou da mesma prática de linguagem', seguinte='da coluna seguinte'),
        ],
        'fonte': 'bncc-linguagens',
        'rodape': 'Veja também a página de <a href="../bncc-literatura/">Literatura</a>, o recorte do campo artístico-literário.',
    },
    {
        'slug': 'bncc-literatura', 'disciplina': 'Literatura', 'n': 21, 'terminal': 'bncc literatura',
        'title': 'BNCC Literatura em dados: o campo artístico-literário do 6º ao 9º ano',
        'description': 'Infográfico interativo das 21 habilidades do campo artístico-literário de Língua Portuguesa da BNCC, do 6º ao 9º ano: leitura literária, produção, oralidade e como os conteúdos se ligam.',
        'og': 'As 21 habilidades de literatura da BNCC do 6º ao 9º ano: clique em uma e veja de onde ela vem e para onde vai.',
        'og_alt': 'BNCC Literatura em dados: o campo artístico-literário do 6º ao 9º ano',
        'lead': 'Na BNCC, a literatura faz parte de Língua Portuguesa, no campo artístico-literário. São 21 habilidades do 6º ao 9º ano, ligadas pelo conteúdo. Clique em uma para ver de onde ela vem e para onde vai.',
        'pilulas': ['21 habilidades', '6º ao 9º ano', 'campo artístico-literário', 'dados para baixar'],
        'progressao': 'Cada coluna é um grupo de habilidades da BNCC: EF69LP vale para os quatro anos, EF67LP para o 6º e 7º, EF89LP para o 8º e 9º, e as demais para um ano só. As linhas ligam habilidades de colunas seguidas que tratam do mesmo conteúdo. Os fios são os objetos de conhecimento. Para ver ano a ano, use o quadro de práticas ou o filtro de ano na lista.',
        'eixos_eyebrow': 'Práticas de linguagem', 'eixos_h2': 'Leitura, produção, oralidade e análise, ano a ano',
        'eixos_p': 'Quantas habilidades do campo artístico-literário há em cada prática de linguagem e em cada ano. Clique em um quadro para ver a lista.',
        'verbos_p': 'O verbo que abre cada habilidade diz o tipo de trabalho esperado: ler, inferir, criar. Clique em uma barra para ver as habilidades.',
        'material_h2': '', 'material_p': '',
        'busca': 'Buscar por código ou palavra, por exemplo: poema',
        'dataset': 'As 21 habilidades do campo artístico-literário de Língua Portuguesa da BNCC, do 6º ao 9º ano, com prática de linguagem, objeto de conhecimento, verbo e ligações de conteúdo calculadas por semelhança de texto.',
        'base': ['http://basenacionalcomum.mec.gov.br/', 'https://github.com/bncc-dev/bncc-dados'],
        'sobre': [
            '<b>Habilidades:</b> BNCC, Língua Portuguesa do Ensino Fundamental (Resolução CNE/CP nº 2/2017), com o texto oficial, a partir da base aberta <a href="https://github.com/bncc-dev/bncc-dados">bncc.dev</a> (CC BY 4.0, mantida pela Profy).',
            '<b>Recorte:</b> as habilidades de Língua Portuguesa do 6º ao 9º ano cujo campo de atuação é o artístico-literário. Habilidades de "todos os campos" não entram, mesmo quando servem para a literatura.',
            '<b>Ligações:</b> ' + METODO.format(bonus='da mesma prática de linguagem ou do mesmo objeto de conhecimento', seguinte='da coluna seguinte'),
        ],
        'fonte': 'bncc-linguagens',
        'rodape': 'Veja a <a href="../bncc-lingua-portuguesa/">BNCC Língua Portuguesa em dados</a> com todos os campos.',
    },
    {
        'slug': 'bncc-lingua-inglesa', 'disciplina': 'Língua Inglesa', 'n': 88, 'terminal': 'bncc língua inglesa',
        'title': 'BNCC Língua Inglesa em dados: como as habilidades se ligam',
        'description': 'Infográfico interativo das 88 habilidades de Língua Inglesa da BNCC do 6º ao 9º ano: eixos, unidades temáticas, verbos e como os conteúdos se ligam de um ano para o outro.',
        'og': '88 habilidades de Língua Inglesa, do 6º ao 9º ano: clique em uma e veja de onde ela vem e para onde vai.',
        'og_alt': 'BNCC Língua Inglesa em dados: as habilidades do 6º ao 9º ano ligadas por conteúdo',
        'lead': 'As 88 habilidades de Língua Inglesa do 6º ao 9º ano, ligadas pelo conteúdo de um ano para o outro. Clique em uma habilidade para ver de onde ela vem e para onde vai.',
        'pilulas': ['88 habilidades', '6º ao 9º ano', '5 eixos', 'dados para baixar'],
        'progressao': 'Cada caixinha é uma habilidade, na coluna do seu ano. As linhas ligam habilidades de anos seguidos que tratam do mesmo conteúdo; quanto mais grossa, mais forte a ligação. Os fios são as unidades temáticas, como gramática e estratégias de leitura.',
        'eixos_eyebrow': 'Eixos', 'eixos_h2': 'Oralidade, leitura, escrita, conhecimentos linguísticos e dimensão intercultural',
        'eixos_p': 'Quantas habilidades de cada eixo há em cada ano. Clique em um quadro para ver a lista.',
        'verbos_p': 'O verbo que abre cada habilidade diz o tipo de trabalho esperado: identificar, construir, utilizar. Clique em uma barra para ver as habilidades.',
        'material_h2': '', 'material_p': '',
        'busca': 'Buscar por código ou palavra, por exemplo: leitura',
        'dataset': 'As 88 habilidades de Língua Inglesa da BNCC do 6º ao 9º ano, com eixo, unidade temática, objeto de conhecimento, verbo e ligações de conteúdo calculadas por semelhança de texto.',
        'base': ['http://basenacionalcomum.mec.gov.br/', 'https://github.com/bncc-dev/bncc-dados'],
        'sobre': [
            '<b>Habilidades:</b> BNCC, Língua Inglesa do Ensino Fundamental (Resolução CNE/CP nº 2/2017), com o texto oficial, a partir da base aberta <a href="https://github.com/bncc-dev/bncc-dados">bncc.dev</a> (CC BY 4.0, mantida pela Profy).',
            '<b>Eixos e unidades temáticas:</b> como na BNCC. As unidades parecidas (por exemplo, as várias estratégias de escrita) foram juntadas em um fio só.',
            '<b>Ligações:</b> ' + METODO.format(bonus='do mesmo eixo ou da mesma unidade temática', seguinte='do ano seguinte'),
            '<b>Espanhol:</b> a BNCC traz só a Língua Inglesa como língua estrangeira obrigatória no Ensino Fundamental; não há habilidades de Espanhol.',
        ],
        'fonte': 'bncc-linguagens',
        'rodape': 'Materiais de Computação e Matemática para a sala de aula estão no <a href="https://ohtopico.com.br/material-didatico/">site de docência</a>.',
    },
]


def e(s):
    return html.escape(s, quote=True)


def pagina(p):
    url = f'https://juliaroberta.com/infograficos/{p["slug"]}/'
    ld = {'@context': 'https://schema.org', '@type': 'Dataset', 'name': f'Habilidades de {p["disciplina"]} da BNCC e as ligações entre os anos',
          'description': p['dataset'], 'url': url, 'inLanguage': 'pt-BR', 'spatialCoverage': 'Brasil',
          'creator': {'@type': 'Person', 'name': 'Júlia Roberta Quoos Alves', 'url': 'https://juliaroberta.com/curriculo/'}, 'isBasedOn': p['base']}
    outras = ' · '.join(f'<a href="../{q["slug"]}/">BNCC {q["disciplina"]}</a>' for q in PAGINAS if q is not p)
    material = '' if not p['material_h2'] else f'''
  <section class="block">
    <div class="wrap">
      <span class="eyebrow">Material pronto</span>
      <h2>{p['material_h2']}</h2>
      <p class="muted">{p['material_p']}</p>
      <div class="janela"><div class="janela-barra"><i></i><i></i><i></i><span>material.html</span></div>
        <div class="janela-corpo"><svg id="g-material" class="grafico" role="img" aria-label="Materiais por habilidade em cada ano"></svg><p class="nota" id="material-texto"></p></div></div>
    </div>
  </section>
'''
    if not material:
        material = '\n  <svg id="g-material" hidden></svg><p id="material-texto" hidden></p>\n'
    sobre = '\n'.join(f'        <li>{x}</li>' for x in p['sobre'])
    return f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(p['title'])} | Júlia Quoos</title>
<meta name="description" content="{e(p['description'])}">
<meta property="og:title" content="BNCC {e(p['disciplina'])} em dados | Júlia Quoos">
<meta property="og:description" content="{e(p['og'])}">
<meta property="og:url" content="{url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta name="author" content="Júlia Roberta Quoos Alves">
<link rel="canonical" href="{url}">
<meta property="og:site_name" content="Júlia Quoos">
<meta property="og:image" content="{url}og-{p['slug']}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e(p['og_alt'])}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sniglet:wght@400;800&family=Lexend:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/md.css">
<link rel="stylesheet" href="../assets/infograficos.css?v={V}">
<link rel="stylesheet" href="../assets/bncc-rede.css?v={V}">
<script>
  try {{ const t = JSON.parse(localStorage.getItem('iapraprof:theme')); if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t; }} catch (e) {{}}
</script>
<script type="application/ld+json">
{json.dumps(ld, ensure_ascii=False)}
</script>
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
  <a class="brand" href="../../">Júlia Quoos</a>
  <a class="brand-sub" href="../">/ infográficos</a>
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
      <span class="terminal">$ {e(p['terminal'])}</span>
      <h1>A BNCC {e(p['disciplina'])} <mark>em dados</mark></h1>
      <p class="lead">{p['lead']}</p>
      <ul class="pilulas">{''.join(f'<li>{e(x)}</li>' for x in p['pilulas'])}</ul>
    </div></div>
  </section>

  <section class="block">
    <div class="wrap">
      <div class="resumo-num" id="resumo"></div>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <span class="eyebrow">Progressão</span>
      <h2>Como os conteúdos se ligam ao longo dos anos</h2>
      <p class="muted">{p['progressao']}</p>
      <div class="seletor" id="fios" role="group" aria-label="Fios temáticos"></div>
      <div class="legenda" id="legenda-eixos" style="margin-top:12px"></div>
      <div class="janela" style="margin-top:14px"><div class="janela-barra"><i></i><i></i><i></i><span>progressao.html</span></div>
        <div class="janela-corpo">
          <div id="detalhe" class="detalhe" aria-live="polite"><p class="nota">Clique em uma habilidade para ver o texto, as ligações e a trilha.</p></div>
          <div class="rolagem"><svg id="g-rede" class="grafico rede" role="img" aria-label="Habilidades por ano ligadas por conteúdo"></svg></div>
        </div></div>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <span class="eyebrow">{e(p['eixos_eyebrow'])}</span>
      <h2>{e(p['eixos_h2'])}</h2>
      <p class="muted">{p['eixos_p']}</p>
      <div class="janela"><div class="janela-barra"><i></i><i></i><i></i><span>eixos.html</span></div>
        <div class="janela-corpo"><div class="rolagem"><table class="mapa-calor" id="t-eixos"></table></div></div></div>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <span class="eyebrow">Verbos</span>
      <h2>O que a BNCC pede que o estudante faça</h2>
      <p class="muted">{p['verbos_p']}</p>
      <div class="janela"><div class="janela-barra"><i></i><i></i><i></i><span>verbos.html</span></div>
        <div class="janela-corpo"><svg id="g-verbos" class="grafico" role="img" aria-label="Verbos que abrem as habilidades"></svg></div></div>
    </div>
  </section>
{material}
  <section class="block">
    <div class="wrap">
      <span class="eyebrow">Todas as habilidades</span>
      <h2 id="t-lista">Procure uma habilidade</h2>
      <div class="controles">
        <label class="busca"><span class="sr-only">Buscar</span><input type="search" id="busca" placeholder="{e(p['busca'])}"></label>
        <button class="chip" type="button" id="limpar">Limpar filtro</button>
        <button class="chip" type="button" id="baixar">Baixar CSV</button>
      </div>
      <p class="nota" id="filtro-texto" style="margin-top:10px"></p>
      <ul class="lista-habs" id="lista"></ul>
      <p><button class="chip" type="button" id="mais" hidden>Mostrar todas as habilidades</button></p>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <span class="eyebrow">Sobre os dados</span>
      <h2>De onde vêm os números e como as ligações foram calculadas</h2>
      <ul class="leitura">
{sobre}
        <li>Código de geração em <a href="https://github.com/ohtopico/site-dados/tree/main/_fonte/{p['fonte']}">_fonte/{p['fonte']}</a> e <a href="https://github.com/ohtopico/site-dados/tree/main/_fonte/bncc">_fonte/bncc</a>. Análise: Júlia Roberta Quoos Alves. Uso livre com citação da fonte.</li>
        <li>Veja também: {outras}.</li>
      </ul>
    </div>
  </section>
</main>

<footer class="footer"><div class="wrap">
  <p>Infográfico organizado por <a href="/curriculo/">Júlia Roberta Quoos Alves</a>. Veja os <a href="../">outros infográficos interativos</a>. {p['rodape']}</p>
  <p>Júlia Roberta Quoos Alves · <a href="https://juliaroberta.com/">juliaroberta.com</a> · Formação de professores em <a href="https://ohtopico.com.br/">ohtopico.com.br</a></p>
</div></footer>
<div id="tip-g" role="tooltip"></div>
<script src="dados.js?v={V}"></script>
<script src="../assets/bncc-rede.js?v={V}"></script>
</body>
</html>
'''


if __name__ == '__main__':
    for p in PAGINAS:
        pasta = os.path.join(RAIZ, 'infograficos', p['slug'])
        os.makedirs(pasta, exist_ok=True)
        with open(os.path.join(pasta, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(pagina(p))
        print('ok', p['slug'])
