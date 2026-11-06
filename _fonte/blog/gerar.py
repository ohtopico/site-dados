"""Gera o blog de juliaroberta.com.

Entrada: _fonte/blog/posts.json (lista de posts) e _fonte/blog/conteudo/<slug>.html (texto do post).
Saída:   blog/index.html, blog/<slug>/index.html, blog/feed.xml e o bloco do blog em sitemap.xml.

Só publica posts com "data" até hoje (horário de Brasília). A Action
.github/workflows/publicar-blog.yml roda todo dia e a cada mudança em _fonte/blog/.

Uso: python3 _fonte/blog/gerar.py            (publica o que tem data até hoje)
     python3 _fonte/blog/gerar.py --ate AAAA-MM-DD
"""
import datetime as dt, html, json, os, re, shutil, sys, urllib.parse

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
BLOG = os.path.join(RAIZ, 'blog')
SITE = 'https://juliaroberta.com'
AUTORA = 'Júlia Roberta Quoos Alves'
TITULO_BLOG = 'Blog de dados de Júlia Roberta Quoos Alves'
DESCRICAO_BLOG = 'Bastidores de projetos de dados e IA, dados abertos do Brasil e notas de quem trabalha com engenharia de dados, machine learning e visualização.'
MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
GTAG = '''<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Z7QDTBLC4K"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-Z7QDTBLC4K');
</script>'''

esc = lambda s: html.escape(s, quote=True)


def hoje():
    for i, a in enumerate(sys.argv):
        if a == '--ate' and i + 1 < len(sys.argv):
            return dt.date.fromisoformat(sys.argv[i + 1])
    return dt.datetime.now(dt.timezone(dt.timedelta(hours=-3))).date()


def data_br(d):
    d = dt.date.fromisoformat(d)
    return f'{d.day} de {MESES[d.month - 1]} de {d.year}'


def ancora(t):
    import unicodedata
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def minutos(texto):
    palavras = len(re.sub(r'<[^>]+>', ' ', texto).split())
    return max(1, round(palavras / 200))


def cabeca(titulo, descricao, url, imagem, tipo='article', extra=''):
    img = SITE + imagem
    return f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<title>{esc(titulo)}</title>
<meta name="description" content="{esc(descricao)}">
<meta name="author" content="{AUTORA}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{tipo}">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Júlia Quoos">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(titulo)}">
<meta property="og:description" content="{esc(descricao)}">
<meta property="og:image" content="{img}">
<meta name="twitter:card" content="summary_large_image">
{extra}<script>try {{ const t = JSON.parse(localStorage.getItem('iapraprof:theme')); if (t) document.documentElement.dataset.theme = t; }} catch (e) {{}}</script>
<link rel="stylesheet" href="/assets/fontes/fontes.css">
<link rel="stylesheet" href="/blog/assets/blog.css?v={VERSAO}">
<link rel="alternate" type="application/rss+xml" title="{TITULO_BLOG}" href="/blog/feed.xml">
{GTAG}
</head>
'''


def moldura(principal, publicados, atual=None):
    recentes = ''.join(f'<li><a href="/blog/{p["slug"]}/">{esc(p["titulo"])}</a></li>' for p in publicados[:5])
    temas = sorted({p['tema'] for p in publicados})
    lista_temas = ''.join(f'<li><a href="/blog/#{ancora(t)}">{esc(t)}</a></li>' for t in temas)
    blog_atual = ' aria-current="page"' if atual == 'indice' else ''
    return f'''<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<div class="area">
