"""Gera os notebooks de aula com dados da Wikipédia em notebooks/wikipedia/*.ipynb.

Cada notebook abre no Google Colab pelo link
https://colab.research.google.com/github/ohtopico/site-dados/blob/main/notebooks/wikipedia/<arquivo>.ipynb
O texto e o código ficam aqui; não editar os .ipynb à mão.

Uso: python3 _fonte/notebooks/gerar.py
"""
import html, os, re, textwrap
import nbformat as nbf

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, '..', '..', 'notebooks', 'wikipedia')
PAGINA = os.path.join(AQUI, '..', '..', 'infograficos', 'interesse-por-ia', 'notebooks', 'index.html')
REPO = 'https://github.com/ohtopico/site-dados/blob/main/notebooks/wikipedia/'
COLAB = 'https://colab.research.google.com/github/ohtopico/site-dados/blob/main/notebooks/wikipedia/'

NOTEBOOKS = []


def nb(arquivo, titulo, resumo, celulas):
    publico, tempo, habs = re.search(r'\*\*Público:\*\* (.*?) · \*\*Tempo:\*\* (.*?) · \*\*BNCC:\*\* (.*)', celulas[0][1]).groups()
    NOTEBOOKS.append(dict(arquivo=arquivo, titulo=titulo, resumo=resumo, celulas=celulas, publico=publico, tempo=tempo, habs=habs))


md = lambda s: ('md', textwrap.dedent(s).strip())
py = lambda s: ('py', textwrap.dedent(s).strip())


def cabecalho(titulo, resumo, publico, habs, tempo):
    return md(f"""
    # {titulo}

    {resumo}

    **Público:** {publico} · **Tempo:** {tempo} · **BNCC:** {habs}

    Notebook de [Júlia Roberta Quoos Alves](https://juliaroberta.com/curriculo/) · [juliaroberta.com](https://juliaroberta.com/infograficos/interesse-por-ia/notebooks/) · Licença CC BY-NC-SA 4.0

    **Como usar:** clique em cada célula de código e aperte o botão de play (ou Shift + Enter), de cima para baixo. Os campos ao lado das células (listas e caixas de texto) podem ser trocados à vontade: depois de mudar, rode a célula de novo.
    """)


# Célula de configuração comum a todos os notebooks
CONFIG = py('''
# @title Configuração (rode primeiro) { display-mode: "form" }
# Funções para baixar os dados públicos da Wikimedia. Não precisa mudar nada aqui.
import json, re, time, urllib.parse
import requests
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from ipywidgets import interact, widgets

CORES = ['#157f3b', '#b3123a', '#c99a00', '#111111', '#5fb27c', '#7a1f33']
plt.rcParams.update({'figure.figsize': (11, 4.5), 'axes.prop_cycle': plt.cycler(color=CORES), 'axes.spines.top': False,
                     'axes.spines.right': False, 'axes.grid': True, 'grid.alpha': .3, 'font.size': 11})
pd.options.display.float_format = '{:,.0f}'.format
UA = {'User-Agent': 'notebooks-ohtopico/1.0 (https://ohtopico.com.br; contato@ohtopico.com.br)'}
FONTE = 'Fonte: Wikimedia, visitas de pessoas à Wikipédia em português'


def _get(url, params=None):
    r = requests.get(url, params=params, headers=UA, timeout=60)
    if r.status_code == 404:
        return None
    r.raise_for_status()
    return r.json()


def titulo_oficial(titulo):
    """Corrige maiúsculas e segue redirecionamentos: 'ia' vira 'Inteligência artificial'."""
    j = _get('https://pt.wikipedia.org/w/api.php', dict(action='query', titles=titulo, redirects=1, format='json', formatversion=2))
    pagina = j['query']['pages'][0]
    if pagina.get('missing'):
        raise ValueError(f'Não achei o verbete "{titulo}" na Wikipédia em português. Confira a grafia.')
    return pagina['title']


def visitas(titulos, inicio='2016-01-01', fim=None, por='mes'):
    """Tabela com as visitas de cada verbete. por='mes' ou por='dia'."""
    if isinstance(titulos, str):
        titulos = [titulos]
    fim = pd.Timestamp(fim) if fim else pd.Timestamp.today().normalize() - pd.Timedelta(days=1)
    if por == 'mes':
        fim = fim.replace(day=1) - pd.Timedelta(days=1)  # só meses completos
    colunas = {}
    for t in titulos:
        t = titulo_oficial(t)
        art = urllib.parse.quote(t.replace(' ', '_'), safe='')
        g = 'monthly' if por == 'mes' else 'daily'
        url = (f'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/pt.wikipedia/all-access/user/{art}/{g}/'
               f'{pd.Timestamp(inicio):%Y%m%d}00/{fim:%Y%m%d}00')
        j = _get(url) or {'items': []}
        colunas[t] = pd.Series({pd.Timestamp(i['timestamp'][:8]): i['views'] for i in j['items']}, dtype='float64')
        time.sleep(.1)
    df = pd.DataFrame(colunas).sort_index()
    idx = pd.date_range(pd.Timestamp(inicio), fim, freq='MS' if por == 'mes' else 'D')
    df = df.reindex(idx).fillna(0).astype(int)
    df.index.name = 'mês' if por == 'mes' else 'dia'
    return df


def texto(titulo):
    """Texto puro de um verbete (sem tabelas nem imagens)."""
    t = titulo_oficial(titulo)
    j = _get('https://pt.wikipedia.org/w/api.php', dict(action='query', prop='extracts', explaintext=1, titles=t,
                                                         format='json', formatversion=2))
    return j['query']['pages'][0].get('extract', '')


def fmt(v, casas=0):
    """Número no formato brasileiro: 1.234,5"""
    return f'{v:,.{casas}f}'.replace(',', '_').replace('.', ',').replace('_', '.')


def baixar_csv(df, nome):
    df.to_csv(nome)
    try:
        from google.colab import files
        files.download(nome)
    except ImportError:
        print('Arquivo salvo:', nome)


print('Pronto. Funções disponíveis: visitas(), texto(), titulo_oficial(), fmt(), baixar_csv().')
''')

