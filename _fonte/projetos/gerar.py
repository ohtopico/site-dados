"""Gera os estudos de caso de juliaroberta.com/projetos/.

Entrada: a lista PROJETOS abaixo (texto de cada estudo de caso).
Saída:   projetos/index.html, projetos/<slug>/index.html e o bloco de projetos em sitemap.xml.

As imagens de cada projeto ficam em projetos/<slug>/ (não são geradas aqui).
As capas de compartilhamento (og.jpg) saem de _fonte/projetos/og/gerar.js.

Uso: python3 _fonte/projetos/gerar.py
"""
import html, json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
SITE = 'https://juliaroberta.com'
AUTORA = 'Júlia Roberta Quoos Alves'
GTAG = '''<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Z7QDTBLC4K"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-Z7QDTBLC4K');
</script>'''

esc = lambda s: html.escape(s, quote=True)

PROJETOS = [
    {
        'slug': 'proximidade-objetos-deficiencia-visual',
        'titulo': 'Visão computacional para pessoas com deficiência visual',
        'titulo_seo': 'Visão computacional para pessoas cegas: estudo de caso',
        'curto': 'Objetos e proximidade para pessoas cegas',
        'descricao': 'Pesquisa de mestrado na UFSM: modelos leves (MobileNet) para reconhecer cenas, objetos e obstáculos próximos em uma mochila inteligente para pessoas cegas ou com baixa visão.',
        'resumo_card': 'Pesquisa de mestrado: MobileNets para reconhecer cenas e um pipeline que aponta os obstáculos mais próximos, pensado para rodar numa mochila.',
        'terminal': '$ mestrado · visão computacional',
        'tags': ['PyTorch', 'MobileNet', 'SegFormer', 'Depth Anything', 'Mestrado'],
        'github': 'ohtopico/segmentacao-cegos',
        'ficha': [
            ('Pergunta', 'Como avisar uma pessoa cega sobre o ambiente e os obstáculos à frente usando só uma câmera e um computador pequeno?'),
            ('Dados', 'MIT67, NYU Depth V2 (RGB e RGB-D), SUN RGB-D e um dataset próprio com 730 fotos e 3 vídeos de corredores e salas da UFSM.'),
            ('Método', 'Quatro variantes da MobileNet treinadas com três sementes cada; segmentação semântica (SegFormer, ADE20K) e profundidade relativa (Depth Anything) sem treino extra.'),
            ('Situação', 'Em andamento. Defesa prevista para junho de 2027; os resultados de acurácia vão para a dissertação.'),
        ],
        'numeros': [('1,5 M', 'parâmetros na MobileNetV3 Small'), ('10 ms', 'por imagem em CPU'), ('4 × 3', 'modelos × sementes por experimento'), ('730', 'fotos próprias da UFSM')],
        'corpo': '''
<h2>O problema</h2>
<p>Uma bengala avisa o que está no chão, mas não diz se a pessoa entrou num corredor ou numa sala, nem que há uma porta aberta ou uma lixeira na altura do quadril. A ideia da pesquisa é uma mochila com câmera e um computador embarcado que descreva o ambiente por voz. Isso impõe uma restrição forte: o modelo precisa ser leve o bastante para rodar sem placa de vídeo, com bateria, em tempo real.</p>

<h2>Duas frentes</h2>
<h3>1. Que tipo de lugar é este?</h3>
<p>Para reconhecer a cena, comparo quatro arquiteturas MobileNet (V1, V2, V3 Small e V3 Large), que foram desenhadas para celulares. Cada uma é treinada com três sementes diferentes, para que a comparação considere a variação do próprio treino e não um resultado de sorte. Os experimentos usam bases públicas (MIT67, NYU Depth V2 e SUN RGB-D, com e sem a profundidade) e uma base própria, fotografada nos prédios da UFSM.</p>
<p>Na base própria, um cuidado foi decisivo: fotos tiradas no mesmo minuto e frames do mesmo vídeo ficam sempre na mesma partição. Sem isso, quase-duplicatas iriam para o treino e para o teste ao mesmo tempo, e a acurácia pareceria maior do que é.</p>

<h3>2. O que está perto de mim?</h3>
<p>A segunda frente não precisa de rótulos nem de treino. Dois modelos já treinados trabalham juntos: o SegFormer separa a imagem em objetos (parede, porta, cadeira, pessoa, chão, escada) e o Depth Anything estima a profundidade relativa. Cruzando os dois, o sistema lista os objetos que estão no terço mais próximo da cena, que são os candidatos a obstáculo.</p>
<div class="painel-4">
  <figure><img src="foto.jpg" alt="Foto de um corredor da UFSM" width="206" height="366" loading="lazy"><figcaption>Foto original</figcaption></figure>
  <figure><img src="objetos.jpg" alt="O mesmo corredor com parede, chão e teto pintados em cores diferentes" width="206" height="366" loading="lazy"><figcaption>Objetos (SegFormer)</figcaption></figure>
  <figure><img src="proximidade.jpg" alt="Mapa de proximidade do corredor: amarelo perto, roxo longe" width="206" height="366" loading="lazy"><figcaption>Proximidade (quente = perto)</figcaption></figure>
  <figure><img src="obstaculos.jpg" alt="O corredor com só os objetos mais próximos destacados: chão, parede e teto" width="206" height="366" loading="lazy"><figcaption>Obstáculos próximos</figcaption></figure>
</div>
<p class="nota">Um corredor da UFSM passando pelo pipeline. Saída do notebook do repositório.</p>

<h2>Leve de verdade</h2>
<p>Medi o custo de cada arquitetura, além da acurácia. A MobileNetV3 Small tem 1,5 milhão de parâmetros e leva cerca de 10 ms por imagem em CPU; a MobileNetV1, com 3,2 milhões, leva cerca de 31 ms. Para um aparelho com bateria, essa diferença decide qual modelo é viável.</p>

<h2>Para explicar o que o modelo vê</h2>
<p>O pipeline também gera mapas Grad-CAM, que mostram em que parte da foto o modelo se apoiou para decidir a cena. Numa tecnologia assistiva, entender por que o modelo errou importa tanto quanto a taxa de acerto.</p>

<h2>Próximos passos</h2>
<ul>
<li>Completar a rotulagem da base da UFSM, que ainda tem classes com poucas fotos.</li>
<li>Testar a fusão de imagem e profundidade (RGB-D) nos modelos leves.</li>
<li>Levar o melhor modelo para o hardware embarcado e para a demonstração por voz.</li>
</ul>
<p>Uma demonstração com comandos de voz está em <a href="https://ohtopico.com.br/teste-mestrado">ohtopico.com.br/teste-mestrado</a>.</p>
''',
    },
    {
        'slug': 'previsao-recompra-clientes',
        'titulo': 'Quem vai comprar de novo? Previsão de recompra em 60 dias',
        'titulo_seo': 'Previsão de recompra de clientes: estudo de caso',
        'curto': 'Previsão de recompra de clientes',
        'descricao': 'Estudo de caso com 541 mil transações de um varejo online: segmentação RFM, janela de observação sem vazamento e 12 modelos comparados para prever a recompra em 60 dias.',
        'resumo_card': '541 mil transações, segmentação RFM e 12 modelos comparados. A regressão logística com 5 variáveis empatou com as alternativas mais complexas.',
        'terminal': '$ machine learning · varejo',
        'tags': ['pandas', 'scikit-learn', 'LightGBM', 'XGBoost', 'RFM'],
        'github': 'ohtopico/online-retail-dataset',
        'ficha': [
            ('Pergunta', 'Quais clientes têm maior probabilidade de comprar de novo nos próximos 60 dias, e como usar isso para priorizar ações comerciais?'),
            ('Dados', 'Online Retail Dataset (UCI): 541.909 transações de um varejo online do Reino Unido, de dezembro de 2010 a dezembro de 2011.'),
            ('Método', 'Limpeza, análise exploratória, segmentação RFM e três conjuntos de variáveis testados em 5 tipos de modelo, com a mesma divisão de clientes.'),
            ('Resultado', 'Regressão logística com 5 variáveis: ROC AUC de 0,73 e F1 de 0,62 no teste, empatando com o modelo de 43 variáveis.'),
        ],
        'numeros': [('541 mil', 'transações na base original'), ('4.257', 'clientes depois da limpeza'), ('12', 'combinações de modelo e variáveis'), ('0,73', 'ROC AUC do melhor modelo')],
        'corpo': '''
<h2>De transações a clientes</h2>
<p>A base original tem uma linha por item vendido. Antes de qualquer modelo, foi preciso decidir o que entra: linhas sem identificador de cliente saem, porque não podem ser ligadas a ninguém; pedidos cancelados (códigos que começam com C) vão para uma análise própria; quantidades e preços não positivos saem; e os valores extremos de quantidade e preço são cortados pelo método do intervalo interquartil. Sobram 382.861 linhas, 17.626 pedidos e 4.257 clientes.</p>
<p>A análise exploratória já traz informação útil para o negócio: 65% dos clientes compram mais de uma vez, a taxa de cancelamento é de 17%, e há 23 itens baratos que quase não vendem, um risco de estoque parado.</p>

<h2>Sem olhar para o futuro</h2>
<p>A decisão metodológica mais importante foi separar o tempo. Tudo o que descreve o cliente (recência, frequência, valor, diversidade de produtos, taxa de cancelamento) é calculado só com as transações até 10/10/2011. O alvo é se ele comprou nos 60 dias seguintes. Se as variáveis usassem dados da janela de previsão, o modelo pareceria ótimo no notebook e falharia no uso real. A base de modelagem ficou com 3.654 clientes, 48% deles recompradores, separados em 80% para treino e 20% para teste de forma estratificada.</p>

<h2>Três rodadas de variáveis</h2>
<ol>
<li><strong>RFM:</strong> recência, frequência e valor monetário.</li>
<li><strong>Expandida (43 colunas):</strong> RFM mais quantidade comprada, diversidade de produtos, taxa de cancelamento, intervalo médio entre pedidos e país.</li>
<li><strong>Agregada (5 colunas):</strong> recência, frequência, valor, quantidade total e itens únicos.</li>
</ol>
<div class="barras" role="img" aria-label="ROC AUC no conjunto de teste: regressão logística agregada 0,732; logística expandida 0,731; logística RFM 0,727; random forest expandida 0,704; LightGBM expandida 0,694; LightGBM agregada 0,687; random forest agregada 0,681; random forest RFM 0,678; XGBoost agregada 0,663; árvore de decisão expandida 0,566; árvore de decisão agregada 0,542.">
  <p class="barras-titulo">ROC AUC no teste (quanto maior, melhor; 0,5 é o acaso)</p>
  <div class="barra destaque"><span>Logística, agregada (5)</span><b style="--v:73.22%">0,732</b></div>
  <div class="barra"><span>Logística, expandida (43)</span><b style="--v:73.08%">0,731</b></div>
  <div class="barra"><span>Logística, RFM</span><b style="--v:72.67%">0,727</b></div>
  <div class="barra"><span>Random Forest, expandida</span><b style="--v:70.41%">0,704</b></div>
  <div class="barra"><span>LightGBM, expandida</span><b style="--v:69.35%">0,694</b></div>
  <div class="barra"><span>LightGBM, agregada</span><b style="--v:68.74%">0,687</b></div>
  <div class="barra"><span>Random Forest, agregada</span><b style="--v:68.06%">0,681</b></div>
  <div class="barra"><span>Random Forest, RFM</span><b style="--v:67.82%">0,678</b></div>
  <div class="barra"><span>XGBoost, agregada</span><b style="--v:66.31%">0,663</b></div>
  <div class="barra"><span>Árvore de decisão, expandida</span><b style="--v:56.63%">0,566</b></div>
  <div class="barra"><span>Árvore de decisão, agregada</span><b style="--v:54.20%">0,542</b></div>
</div>

<h2>O resultado</h2>
<p>O melhor modelo foi o mais simples: a regressão logística com as 5 variáveis agregadas, com ROC AUC de 0,732, F1 de 0,62 e acurácia de 0,67. Ela empata na prática com a versão de 43 variáveis, usando muito menos informação. Random Forest, LightGBM e XGBoost não superaram a regressão logística neste volume de dados. Selecionar as 14 variáveis de maior coeficiente aumentou a precisão para 0,71, ao custo de recall menor: uma troca que faz sentido quando cada contato com o cliente custa caro.</p>

<h2>Como usar no negócio</h2>
<p>A saída é uma lista de clientes ordenada pela probabilidade de recompra, para priorizar e-mails e ofertas. A análise exploratória acrescenta itens para revisar no estoque, produtos para priorizar em cada país e a sazonalidade de dezembro a abril.</p>

<h2>Limitações</h2>
<ul>
<li>O desempenho é moderado e foi medido em uma única divisão de 731 clientes de teste; validação cruzada e ajuste de hiperparâmetros são o próximo passo.</li>
<li>A base cobre um único ano, e a janela de previsão inclui o fim de ano, que pode inflar a recompra.</li>
<li>As variáveis não foram padronizadas na regressão logística, então os coeficientes não são comparáveis entre si.</li>
</ul>
''',
    },
    {
        'slug': 'moedas-brasileiras',
        'titulo': 'Reconhecer moedas do Real por foto, com um dataset próprio',
        'titulo_seo': 'Classificação de moedas brasileiras: estudo de caso',
        'curto': 'Moedas brasileiras por foto',
        'descricao': 'Estudo de caso de visão computacional: dataset próprio de 186 fotos, transfer learning com MobileNetV2 e uma revisão honesta de um vazamento entre treino e validação.',
        'resumo_card': 'Dataset próprio de 186 fotos e MobileNetV2 por transfer learning, com a revisão de um vazamento entre treino e validação.',
        'terminal': '$ visão computacional · dataset próprio',
        'tags': ['TensorFlow', 'MobileNetV2', 'Google Cloud', 'Web scraping'],
        'github': 'ohtopico/moedas-brasileiras',
        'ficha': [
            ('Pergunta', 'Um modelo leve consegue dizer qual moeda do Real aparece numa foto de celular?'),
            ('Dados', '186 fotos tiradas por mim, cerca de 31 por classe, guardadas no Google Cloud Storage. Seis classes: 1, 5, 10, 25 e 50 centavos e 1 real.'),
            ('Método', 'Transfer learning com a MobileNetV2 pré-treinada no ImageNet, congelada, e uma camada final de 6 saídas. Aumento de dados com giros e espelhamento.'),
            ('Resultado', '20 de 38 fotos de validação certas. A moeda de 1 real acertou 5 de 5; as de 1, 5 e 10 centavos se confundiram entre si.'),
        ],
        'numeros': [('186', 'fotos no dataset próprio'), ('6', 'classes de moeda'), ('20 / 38', 'acertos na validação'), ('5 / 5', 'acertos na moeda de 1 real')],
        'corpo': '''
<h2>Por que começar pelo dataset</h2>
<p>Foi o meu primeiro dataset próprio, e a escolha foi de propósito. Com dados prontos, uma parte importante de um projeto de visão computacional fica escondida: fotografar, organizar uma pasta por classe e decidir o que é uma foto boa. As 186 fotos ficaram num bucket do Google Cloud Storage, e o notebook lê direto de lá.</p>

<h2>O modelo</h2>
<p>Com cerca de 31 fotos por classe, treinar uma rede do zero não faria sentido. Usei transfer learning: a MobileNetV2, já treinada no ImageNet, fica congelada e funciona como extratora de características, e só uma camada final com uma saída por moeda é treinada. As fotos foram redimensionadas para 224 × 224, e no treino receberam giros de 90 graus e espelhamento aleatórios, já que uma moeda pode aparecer em qualquer orientação.</p>

<h2>O que a matriz de confusão mostra</h2>
<div class="rolagem">
<table class="matriz">
  <caption>Validação: linhas são a moeda real, colunas a previsão do modelo</caption>
  <thead><tr><th scope="col"></th><th scope="col">1 ¢</th><th scope="col">5 ¢</th><th scope="col">10 ¢</th><th scope="col">25 ¢</th><th scope="col">50 ¢</th><th scope="col">R$ 1</th></tr></thead>
  <tbody>
    <tr><th scope="row">1 ¢</th><td class="ok">1</td><td>1</td><td>2</td><td>0</td><td>0</td><td>1</td></tr>
    <tr><th scope="row">5 ¢</th><td>2</td><td class="ok">7</td><td>2</td><td>0</td><td>0</td><td>1</td></tr>
    <tr><th scope="row">10 ¢</th><td>2</td><td>2</td><td class="ok">3</td><td>0</td><td>0</td><td>2</td></tr>
    <tr><th scope="row">25 ¢</th><td>0</td><td>0</td><td>0</td><td class="ok">1</td><td>0</td><td>0</td></tr>
    <tr><th scope="row">50 ¢</th><td>1</td><td>0</td><td>2</td><td>0</td><td class="ok">3</td><td>0</td></tr>
    <tr><th scope="row">R$ 1</th><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td class="ok">5</td></tr>
  </tbody>
</table>
</div>
<p>A moeda de 1 real, bicolor e maior, acertou todas. As de 1, 5 e 10 centavos, com cor e tamanho parecidos, foram as mais confundidas. O padrão é o que se esperaria de uma pessoa olhando rápido, e mostra onde faltam exemplos.</p>

<h2>Revisitando o próprio trabalho</h2>
<p>Numa revisão posterior do código apareceu um problema: a lista de fotos era embaralhada de novo a cada leitura, e como treino e validação liam a lista separadamente, parte das fotos de validação também entrava no treino. Num teste, de 15 a 18 das 38 fotos estavam nos dois conjuntos. Por isso a acurácia de validação (cerca de 53%) tende a ser otimista, e o README do projeto diz isso com todas as letras, junto com a correção: embaralhar uma única vez, com semente fixa, antes de separar. As fotos originais não estão mais disponíveis, então o número fica registrado com esse aviso em vez de ser refeito.</p>

<h2>Fase 2: o estado de conservação</h2>
<p>A continuação ataca um problema mais difícil: classificar o grau de conservação de uma moeda (FC, SOB, MBC, BC), que é o que define o valor para colecionadores. Escrevi um coletor que monta um dataset a partir das buscas públicas de leilões numismáticos, cujos títulos trazem o grau dado pelo leiloeiro, e um notebook que treina uma MobileNetV3 Large. Os rótulos vêm de vendedores, então têm ruído, e as fotos não são redistribuídas: o repositório guarda só o código.</p>
''',
    },
    {
        'slug': 'censo-vale-do-rio-pardo',
        'titulo': 'Censos do IBGE e do INEP para 21 municípios gaúchos',
        'titulo_seo': 'Censo IBGE e Censo Escolar no Vale do Rio Pardo',
        'curto': 'Censos no Vale do Rio Pardo',
        'descricao': 'Estudo de caso de engenharia de dados públicos: API do SIDRA e microdados do INEP para 21 municípios do Vale do Rio Pardo, de 2010 a 2025, em notebooks reprodutíveis.',
        'resumo_card': 'API do SIDRA e microdados do INEP em notebooks reprodutíveis, de 2010 a 2025. Virou painel, infográficos e matéria de jornal.',
        'terminal': '$ engenharia de dados · dados públicos',
        'tags': ['pandas', 'API SIDRA', 'INEP', 'Colab', 'Dados abertos'],
        'github': 'ohtopico/dados-censo',
        'ficha': [
            ('Pergunta', 'O que mudou entre 2010 e 2022 na vida e nas escolas de três recortes de municípios do Vale do Rio Pardo (RS)?'),
            ('Dados', 'Censos Demográficos 2010 e 2022, PIB dos Municípios e censos agropecuários (API do SIDRA, IBGE) e microdados do Censo Escolar do INEP de 2010, 2022 e 2025.'),
            ('Método', 'Notebooks no Colab que baixam tudo das fontes, harmonizam os códigos de município, corrigem valores pelo IPCA e geram planilhas, gráficos e infográficos.'),
            ('Entrega', 'Planilhas com aba Leia-me, CSV escola a escola, infográficos em PDF, uma matéria de jornal e o painel interativo de juliaroberta.com.'),
        ],
        'numeros': [('21', 'municípios em 3 recortes'), ('20+', 'tabelas do SIDRA consultadas'), ('431 → 343', 'escolas em atividade, 2010 a 2025'), ('+75%', 'matrículas de creche, 2010 a 2022')],
        'corpo': '''
<h2>Perguntas concretas</h2>
<p>O projeto parte de perguntas concretas sobre a região: Candelária encolheu? As escolas rurais estão fechando? A alfabetização melhorou? Para responder, montei três recortes: Candelária e os 8 municípios vizinhos, Novo Cabrais e os 4 vizinhos, e os 16 municípios da microrregião de Santa Cruz do Sul do IBGE. Juntos são 21 municípios, com o Rio Grande do Sul e o Brasil como referência.</p>

<h2>Um pipeline reprodutível</h2>
<p>Cada recorte tem um notebook que roda no Google Colab do começo ao fim. Ele consulta a API do SIDRA (mais de 20 tabelas, de população e cor ou raça a renda, saneamento e agropecuária) ou baixa os microdados do Censo Escolar do INEP, um arquivo por ano, filtra as escolas em atividade dos 21 municípios e gera a planilha, os gráficos e um arquivo compactado com tudo. A escolha de baixar das fontes, em vez de guardar planilhas editadas à mão, permite que qualquer pessoa refaça os números e que eu atualize tudo quando sai um ano novo.</p>

<h2>Comparar só o que é comparável</h2>
<p>A maior parte do trabalho não está no código, está nas notas. Alguns exemplos que ficaram documentados na aba Leia-me de cada planilha:</p>
<ul>
<li>Valores em reais de 2010 foram corrigidos pelo IPCA para julho de 2022 antes de comparar renda e PIB.</li>
<li>As perguntas sobre água e esgoto mudaram em 2022, então a comparação com 2010 é aproximada.</li>
<li>"Pessoas ocupadas" não é comparável: 2010 conta todos os ocupados, 2022 só os com rendimento.</li>
<li>Em 2025 o INEP tirou matrículas, turmas e professores da tabela de escolas, então esses indicadores param em 2022.</li>
<li>Professores são somados por escola: quem dá aula em duas escolas conta duas vezes.</li>
</ul>
<p>Um erro da primeira versão também ficou registrado: a planilha de alfabetização tinha o grupo de 65 anos ou mais zerado em 2010, o que deixava a taxa daquele ano alta demais.</p>

<h2>O que os dados mostram</h2>
<figure class="figura">
  <img src="escolas-rurais.png" alt="Gráfico de halteres com as escolas rurais de cada município em 2010 e 2025. Quase todos os municípios perderam escolas rurais; Venâncio Aires foi de 49 para 21." width="1610" height="1510" loading="lazy">
  <figcaption>Escolas rurais em atividade por município, 2010 e 2025. Gráfico gerado pelo notebook do Censo Escolar.</figcaption>
</figure>
<p>Na microrregião de Santa Cruz do Sul, as matrículas da educação básica caíram 10% de 2010 a 2022, mas as de creche subiram 75%. As escolas em atividade foram de 431 para 343 até 2025, e as rurais, de 242 para 108. Na alfabetização, todos os 16 municípios melhoraram, e a taxa da região subiu de 94,6% para 96,3%.</p>

<h2>Do notebook para as pessoas</h2>
<p>Os mesmos dados viraram entregas para públicos diferentes: infográficos em PDF para cada recorte, uma matéria de jornal sobre Candelária, o <a href="/infograficos/dados-da-regiao/">painel interativo de dados da educação na região</a> e a página <a href="/infograficos/dados-da-regiao/novo-cabrais/">Novo Cabrais em 12 anos</a>. Os bastidores do painel estão no <a href="/blog/bastidores-painel-educacao-vale-do-rio-pardo/">blog</a>.</p>
''',
    },
]