<div class="janela">
    <header class="cabecalho">
        <a class="marca-site" href="/">Júlia Quoos</a>
        <nav class="cabecalho-links" aria-label="Principal">
            <a href="/blog/"{blog_atual}>Blog</a>
            <a href="/infograficos/">Infográficos</a>
            <a href="/curriculo/">Currículo</a>
        </nav>
    </header>
    <div class="corpo">
        <main class="pagina" id="conteudo" tabindex="-1">
{principal}
        </main>
        <aside class="lateral lateral-esq" aria-label="Menu do blog">
            <section class="caixa caixa-amarela">
                <h2 class="caixa-titulo">★ Navegue</h2>
                <ul class="lista-menu"><li><a href="/"><span aria-hidden="true">◄</span> Área de trabalho</a></li><li><a href="/blog/"><span aria-hidden="true">⌂</span> Início do blog</a></li><li><a href="/infograficos/"><span aria-hidden="true">▲</span> Infográficos</a></li><li><a href="/infograficos/interesse-por-ia/notebooks/"><span aria-hidden="true">✎</span> Notebooks</a></li><li><a href="/curriculo/"><span aria-hidden="true">✦</span> Currículo</a></li></ul>
                <button type="button" class="btn98 tema-btn" id="tema-btn"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg> Tema claro/escuro</button>
            </section>
            <section class="caixa">
                <h2 class="caixa-titulo">★ Temas</h2>
                <ul class="lista-menu">{lista_temas}</ul>
            </section>
            <section class="caixa caixa-verde">
                <h2 class="caixa-titulo">★ Posts recentes</h2>
                <ul class="lista-recentes">{recentes}</ul>
            </section>
        </aside>
        <aside class="lateral lateral-dir" aria-label="Sobre a autora">
            <section class="caixa">
                <h2 class="caixa-titulo">★ Quem escreve</h2>
                <img class="foto" src="/img/perfil.jpg" alt="Foto de {AUTORA}" width="96" height="96" loading="lazy">
                <p><strong>{AUTORA}</strong>, engenheira de dados e de machine learning, mestranda em Ciência da Computação na UFSM.</p>
                <a class="btn98 escuro" href="/curriculo/">Currículo</a>
            </section>
            <section class="caixa caixa-amarela">
                <h2 class="caixa-titulo">★ Site de docência</h2>
                <p>Material didático, simuladores e formação de professores ficam em ohtopico.com.br.</p>
                <a class="btn98 escuro" href="https://ohtopico.com.br/">Ir para o site</a>
            </section>
            <section class="caixa">
                <h2 class="caixa-titulo">★ Selos</h2>
                <ul class="selos">
                    <li class="selo selo-amarelo">feito à mão</li>
                    <li class="selo selo-verde">dados abertos</li>
                    <li class="selo"><a href="/blog/feed.xml">RSS</a></li>
                </ul>
            </section>
        </aside>
    </div>
</div>
</div>
<footer class="rodape">
    <p>© {dt.date.today().year} {AUTORA} · dados e IA</p>
    <p><a href="mailto:contato@ohtopico.com.br">contato@ohtopico.com.br</a> · <a href="https://www.linkedin.com/in/ohtopico" rel="me">LinkedIn</a> · <a href="https://github.com/ohtopico" rel="me">GitHub</a> · <a href="https://ohtopico.com.br/">ohtopico.com.br</a></p>