SOLUCAO = lambda s: md(f"""
<details><summary><b>Ver uma solução</b></summary>

```python
{textwrap.dedent(s).strip()}
```
</details>
""")

# ---------------------------------------------------------------------------------------------
nb('01-do-zero-ao-grafico.ipynb', 'Do zero ao gráfico: visitas da Wikipédia com Python',
   'Escolha verbetes, baixe as visitas mês a mês e monte gráficos de linhas e de colunas com título, eixos e fonte.', [
    cabecalho('Do zero ao gráfico: visitas da Wikipédia com Python',
              'Toda visita a um verbete da Wikipédia é contada, e a Wikimedia publica esses números como dados abertos. '
              'Neste notebook você escolhe verbetes, baixa as visitas mês a mês e monta gráficos com título, eixos e fonte, '
              'como em um relatório de pesquisa.',
              'professores, 9º ano, ensino médio e cursos técnicos', 'EF07MA36, EF09MA22, EF08CO11', '1 aula de 50 min'),
    md('''
    ## Objetivos
    - Coletar dados abertos por meio de uma API.
    - Organizar uma série temporal em tabela (um mês por linha, um verbete por coluna).
    - Escolher e construir o gráfico adequado: linhas para dados no tempo, colunas para comparar totais.

    ## Passo 0. Configuração
    Rode a célula abaixo uma vez. Ela carrega as ferramentas e cria a função `visitas()`, que busca os números na Wikimedia.
    '''),
    CONFIG,
    md('''
    ## Passo 1. Escolha os verbetes
    Escreva o nome de até três verbetes da Wikipédia em português, do jeito que aparecem no título da página. Pode trocar por qualquer tema da turma: um time, um planeta, um jogo, uma festa.
    '''),
    py('''
    verbete_1 = 'Inteligência artificial'  # @param {type:"string"}
    verbete_2 = 'ChatGPT'  # @param {type:"string"}
    verbete_3 = 'Robótica'  # @param {type:"string"}
    desde = '2018-01-01'  # @param {type:"date"}

    escolhidos = [v for v in (verbete_1, verbete_2, verbete_3) if v.strip()]
    df = visitas(escolhidos, inicio=desde)
    print(f'{len(df)} meses, de {df.index[0]:%m/%Y} a {df.index[-1]:%m/%Y}')
    df.tail()
    '''),
    md('''
    ## Passo 2. Conheça a tabela
    Cada linha é um mês e cada coluna é um verbete. O resumo abaixo mostra a média, o menor e o maior valor de cada coluna.

    **Para discutir:** a média é um bom resumo para esses dados? O que acontece com a média quando há um mês com um pico enorme?
    '''),
    py('''
    df.describe().loc[['mean', 'min', '50%', 'max']].rename(index={'mean': 'média', 'min': 'mínimo', '50%': 'mediana', 'max': 'máximo'})
    '''),
    md('''
    ## Passo 3. Gráfico de linhas
    Dados ao longo do tempo pedem gráfico de linhas. Repare nos elementos que todo gráfico precisa ter: título, nome dos eixos, legenda e fonte.
    '''),
    py('''
    ax = df.plot(linewidth=2.2)
    ax.set_title('Visitas por mês na Wikipédia em português')
    ax.set_xlabel('Mês')
    ax.set_ylabel('Visitas')
    ax.yaxis.set_major_formatter(lambda v, p: f'{v:,.0f}'.replace(',', '.'))
    ax.legend(title='Verbete')
    plt.figtext(0.01, -0.02, FONTE, fontsize=9, color='#4a4a4a')
    plt.show()
    '''),
    md('''
    ## Passo 4. Totais por ano
    Para comparar anos inteiros, somamos os meses de cada ano e usamos colunas. O ano atual aparece incompleto: lembre disso ao comparar.
    '''),
    py('''
    por_ano = df.groupby(df.index.year).sum()
    ax = por_ano.plot(kind='bar', width=.8, edgecolor='#111')
    ax.set_title('Visitas por ano')
    ax.set_xlabel('Ano')
    ax.set_ylabel('Visitas')
    ax.yaxis.set_major_formatter(lambda v, p: f'{v:,.0f}'.replace(',', '.'))
    plt.xticks(rotation=0)
    plt.figtext(0.01, -0.02, FONTE + '. O último ano está incompleto.', fontsize=9, color='#4a4a4a')
    plt.show()
    por_ano
    '''),
    md('''
    ## Passo 5. Explore
    Escolha um verbete e o tipo de escala. A escala logarítmica ajuda quando um verbete tem números muito maiores que os outros: cada linha da grade vale dez vezes a anterior.
    '''),
    py('''
    @interact(verbete=list(df.columns), escala=['comum', 'logarítmica'], media_movel=widgets.IntSlider(value=1, min=1, max=12, description='média móvel'))
    def explorar(verbete, escala, media_movel):
        s = df[verbete]
        ax = s.plot(alpha=.35 if media_movel > 1 else 1, label='visitas')
        if media_movel > 1:
            s.rolling(media_movel).mean().plot(ax=ax, linewidth=2.5, label=f'média dos últimos {media_movel} meses')
        if escala == 'logarítmica':
            ax.set_yscale('log')
        ax.set_title(f'{verbete}: visitas por mês')
        ax.legend()
        plt.show()
    '''),
    md('''
    ## Sua vez
    Em que mês cada verbete teve mais visitas, e quantas foram? Escreva o código na célula abaixo. Dica: `df.idxmax()` e `df.max()`.
    '''),
    py('''
    # escreva aqui
    '''),
    SOLUCAO('''
    recorde = pd.DataFrame({'mês do recorde': df.idxmax().dt.strftime('%m/%Y'), 'visitas': df.max()})
    recorde
    '''),
    md('''
    ## Guardar os dados
    A célula abaixo salva a tabela em CSV, que abre em qualquer planilha.
    '''),
    py('''
    baixar_csv(df, 'visitas-wikipedia.csv')
    '''),
    md('''
    ## Para fechar
    - O que os gráficos mostram e o que eles **não** mostram? (Visitas medem curiosidade, não uso nem opinião.)
    - A Wikipédia em português é lida no Brasil, em Portugal e em outros países. Isso muda as conclusões?
    - Escolha o maior pico e procure em duas fontes confiáveis o que aconteceu naquele mês.

    Continue com o notebook [Detecção de picos](https://colab.research.google.com/github/ohtopico/site-dados/blob/main/notebooks/wikipedia/03-deteccao-de-picos.ipynb) ou veja o [painel de interesse por IA](https://juliaroberta.com/infograficos/interesse-por-ia/).
    '''),
])