def cabeca(titulo, descricao, url, imagem, ld):
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
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Júlia Quoos">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(titulo)}">
<meta property="og:description" content="{esc(descricao)}">
<meta property="og:image" content="{SITE}{imagem}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/assets/fontes/fontes.css">
<link rel="stylesheet" href="/assets/md.css">
<link rel="stylesheet" href="/infograficos/assets/infograficos.css?v=202611022300">
<link rel="stylesheet" href="/projetos/projetos.css?v=202611061">
<script>
  try {{ const t = JSON.parse(localStorage.getItem('iapraprof:theme')); if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t; }} catch (e) {{}}
</script>
<script type="application/ld+json">
{json.dumps(ld, ensure_ascii=False)}
</script>
{GTAG}
</head>
<body>
<header class="topbar">
  <a class="brand" href="/">Júlia Quoos</a>
  <a class="brand-sub" href="/projetos/">/ projetos</a>
  <span class="spacer"></span>
  <nav class="topnav" aria-label="Seções">
    <a href="/projetos/">Projetos</a>
    <a href="/infograficos/">Infográficos</a>
    <a href="/blog/">Blog</a>
    <a href="/curriculo/">Currículo</a>
    <a href="https://ohtopico.com.br/">Formação de professores</a>
  </nav>
  <button class="icon-btn" id="theme-btn" type="button" aria-label="Alternar tema claro/escuro">Tema</button>