</footer>
<script src="/blog/assets/blog.js?v={VERSAO}" defer></script>
</body>
</html>
'''


def pagina_post(p, texto, publicados, i):
    url = f'{SITE}/blog/{p["slug"]}/'
    ld = {
        '@context': 'https://schema.org',
        '@graph': [
            {'@type': 'BlogPosting', '@id': url + '#post', 'headline': p['titulo'], 'description': p['descricao'],
             'url': url, 'mainEntityOfPage': url, 'image': SITE + p['imagem'],
             'datePublished': p['data'], 'dateModified': p.get('atualizado', p['data']), 'inLanguage': 'pt-BR',
             'keywords': p.get('palavras', []), 'articleSection': p['tema'],
             'author': {'@type': 'Person', '@id': SITE + '/#julia', 'name': AUTORA, 'url': SITE + '/'},
             'publisher': {'@id': SITE + '/#julia'},
             'isPartOf': {'@type': 'Blog', '@id': SITE + '/blog/#blog', 'name': TITULO_BLOG},
             'timeRequired': f'PT{minutos(texto)}M'},
            {'@type': 'BreadcrumbList', 'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': 'Início', 'item': SITE + '/'},
                {'@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': SITE + '/blog/'},
                {'@type': 'ListItem', 'position': 3, 'name': p['titulo'], 'item': url}]}]}
    extra = (f'<meta property="article:published_time" content="{p["data"]}">\n'
             f'<meta property="article:section" content="{esc(p["tema"])}">\n'
             f'<script type="application/ld+json">\n{json.dumps(ld, ensure_ascii=False, indent=2)}\n</script>\n')
    u = urllib.parse.quote(url, safe='')
    vizinhos = []
    if i + 1 < len(publicados):
        a = publicados[i + 1]
        vizinhos.append(f'<a class="ant" href="/blog/{a["slug"]}/" rel="prev"><span>◄ Anterior</span>{esc(a["titulo"])}</a>')
    if i > 0:
        a = publicados[i - 1]
        vizinhos.append(f'<a class="prox" href="/blog/{a["slug"]}/" rel="next"><span>Próximo ►</span>{esc(a["titulo"])}</a>')
    nav = f'\n    <nav class="vizinhos" aria-label="Outros posts">{"".join(vizinhos)}</nav>' if vizinhos else ''
    principal = f'''<article class="texto">
    <nav class="trilha" aria-label="Você está em"><ol><li><a href="/">Início</a></li><li><a href="/blog/">Blog</a></li><li aria-current="page">{esc(p["tema"])}</li></ol></nav>
    <p class="rotulo">{esc(p["tema"])}</p>
    <h1>{esc(p["titulo"])}</h1>
    <p class="linha-fina">{esc(p["descricao"])}</p>
    <div class="meta">
        <img src="/img/perfil.jpg" alt="Foto de {AUTORA}" width="36" height="36">
        <span>Por <a href="/curriculo/" rel="author">{AUTORA}</a></span>
        <span><time datetime="{p["data"]}">{data_br(p["data"])}</time></span>
        <span>{minutos(texto)} min de leitura</span>
    </div>
    <div class="artigo">
{texto.strip()}
    </div>
    <div class="compartilhar">
        <p>Compartilhar:</p>
        <a class="btn98" href="https://www.linkedin.com/sharing/share-offsite/?url={u}" target="_blank" rel="noopener">LinkedIn<span class="sr-only"> (abre em nova aba)</span></a>
        <a class="btn98" href="https://wa.me/?text={urllib.parse.quote(p["titulo"] + " " + url, safe="")}" target="_blank" rel="noopener">WhatsApp<span class="sr-only"> (abre em nova aba)</span></a>
    </div>
    <aside class="autora" aria-labelledby="sobre-autora">
        <img src="/img/perfil.jpg" alt="Foto de {AUTORA}" width="72" height="72" loading="lazy">
        <div>
            <h2 id="sobre-autora">{AUTORA}</h2>
            <p>Engenheira de dados e de machine learning, especialista em Ciência de Dados e Big Data Analytics (UNISC) e mestranda em Ciência da Computação na UFSM.</p>
            <p class="links"><a href="/curriculo/">Currículo</a> <a href="https://github.com/ohtopico" rel="me">GitHub</a> <a href="https://www.linkedin.com/in/ohtopico" rel="me">LinkedIn</a></p>
        </div>
    </aside>{nav}
</article>'''
    # o Google corta o título perto de 60 caracteres: use "titulo_seo" no posts.json para um título mais curto
    t = p.get('titulo_seo') or p['titulo']
    return cabeca(t if len(t) > 46 else f'{t} | Júlia Quoos', p['descricao'], url, p['imagem'], extra=extra) + moldura(principal, publicados)


def pagina_indice(publicados):
    temas = []
    for p in publicados:
        if p['tema'] not in temas:
            temas.append(p['tema'])
    secoes = []
    for t in temas:
        cartoes = '\n'.join(f'''            <li class="cartao">
                <a href="/blog/{p["slug"]}/">
                    <img src="{p["imagem"]}" alt="{esc(p["alt"])}" width="1200" height="630" loading="lazy" decoding="async">
                    <h3>{esc(p["titulo"])}</h3>
                    <span class="data-post">{data_br(p["data"])}</span>
                </a>
            </li>''' for p in publicados if p['tema'] == t)
        secoes.append(f'''    <section class="tema" id="{ancora(t)}" aria-labelledby="t-{ancora(t)}">
        <h2 class="tema-titulo" id="t-{ancora(t)}">{esc(t)}</h2>
        <ul class="grade-posts">
{cartoes}
        </ul>
    </section>''')
    vazio = '' if publicados else '    <p>Os primeiros posts estão a caminho.</p>'
    principal = f'''<div class="texto capa">
    <p class="rotulo">Blog</p>
    <h1>Dados e IA, <span class="marca">por dentro</span></h1>
    <p class="linha-fina">{DESCRICAO_BLOG}</p>
{chr(10).join(secoes)}{vazio}
</div>'''
    ld = {'@context': 'https://schema.org', '@type': 'Blog', '@id': SITE + '/blog/#blog', 'name': TITULO_BLOG,
          'url': SITE + '/blog/', 'inLanguage': 'pt-BR', 'author': {'@id': SITE + '/#julia'},
          'blogPost': [{'@type': 'BlogPosting', 'headline': p['titulo'], 'url': f'{SITE}/blog/{p["slug"]}/', 'datePublished': p['data']} for p in publicados]}
    extra = f'<script type="application/ld+json">\n{json.dumps(ld, ensure_ascii=False, indent=2)}\n</script>\n'
    imagem = publicados[0]['imagem'] if publicados else '/infograficos/og-infograficos.jpg'
    return cabeca(f'Blog de dados e IA | Júlia Quoos', DESCRICAO_BLOG, SITE + '/blog/', imagem, tipo='website', extra=extra) + moldura(principal, publicados, 'indice')


def feed(publicados):
    itens = ''.join(f'''
  <item>
    <title>{esc(p["titulo"])}</title>
    <link>{SITE}/blog/{p["slug"]}/</link>
    <guid>{SITE}/blog/{p["slug"]}/</guid>
    <pubDate>{dt.datetime.fromisoformat(p["data"] + "T09:00:00-03:00").strftime("%a, %d %b %Y %H:%M:%S -0300")}</pubDate>
    <description>{esc(p["descricao"])}</description>
  </item>''' for p in publicados[:20])
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>{TITULO_BLOG}</title>
  <link>{SITE}/blog/</link>
  <description>{esc(DESCRICAO_BLOG)}</description>
  <language>pt-BR</language>{itens}
</channel>
</rss>
'''