# ---------------------------------------------------------------------------------------------
nb('02-previsao-de-series.ipynb', 'Previsão de séries temporais: treino, teste e explicabilidade',
   'Separe treino e teste, compare três modelos de previsão, veja o que cada parâmetro significa e teste se a diferença entre eles é significativa.', [
    cabecalho('Previsão de séries temporais: treino, teste e explicabilidade',
              'Dá para prever quantas pessoas vão ler um verbete no mês que vem? Neste notebook você separa os dados em treino e teste, '
              'compara três modelos, olha para dentro do modelo para entender cada parâmetro e testa se a diferença de erro entre dois '
              'modelos é real ou fruto do acaso.',
              'professores, ensino médio, cursos técnicos e graduação', 'EF09MA22, EF09CO10 (ensino médio: EM13MAT406)', '2 aulas de 50 min'),
    md('''
    ## Objetivos
    - Entender por que um modelo é avaliado em dados que ele não viu (treino e teste).
    - Comparar modelos com uma medida de erro.
    - Ler os parâmetros de um modelo simples e explicar o que cada um faz.
    - Usar uma semente (seed) para tornar um resultado aleatório reproduzível.
    - Testar se uma diferença de desempenho é estatisticamente significativa.
    '''),
    CONFIG,
    md('## Passo 1. Os dados'),
    py('''
    verbete = 'Fração'  # @param {type:"string"}
    df = visitas(verbete, inicio='2016-01-01')
    serie = df.iloc[:, 0]
    serie = serie[serie.gt(0).idxmax():]  # começa no primeiro mês com visitas
    ax = serie.plot(linewidth=2)
    ax.set_title(f'{serie.name}: visitas por mês'); ax.set_ylabel('Visitas')
    plt.show()
    '''),
    md('''
    ## Passo 2. Treino e teste
    Guardamos os últimos meses como **teste**: o modelo não pode olhar para eles enquanto aprende. É como uma prova com questões que o aluno não viu antes. Se testássemos nos mesmos dados do treino, o modelo poderia apenas decorar.
    '''),
    py('''
    meses_de_teste = 12  # @param {type:"slider", min:6, max:24, step:1}
    treino, teste = serie[:-meses_de_teste], serie[-meses_de_teste:]
    ax = treino.plot(label='treino', linewidth=2)
    teste.plot(ax=ax, label='teste', linewidth=2)
    ax.axvline(teste.index[0], color='#111', linestyle='--', linewidth=1)
    ax.legend(); ax.set_title('Separação entre treino e teste'); plt.show()
    print(f'Treino: {len(treino)} meses. Teste: {len(teste)} meses.')
    '''),
    md('''
    ## Passo 3. Três modelos
    1. **Ingênuo:** o próximo mês será igual ao último mês conhecido.
    2. **Sazonal:** cada mês será igual ao mesmo mês do ano anterior.
    3. **Regressão:** uma reta de tendência mais um ajuste para cada mês do ano, aprendidos com o treino.

    A medida de erro é o **erro absoluto médio** (EAM): em média, quantas visitas a previsão errou por mês.
    '''),
    py('''
    MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

    def matriz(indice, t0):
        """Colunas: intercepto, tendência (meses desde o início) e um ajuste para cada mês de fev a dez."""
        t = np.array([(d.year - t0.year) * 12 + d.month - t0.month for d in indice])
        mes = np.array([d.month for d in indice])
        return np.column_stack([np.ones(len(t)), t] + [(mes == m).astype(float) for m in range(2, 13)])

    def prever(modelo, treino, indice_teste):
        if modelo == 'ingênuo':
            return pd.Series(treino.iloc[-1], index=indice_teste)
        if modelo == 'sazonal':
            return pd.Series([treino.get(d - pd.DateOffset(years=1), treino.iloc[-1]) for d in indice_teste], index=indice_teste)
        X = matriz(treino.index, treino.index[0])
        coef, *_ = np.linalg.lstsq(X, treino.values, rcond=None)
        return pd.Series(matriz(indice_teste, treino.index[0]) @ coef, index=indice_teste).clip(lower=0)

    previsoes = {m: prever(m, treino, teste.index) for m in ['ingênuo', 'sazonal', 'regressão']}
    erros = pd.Series({m: (p - teste).abs().mean() for m, p in previsoes.items()}, name='erro absoluto médio')
    ax = teste.plot(color='#111', linewidth=3, label='o que aconteceu')
    for m, p in previsoes.items():
        p.plot(ax=ax, linewidth=2, linestyle='--', label=f'{m} (erro médio {fmt(erros[m])})')
    ax.legend(); ax.set_title('Previsões contra o que aconteceu no período de teste'); plt.show()
    erros.sort_values().to_frame()
    '''),
    md('''
    ## Passo 4. Explicabilidade: o que o modelo aprendeu?
    A regressão tem 13 parâmetros, e cada um tem um significado:
    - **intercepto:** o ponto de partida da reta;
    - **tendência:** quantas visitas a mais (ou a menos) por mês, em média, ao longo dos anos;
    - **ajuste de cada mês:** quanto aquele mês fica acima ou abaixo de janeiro, descontada a tendência.

    Um modelo com poucos parâmetros que dá para explicar um a um é chamado de **interpretável**. Modelos grandes, como as redes neurais, têm milhões de parâmetros e precisam de outras técnicas para serem explicados.
    '''),
    py('''
    X = matriz(treino.index, treino.index[0])
    coef, *_ = np.linalg.lstsq(X, treino.values, rcond=None)
    ajustes = pd.Series([0] + list(coef[2:]), index=MESES)
    print(f'Intercepto: {fmt(coef[0])} visitas')
    print(f'Tendência: {"+" if coef[1] >= 0 else ""}{fmt(coef[1], 1)} visitas por mês')
    ax = ajustes.plot(kind='bar', color=[CORES[0] if v >= 0 else CORES[1] for v in ajustes], edgecolor='#111')
    ax.set_title('Ajuste de cada mês em relação a janeiro'); ax.set_ylabel('Visitas'); plt.xticks(rotation=0); plt.show()
    '''),
    md('''
    **Para discutir:** os meses com ajuste positivo coincidem com o ano letivo? Para um verbete de lazer, o padrão seria o mesmo?

    ## Passo 5. Sementes (seed) e reprodutibilidade
    Para saber o quanto confiar na previsão, sorteamos erros do passado e somamos à previsão muitas vezes (isso se chama *bootstrap*). Como há sorteio, o resultado muda a cada execução, a não ser que fixemos a **semente** do gerador de números aleatórios. Mude a semente e o número de sorteios e veja o que acontece com o intervalo.
    '''),
    py('''
    residuos = (treino - pd.Series(X @ coef, index=treino.index)).values

    @interact(semente=widgets.IntSlider(value=42, min=0, max=100), sorteios=widgets.IntSlider(value=200, min=20, max=2000, step=20))
    def intervalo(semente, sorteios):
        rng = np.random.default_rng(semente)
        base = previsoes['regressão'].values
        sims = base + rng.choice(residuos, size=(sorteios, len(base)))
        baixo, alto = np.percentile(sims, [5, 95], axis=0)
        fig, ax = plt.subplots()
        ax.plot(teste.index, teste.values, color='#111', linewidth=3, label='o que aconteceu')
        ax.plot(teste.index, base, color=CORES[0], linewidth=2, linestyle='--', label='regressão')
        ax.fill_between(teste.index, baixo.clip(0), alto, color=CORES[4], alpha=.3, label='90% dos sorteios')
        dentro = ((teste.values >= baixo) & (teste.values <= alto)).mean()
        ax.set_title(f'Semente {semente}, {sorteios} sorteios: {dentro:.0%} dos meses dentro do intervalo')
        ax.legend(); plt.show()
    '''),
    md('''
    Com a mesma semente, o resultado se repete exatamente: é isso que permite que outra pessoa confira um experimento. Com mais sorteios, o intervalo muda menos de uma semente para outra.

    ## Passo 6. A diferença entre dois modelos é significativa?
    Um modelo errou menos que o outro no teste. Mas com só 12 meses, a vantagem pode ser sorte. O **teste de permutação** responde: se os dois modelos fossem igualmente bons, com que frequência veríamos uma diferença tão grande só por acaso? Essa frequência é o **valor-p**. Um valor-p pequeno (por exemplo, menor que 0,05) indica que a diferença provavelmente não é acaso.
    '''),
    py('''
    modelo_a = 'regressão'  # @param ["ingênuo", "sazonal", "regressão"]
    modelo_b = 'ingênuo'  # @param ["ingênuo", "sazonal", "regressão"]
    semente = 7  # @param {type:"integer"}

    ea = (previsoes[modelo_a] - teste).abs().values
    eb = (previsoes[modelo_b] - teste).abs().values
    diff = eb - ea
    observada = diff.mean()
    rng = np.random.default_rng(semente)
    sinais = rng.choice([-1, 1], size=(10000, len(diff)))
    simuladas = (sinais * diff).mean(axis=1)
    valor_p = (np.abs(simuladas) >= abs(observada)).mean()

    plt.hist(simuladas, bins=50, color=CORES[4], edgecolor='#111')
    plt.axvline(observada, color=CORES[1], linewidth=2.5, label='diferença observada')
    plt.axvline(-observada, color=CORES[1], linewidth=1, linestyle='--')
    plt.title(f'{modelo_a} contra {modelo_b}: valor-p = {fmt(valor_p, 3)}'); plt.legend(); plt.show()
    print(f'Em média, {modelo_a} errou {fmt(observada)} visitas a menos por mês que {modelo_b}.')
    print('Diferença significativa (valor-p < 0,05).' if valor_p < .05 else 'Não dá para afirmar que a diferença não é acaso (valor-p >= 0,05).')
    '''),
    md('''
    ## Sua vez
    1. Troque o verbete por um de lazer (por exemplo, *Minecraft*) e compare os ajustes por mês com os de *Fração*.
    2. Qual modelo ganha com 6 meses de teste? E com 24?
    3. Rode o teste de permutação com outras sementes. O valor-p muda muito? Por quê?
    '''),
    py('''
    # escreva aqui
    '''),
    md('''
    ## Para fechar
    - Um modelo que acerta o passado não garante acertar o futuro: por isso existe o teste.
    - Explicar um modelo é dizer o que cada parâmetro faz. Quanto mais parâmetros, mais difícil.
    - Resultados com sorteio só são confiáveis se forem reproduzíveis (semente fixa) e se a diferença passar por um teste de significância.
    '''),
])