</header>
'''


RODAPE = '''<footer class="footer"><div class="wrap">
  <p>Estudos de caso de <a href="/curriculo/">Júlia Roberta Quoos Alves</a>, engenheira de dados e de machine learning. Veja também os <a href="/infograficos/">infográficos interativos</a> e o <a href="/blog/">blog de dados</a>.</p>
  <p>Júlia Roberta Quoos Alves · <a href="https://juliaroberta.com/">juliaroberta.com</a> · Formação de professores em <a href="https://ohtopico.com.br/">ohtopico.com.br</a></p>
</div></footer>
<script>
  document.getElementById('theme-btn').addEventListener('click', () => {
    const root = document.documentElement;
    const escuro = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = escuro ? 'light' : 'dark';
    try { localStorage.setItem('iapraprof:theme', JSON.stringify(root.dataset.theme)); } catch (e) {}
  });
</script>
</body>
</html>
'''

PESSOA = {'@type': 'Person', 'name': AUTORA, 'url': SITE + '/curriculo/'}


def pagina(p, i):
    url = f'{SITE}/projetos/{p["slug"]}/'
    ld = {'@context': 'https://schema.org', '@type': 'CreativeWork', 'name': p['titulo'], 'headline': p['titulo'],
          'description': p['descricao'], 'url': url, 'inLanguage': 'pt-BR', 'author': PESSOA,
          'image': f'{SITE}/projetos/{p["slug"]}/og.jpg', 'keywords': p['tags'],
          'isBasedOn': f'https://github.com/{p["github"]}'}
    ficha = ''.join(f'<div><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>' for k, v in p['ficha'])
    nums = ''.join(f'<div><b>{esc(n)}</b><span>{esc(t)}</span></div>' for n, t in p['numeros'])
    tags = ''.join(f'<li>{esc(t)}</li>' for t in p['tags'])
    outros = [q for q in PROJETOS if q is not p]
    vizinhos = ''.join(f'<li><a href="/projetos/{q["slug"]}/">{esc(q["curto"])}</a></li>' for q in outros)
    titulo = p['titulo_seo'] if len(p['titulo_seo']) > 46 else p['titulo_seo'] + ' | Júlia Quoos'
    return cabeca(titulo, p['descricao'], url, f'/projetos/{p["slug"]}/og.jpg', ld) + f'''