def sitemap(publicados):
    caminho = os.path.join(RAIZ, 'sitemap.xml')
    t = open(caminho, encoding='utf-8').read()
    ult = publicados[0]['data'] if publicados else hoje().isoformat()
    bloco = f'  <url><loc>{SITE}/blog/</loc><lastmod>{ult}</lastmod></url>\n' + ''.join(
        f'  <url><loc>{SITE}/blog/{p["slug"]}/</loc><lastmod>{p.get("atualizado", p["data"])}</lastmod></url>\n' for p in publicados)
    bloco = '  <!-- blog:inicio -->\n' + bloco + '  <!-- blog:fim -->\n'
    if '<!-- blog:inicio -->' in t:
        t = re.sub(r'  <!-- blog:inicio -->\n.*?  <!-- blog:fim -->\n', lambda m: bloco, t, flags=re.S)
    else:
        t = t.replace('</urlset>', bloco + '</urlset>')
    open(caminho, 'w', encoding='utf-8').write(t)


def main():
    global VERSAO
    import hashlib
    css = open(os.path.join(BLOG, 'assets', 'blog.css'), 'rb').read() + open(os.path.join(BLOG, 'assets', 'blog.js'), 'rb').read()
    VERSAO = hashlib.sha1(css).hexdigest()[:10]
    posts = json.load(open(os.path.join(AQUI, 'posts.json'), encoding='utf-8'))
    limite = hoje()
    publicados = sorted([p for p in posts if dt.date.fromisoformat(p['data']) <= limite], key=lambda p: p['data'], reverse=True)
    slugs = {p['slug'] for p in publicados}
    # apaga páginas de posts que saíram da lista (ou ainda não chegaram na data)
    for nome in os.listdir(BLOG):
        if nome != 'assets' and os.path.isdir(os.path.join(BLOG, nome)) and nome not in slugs:
            shutil.rmtree(os.path.join(BLOG, nome))
    for i, p in enumerate(publicados):
        texto = open(os.path.join(AQUI, 'conteudo', p['slug'] + '.html'), encoding='utf-8').read()
        os.makedirs(os.path.join(BLOG, p['slug']), exist_ok=True)
        open(os.path.join(BLOG, p['slug'], 'index.html'), 'w', encoding='utf-8').write(pagina_post(p, texto, publicados, i))
    open(os.path.join(BLOG, 'index.html'), 'w', encoding='utf-8').write(pagina_indice(publicados))
    open(os.path.join(BLOG, 'feed.xml'), 'w', encoding='utf-8').write(feed(publicados))
    sitemap(publicados)
    print(f'{len(publicados)} post(s) publicados, {len(posts) - len(publicados)} agendado(s).')


if __name__ == '__main__':
    main()