# ---------------------------------------------------------------------------------------------
nb('03-deteccao-de-picos.ipynb', 'Detecção de picos: quando o interesse dispara',
   'Encontre automaticamente os dias fora do padrão com média móvel e desvio robusto, e investigue o que aconteceu em cada um.', [
    cabecalho('Detecção de picos: quando o interesse dispara',
              'Notícias, lançamentos e datas comemorativas fazem as visitas de um verbete dispararem. Neste notebook você cria um detector '
              'de picos com estatística simples (mediana e desvio robusto), ajusta a sensibilidade e investiga o que aconteceu em cada data.',
              'professores, 9º ano, ensino médio e cursos técnicos', 'EF09MA21, EF08CO11, EF09CO10', '1 a 2 aulas de 50 min'),
    md('''
    ## Objetivos
    - Usar a mediana de uma janela móvel como referência do que é "normal".
    - Medir o quanto um valor se afasta do normal e definir um limite para chamar de pico.
    - Checar as explicações dos picos em fontes confiáveis.
    '''),
    CONFIG,
    md('## Passo 1. Visitas por dia'),
    py('''
    verbete = 'Copa do Mundo FIFA'  # @param {type:"string"}
    dias = 730  # @param {type:"slider", min:90, max:1500, step:30}
    inicio = pd.Timestamp.today().normalize() - pd.Timedelta(days=dias)
    d = visitas(verbete, inicio=inicio, por='dia').iloc[:, 0]
    ax = d.plot(linewidth=1); ax.set_title(f'{d.name}: visitas por dia'); ax.set_ylabel('Visitas'); plt.show()
    '''),
    md('''
    ## Passo 2. O que é normal?
    Para cada dia, olhamos os dias ao redor (uma **janela**) e calculamos a **mediana**. A mediana quase não muda com um pico isolado, por isso é uma boa referência. Depois medimos o **desvio robusto** (a mediana das distâncias até a mediana) e dizemos quantos desvios cada dia está acima do normal. Esse número é a **pontuação** do dia.
    '''),
    py('''
    def detectar(serie, janela=29, limiar=6):
        normal = serie.rolling(janela, center=True, min_periods=janela // 2).median()
        desvio = (serie - normal).abs().rolling(janela, center=True, min_periods=janela // 2).median() * 1.4826
        pontuacao = (serie - normal) / desvio.clip(lower=max(1, serie.median() * .05))
        return normal, pontuacao, pontuacao > limiar

    @interact(janela=widgets.IntSlider(value=29, min=7, max=91, step=2, description='janela (dias)'),
              limiar=widgets.FloatSlider(value=6, min=2, max=20, step=.5, description='limiar'))
    def ver(janela, limiar):
        normal, pont, pico = detectar(d, janela, limiar)
        ax = d.plot(linewidth=1, color='#4a4a4a', label='visitas')
        normal.plot(ax=ax, linewidth=2, color=CORES[0], label='normal (mediana da janela)')
        ax.scatter(d.index[pico], d[pico], color=CORES[1], zorder=3, s=30, label=f'picos ({pico.sum()} dias)')
        ax.set_title('Picos encontrados'); ax.legend(); plt.show()
    '''),
    md('''
    **Para discutir:** o que acontece com o número de picos quando o limiar diminui? E quando a janela aumenta? Não existe limiar certo: é uma escolha, e toda escolha deve ser explicada.

    ## Passo 3. A lista de picos
    Agrupamos dias de pico seguidos em um só evento e ordenamos pelo tamanho.
    '''),
    py('''
    janela = 29  # @param {type:"integer"}
    limiar = 6  # @param {type:"number"}
    normal, pont, pico = detectar(d, janela, limiar)
    evento = (pico != pico.shift()).cumsum()[pico]
    picos = (pd.DataFrame({'dia': d.index[pico], 'visitas': d[pico].values, 'normal': normal[pico].values.round(), 'evento': evento.values})
             .sort_values('visitas', ascending=False).drop_duplicates('evento').drop(columns='evento'))
    picos['vezes o normal'] = (picos['visitas'] / picos['normal'].clip(lower=1)).round(1)
    picos['dia'] = picos['dia'].dt.strftime('%d/%m/%Y')
    picos.head(10).reset_index(drop=True)
    '''),
    md('''
    ## Passo 4. Investigue
    Para cada um dos três maiores picos, procure em duas fontes confiáveis (um jornal e um site oficial, por exemplo) o que aconteceu naquele dia ou na véspera. Anote a fonte e a data de cada explicação.

    | Dia | Explicação | Fonte 1 | Fonte 2 |
    |---|---|---|---|
    |  |  |  |  |

    Lembre: os dados mostram **quando** o interesse mudou. O **porquê** vem das fontes.

    ## Sua vez
    Compare dois verbetes ligados (por exemplo, *Eclipse* e *Lua*). Os picos acontecem nos mesmos dias? Escreva o código abaixo.
    '''),
    py('''
    # escreva aqui
    '''),
    SOLUCAO('''
    dois = visitas(['Eclipse', 'Lua'], inicio=inicio, por='dia')
    marcados = pd.DataFrame({c: detectar(dois[c])[2] for c in dois})
    print('Dias de pico em comum:', list(dois.index[marcados.all(axis=1)].strftime('%d/%m/%Y')))
    '''),
    md('''
    ## Para fechar
    Detectores de anomalia como este são usados para achar fraudes em cartões, falhas em máquinas e surtos de doenças. A ideia é a mesma: definir o normal, medir a distância e escolher um limite.
    '''),
])