<main>
  <section class="hero">
    <div class="wrap"><div class="hero-inner">
      <nav class="trilha" aria-label="Você está em"><a href="/projetos/">Projetos</a> / estudo de caso {i + 1} de {len(PROJETOS)}</nav>
      <span class="terminal">{esc(p["terminal"])}</span>
      <h1>{esc(p["titulo"])}</h1>
      <p class="lead">{esc(p["descricao"])}</p>
      <ul class="pilulas">{tags}</ul>
      <div class="btn-row acoes">
        <a class="btn" href="https://github.com/{p["github"]}" rel="noopener">Código no GitHub</a>
        <a class="btn ghost" href="/curriculo/">Currículo</a>
      </div>
    </div></div>
  </section>

  <section class="block">
    <div class="wrap caso">
      <dl class="ficha">{ficha}</dl>
      <div class="resumo-num">{nums}</div>
      <article class="texto">
{p["corpo"].strip()}
      </article>
      <aside class="outros">
        <h2>Outros estudos de caso</h2>
        <ul>{vizinhos}</ul>
      </aside>
    </div>
  </section>
</main>

''' + RODAPE


def indice():
    url = f'{SITE}/projetos/'
    ld = {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'Projetos de dados e IA',
          'description': 'Estudos de caso de engenharia de dados, machine learning e visão computacional.', 'url': url,
          'inLanguage': 'pt-BR', 'creator': PESSOA,
          'hasPart': [{'@type': 'CreativeWork', 'name': p['titulo'], 'url': f'{url}{p["slug"]}/'} for p in PROJETOS]}
    cards = ''.join(f'''
        <a class="info" href="{p["slug"]}/">
          <div class="janela">
            <div class="janela-barra"><i></i><i></i><i></i><span>{esc(p["curto"])}</span></div>
            <img class="capa" src="{p["slug"]}/og.jpg" alt="" loading="lazy" width="1200" height="630">
            <div class="janela-corpo"><h3>{esc(p["titulo"])}</h3><p>{esc(p["resumo_card"])}</p><div class="tags">{''.join(f'<span class="tag">{esc(t)}</span>' for t in p["tags"][:4])}</div></div>
          </div>
        </a>''' for p in PROJETOS)
    return cabeca('Projetos de dados e IA: estudos de caso | Júlia Quoos',
                  'Estudos de caso de Júlia Quoos em engenharia de dados, machine learning e visão computacional: pergunta, dados, método, resultado e limitações de cada projeto.',
                  url, '/projetos/og.jpg', ld) + f'''
