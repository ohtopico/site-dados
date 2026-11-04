# juliaroberta.com

Site de dados e IA de Júlia Roberta Quoos Alves: projetos, infográficos interativos com dados abertos, notebooks e currículo de dados. Publicado pelo GitHub Pages no domínio juliaroberta.com (arquivo `CNAME`).

O trabalho com formação de professores, material didático, simuladores e blog fica em [ohtopico.com.br](https://ohtopico.com.br) (repositório [ohtopico/site](https://github.com/ohtopico/site)).

## O que tem aqui

| Caminho | O que é |
|---|---|
| `index.html` | Página inicial, no mesmo modelo de área de trabalho do ohtopico.com.br |
| `blog/` | Blog de dados e IA, gerado por `_fonte/blog/gerar.py` |
| `curriculo/` | Currículo de dados (a versão de docência fica em ohtopico.com.br/curriculo/) |
| `infograficos/` | Painéis: BNCC Computação em dados, dados da educação no Vale do Rio Pardo, Novo Cabrais, chuva do RS e El Niño, interesse por IA na Wikipédia, paisagem sonora de Nova York |
| `infograficos/interesse-por-ia/notebooks/` | Página dos notebooks com dados da Wikipédia |
| `notebooks/` | Notebooks (.ipynb) que abrem no Colab |
| `assets/md.css` | Estilo compartilhado pelos infográficos |
| `_fonte/` | Geradores (não publicados): `blog`, `dados-da-regiao`, `interesse-ia`, `notebooks` |

## Blog

Cada post é uma entrada em `_fonte/blog/posts.json` (slug, título, descrição, data, tema, imagem, alt) e um arquivo `_fonte/blog/conteudo/<slug>.html` com o texto. Posts com data futura ficam agendados: a Action `.github/workflows/publicar-blog.yml` roda todo dia às 6h (Brasília) e publica os que chegaram na data, além do índice, do RSS (`blog/feed.xml`) e do sitemap.

## BNCC Computação

`node _fonte/bncc-computacao/extrair.js <pasta do repositório ohtopico/site>` lê o catálogo de habilidades e materiais do ohtopico.com.br e grava `habilidades.json`. `python3 _fonte/bncc-computacao/gerar.py` calcula as ligações entre os anos (TF-IDF e cosseno, método explicado na própria página) e grava `infograficos/bncc-computacao/dados.js`. A imagem de compartilhamento sai de `_fonte/bncc-computacao/og/` (Playwright, fontes Sniglet e Lexend locais).

## Atualização automática

A Action `.github/workflows/atualizar-interesse-ia.yml` baixa as visualizações da Wikipédia todo dia 3 e atualiza o painel de interesse por IA.

## Licença

Textos, dados tratados e notebooks: CC BY-NC-SA 4.0, com citação da autora.