# ---------------------------------------------------------------------------------------------
nb('04-sazonalidade-escolar.ipynb', 'Sazonalidade escolar: o calendário que aparece nos dados',
   'Veja como o ano letivo e os fins de semana aparecem nas visitas a verbetes de escola e de lazer, com mapas de calor e perfis por mês.', [
    cabecalho('Sazonalidade escolar: o calendário que aparece nos dados',
              'Verbetes como Fração e Fotossíntese são lidos por estudantes. Por isso, as visitas sobem no ano letivo, caem nas férias e diminuem '
              'nos fins de semana. Neste notebook você encontra esse padrão nos dados e compara com verbetes de lazer.',
              'professores, 6º ao 9º ano e ensino médio', 'EF06MA32, EF07MA35, EF07MA36, EF09MA22', '1 aula de 50 min'),
    md('''
    ## Objetivos
    - Reconhecer padrões que se repetem (sazonalidade) em uma série temporal.
    - Comparar perfis com números de tamanhos diferentes usando um índice (média = 100).
    - Ler um mapa de calor.
    '''),
    CONFIG,
    md('## Passo 1. Verbetes de escola e de lazer'),
    py('''
    escola = ['Fração', 'Fotossíntese', 'Teorema de Pitágoras', 'Revolução Francesa', 'Célula']
    lazer = ['Minecraft', 'Roblox', 'Carnaval']
    meses = visitas(escola + lazer, inicio='2018-01-01')
    meses.tail(3)
    '''),
    md('''
    ## Passo 2. O perfil de cada mês
    Cada verbete tem um tamanho diferente. Para comparar, dividimos cada mês pela média do próprio ano e multiplicamos por 100: acima de 100, o mês foi mais lido que a média daquele ano.
    '''),
    py('''
    MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    completos = meses[meses.index.year < pd.Timestamp.today().year]
    indice = completos / completos.groupby(completos.index.year).transform('mean') * 100
    perfil = indice.groupby(indice.index.month).mean()
    perfil.index = MESES
    ax = perfil[escola].mean(axis=1).plot(linewidth=3, marker='o', label='média dos verbetes de escola')
    perfil[lazer].mean(axis=1).plot(ax=ax, linewidth=3, marker='o', label='média dos verbetes de lazer')
    ax.axhline(100, color='#111', linewidth=1, linestyle='--')
    ax.set_xticks(range(12)); ax.set_xticklabels(MESES)
    ax.set_title('Perfil do ano (100 = média do ano)'); ax.legend(); plt.show()
    '''),
    md('''
    **Para discutir:** em que meses os verbetes de escola ficam abaixo de 100? Isso combina com o calendário escolar brasileiro? E o Carnaval, quando sobe?

    ## Passo 3. Mapa de calor
    Cada linha é um ano e cada coluna é um mês. Quanto mais escuro o verde, mais visitas em relação à média daquele ano.
    '''),
    py('''
    @interact(verbete=escola + lazer)
    def mapa(verbete):
        tabela = indice[verbete].groupby([indice.index.year, indice.index.month]).mean().unstack()
        fig, ax = plt.subplots(figsize=(11, .5 * len(tabela) + 1.5))
        im = ax.imshow(tabela, cmap='YlGn', aspect='auto')
        ax.set_xticks(range(12)); ax.set_xticklabels(MESES)
        ax.set_yticks(range(len(tabela))); ax.set_yticklabels(tabela.index)
        for i in range(tabela.shape[0]):
            for j in range(tabela.shape[1]):
                v = tabela.iloc[i, j]
                ax.text(j, i, f'{v:.0f}', ha='center', va='center', fontsize=9, color='white' if v > 120 else '#111')
        ax.grid(False); ax.set_title(f'{verbete}: visitas em relação à média do ano (100)')
        plt.colorbar(im, ax=ax, shrink=.8); plt.show()
    '''),
    md('''
    ## Passo 4. Dias da semana
    Agora com dados por dia: em que dia da semana cada verbete é mais lido?
    '''),
    py('''
    DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
    por_dia = visitas(['Fração', 'Minecraft'], inicio=pd.Timestamp.today() - pd.Timedelta(days=365), por='dia')
    semana = por_dia.groupby(por_dia.index.dayofweek).mean()
    semana = semana / semana.mean() * 100
    semana.index = DIAS
    ax = semana.plot(kind='bar', width=.8, edgecolor='#111')
    ax.axhline(100, color='#111', linewidth=1, linestyle='--')
    ax.set_title('Visitas por dia da semana (100 = média da semana)'); plt.xticks(rotation=0); plt.show()
    '''),
    md('''
    ## Sua vez
    Escolha um verbete ligado a uma data do ano (por exemplo, *Dia das Crianças*, *Páscoa* ou *Revolução Farroupilha*) e descubra o mês de pico usando o perfil do Passo 2.
    '''),
    py('''
    # escreva aqui
    '''),
    SOLUCAO('''
    v = visitas('Revolução Farroupilha', inicio='2018-01-01')
    v = v[v.index.year < pd.Timestamp.today().year]
    perfil_v = (v / v.groupby(v.index.year).transform('mean') * 100).groupby(v.index.month).mean()
    print('Mês de pico:', MESES[perfil_v.iloc[:, 0].idxmax() - 1])
    '''),
    md('''
    ## Para fechar
    Saber que um padrão se repete ajuda a não confundir sazonalidade com tendência: uma queda em julho não quer dizer que o interesse diminuiu, só que é férias. Por isso, para comparar, use o mesmo mês do ano anterior.
    '''),
])