<main>
  <section class="hero">
    <div class="wrap"><div class="hero-inner">
      <span class="terminal">$ estudos de caso</span>
      <h1>Projetos de <mark>dados e IA</mark></h1>
      <p class="lead">Quatro projetos contados do começo ao fim: a pergunta, os dados, o método, o resultado e o que ainda não funciona. O código de cada um está aberto no GitHub.</p>
    </div></div>
  </section>

  <section class="block">
    <div class="wrap">
      <div class="lista-info lista-projetos">{cards}
      </div>
      <p class="muted mais">Outros repositórios, como a análise da pesquisa State of Data Brazil e o sumarizador de textos em português, estão no <a href="https://github.com/ohtopico">GitHub</a>. Os painéis com dados abertos ficam em <a href="/infograficos/">Infográficos</a>.</p>
    </div>
  </section>
</main>

''' + RODAPE


def sitemap():
    caminho = os.path.join(RAIZ, 'sitemap.xml')
    s = open(caminho, encoding='utf-8').read()
    s = re.sub(r'\s*<!-- projetos -->.*?<!-- /projetos -->', '', s, flags=re.S)
    urls = [f'{SITE}/projetos/'] + [f'{SITE}/projetos/{p["slug"]}/' for p in PROJETOS]
    bloco = '\n  <!-- projetos -->\n' + ''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls) + '  <!-- /projetos -->'
    s = s.replace('\n</urlset>', bloco + '\n</urlset>')
    open(caminho, 'w', encoding='utf-8').write(s)


if __name__ == '__main__':
    base = os.path.join(RAIZ, 'projetos')
    open(os.path.join(base, 'index.html'), 'w', encoding='utf-8').write(indice())
    for i, p in enumerate(PROJETOS):
        d = os.path.join(base, p['slug'])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(pagina(p, i))
    sitemap()
    og = [{'arquivo': f'projetos/{p["slug"]}/og.jpg', 'terminal': p['terminal'], 'titulo': p['titulo'], 'tags': p['tags'][:4],
           'numero': p['numeros'][0]} for p in PROJETOS]
    og.append({'arquivo': 'projetos/og.jpg', 'terminal': '$ estudos de caso', 'titulo': 'Projetos de dados e IA',
               'tags': ['Machine learning', 'Visão computacional', 'Dados públicos'], 'numero': [str(len(PROJETOS)), 'estudos de caso']})
    json.dump(og, open(os.path.join(AQUI, 'og', 'capas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(PROJETOS), 'estudos de caso gerados')