# ---------------------------------------------------------------------------------------------
nb('05-texto-e-modelos-de-linguagem.ipynb', 'O texto dos verbetes e como um modelo de linguagem prevê a próxima palavra',
   'Conte palavras, compare verbetes e construa um pequeno modelo que prevê a próxima palavra, com semente e temperatura.', [
    cabecalho('O texto dos verbetes e como um modelo de linguagem prevê a próxima palavra',
              'Modelos como o ChatGPT aprendem com bilhões de textos, e a Wikipédia é um deles. Neste notebook você baixa o texto de verbetes, '
              'conta palavras e constrói um modelo de linguagem minúsculo que prevê a próxima palavra. É a mesma ideia dos grandes modelos, '
              'em escala de sala de aula.',
              'professores, 8º e 9º ano, ensino médio e cursos técnicos', 'EF08CO11, EF09CO10, EF07MA36', '2 aulas de 50 min'),
    md('''
    ## Objetivos
    - Transformar texto em dados (palavras e frequências).
    - Entender que um modelo de linguagem calcula a probabilidade da próxima palavra.
    - Ver o efeito da semente (seed) e da temperatura no texto gerado.
    - Discutir limites: o modelo repete padrões do texto, não sabe se algo é verdade.

    Os textos da Wikipédia são publicados sob a licença CC BY-SA. Ao usar trechos, cite a Wikipédia como fonte.
    '''),
    CONFIG,
    md('## Passo 1. Baixe os textos'),
    py('''
    verbetes = 'Inteligência artificial, Aprendizado de máquina, Rede neural artificial'  # @param {type:"string"}
    textos = {}
    for v in [x.strip() for x in verbetes.split(',') if x.strip()]:
        t = titulo_oficial(v)
        textos[t] = texto(t)
        print(f'{t}: {fmt(len(textos[t].split()))} palavras')
    print()
    print(list(textos.values())[0][:500], '...')
    '''),
    md('''
    ## Passo 2. Do texto às palavras
    Separamos o texto em palavras (em letras minúsculas) e tiramos as palavras muito comuns, como "de", "a" e "que", chamadas **palavras vazias**.
    '''),
    py('''
    VAZIAS = set(\'\'\'a à ao aos as às com como da das de do dos e é em entre essa esse esta este eu foi há isso já mais mas na nas
    no nos não o os ou para pela pelas pelo pelos por que quando se sem ser seu sua são também um uma umas uns ele ela eles elas
    sobre ter tem foram pode podem muito outros outras qual quais onde até após cada isso pois sendo seja\'\'\'.split())

    def palavras(t):
        return re.findall(r"[a-záàâãéêíóôõúç]+(?:-[a-záàâãéêíóôõúç]+)*", t.lower())

    @interact(verbete=list(textos), quantas=widgets.IntSlider(value=15, min=5, max=30))
    def frequentes(verbete, quantas):
        cont = pd.Series([p for p in palavras(textos[verbete]) if p not in VAZIAS and len(p) > 2]).value_counts().head(quantas)
        ax = cont.sort_values().plot(kind='barh', color=CORES[0], edgecolor='#111', figsize=(9, .32 * quantas + 1))
        ax.set_title(f'Palavras mais frequentes em {verbete}'); ax.set_xlabel('Vezes no texto'); plt.show()
    '''),
    md('''
    ## Passo 3. Um modelo que prevê a próxima palavra
    Contamos, em todos os textos, qual palavra veio depois de cada palavra. Isso é um **modelo de bigramas**. Para prever o que vem depois de "rede", o modelo olha todas as vezes que "rede" apareceu e calcula a porcentagem de cada palavra seguinte. Os grandes modelos fazem algo parecido, mas olham para muitas palavras anteriores ao mesmo tempo e aprendem com redes neurais.
    '''),
    py('''
    from collections import Counter, defaultdict
    seguintes = defaultdict(Counter)
    for t in textos.values():
        ps = palavras(t)
        for a, b in zip(ps, ps[1:]):
            seguintes[a][b] += 1
    print(f'O modelo conhece {fmt(len(seguintes))} palavras.')

    palavra = 'rede'  # @param {type:"string"}
    c = seguintes.get(palavra.lower())
    if not c:
        print('Essa palavra não aparece nos textos. Tente outra.')
    else:
        prob = pd.Series(c).sort_values(ascending=False) / sum(c.values()) * 100
        pd.options.display.float_format = '{:.1f}'.format
        display(prob.head(10).rename('probabilidade (%)').to_frame())
    '''),
    md('''
    ## Passo 4. Gerando texto: semente e temperatura
    Para gerar um texto, o modelo sorteia a próxima palavra de acordo com as probabilidades e repete.
    - A **semente** fixa o sorteio: com a mesma semente, sai sempre o mesmo texto.
    - A **temperatura** muda o sorteio. Baixa (perto de 0,1): quase sempre a palavra mais provável, texto repetitivo. Alta (perto de 2): palavras improváveis aparecem mais, texto mais criativo e mais sem sentido.
    '''),
    py('''
    def gerar(inicio, n, semente, temperatura):
        rng = np.random.default_rng(semente)
        saida = [inicio.lower()]
        for _ in range(n):
            c = seguintes.get(saida[-1])
            if not c:
                break
            opcoes = list(c)
            p = np.array([c[o] for o in opcoes], dtype=float) ** (1 / temperatura)
            saida.append(rng.choice(opcoes, p=p / p.sum()))
        return ' '.join(saida)

    @interact(inicio=widgets.Text(value='inteligência', description='começo'),
              palavras_geradas=widgets.IntSlider(value=25, min=5, max=60),
              semente=widgets.IntSlider(value=1, min=0, max=50),
              temperatura=widgets.FloatSlider(value=1, min=.1, max=2.5, step=.1))
    def escrever(inicio, palavras_geradas, semente, temperatura):
        print(gerar(inicio, palavras_geradas, semente, temperatura))
    '''),
    md('''
    **Para discutir:**
    - O texto gerado tem cara de português, mas faz sentido? Por quê?
    - O modelo pode inventar uma frase falsa que parece verdadeira? (Sim: ele só repete padrões de palavras, não confere fatos. Os grandes modelos também podem fazer isso, o que chamamos de alucinação.)
    - Se o texto de treino tiver um erro ou um preconceito, o que acontece com o modelo?

    ## Sua vez
    Troque os verbetes do Passo 1 por textos de outra área (por exemplo, *Futebol, Copa do Mundo FIFA, Seleção Brasileira de Futebol*), rode tudo de novo e gere texto a partir de "seleção". O que muda?
    '''),
    py('''
    # escreva aqui
    '''),
    md('''
    ## Para fechar
    Um modelo de linguagem é, no fundo, uma máquina de calcular a probabilidade da próxima palavra. Ele fica melhor com mais texto e mais contexto, mas continua dependendo do que leu. Por isso, o que a IA escreve precisa ser conferido, como qualquer outra fonte.
    '''),
])


def main():
    os.makedirs(SAIDA, exist_ok=True)
    for n in NOTEBOOKS:
        livro = nbf.v4.new_notebook()
        livro.metadata = {'kernelspec': {'name': 'python3', 'display_name': 'Python 3'}, 'language_info': {'name': 'python'},
                          'colab': {'name': n['arquivo'], 'provenance': []}}
        badge = md(f"[![Abrir no Colab](https://colab.research.google.com/assets/colab-badge.svg)]({COLAB}{n['arquivo']})")
        cells = [badge] + n['celulas']
        livro.cells = [nbf.v4.new_markdown_cell(s) if k == 'md' else nbf.v4.new_code_cell(s) for k, s in cells]
        for i, c in enumerate(livro.cells):
            c['id'] = f'c{i:02d}'
        nbf.write(livro, os.path.join(SAIDA, n['arquivo']))
        print(n['arquivo'])
    pagina()


def pagina():
    e = html.escape
    cards = '\n'.join(f'''        <article class="painel nb">
          <span class="eyebrow">Notebook {i + 1}</span>
          <h3>{e(n['titulo'])}</h3>
          <p>{e(n['resumo'])}</p>
          <p class="small muted">{e(n['publico'][:1].upper() + n['publico'][1:])} · {e(n['tempo'])} · BNCC {e(n['habs'])}</p>
          <p class="botoes"><a class="btn" href="{COLAB}{n['arquivo']}" rel="noopener">Abrir no Colab</a> <a class="btn ghost" href="{REPO}{n['arquivo']}" rel="noopener">Ver no GitHub</a></p>
        </article>''' for i, n in enumerate(NOTEBOOKS))
    modelo = open(os.path.join(AQUI, 'pagina.html')).read()
    os.makedirs(os.path.dirname(PAGINA), exist_ok=True)
    open(PAGINA, 'w').write(modelo.replace('<!-- notebooks -->', cards))


if __name__ == '__main__':
    main()
