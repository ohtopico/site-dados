import csv, io, sys, zipfile, glob
for z in sorted(glob.glob('/tmp/censo/*.zip')):
    zf = zipfile.ZipFile(z)
    nome = [n for n in zf.namelist() if n.lower().endswith('.csv') and 'microdados_ed_basica' in n.lower()]
    print('=====', z, nome)
    if not nome: print(zf.namelist()); continue
    with zf.open(nome[0]) as f:
        r = csv.DictReader(io.TextIOWrapper(f, encoding='latin-1'), delimiter=';')
        cols = None
        for row in r:
            if row.get('SG_UF') != 'RS' or 'CANDEL' not in (row.get('NO_MUNICIPIO') or '').upper(): continue
            if row.get('TP_DEPENDENCIA') != '3': continue
            if cols is None:
                cols = [c for c in r.fieldnames if ('FUND' in c and ('QT_' in c or 'IN_' in c)) or c in ('NO_ENTIDADE','CO_ENTIDADE','TP_LOCALIZACAO','TP_SITUACAO_FUNCIONAMENTO','NO_MUNICIPIO','CO_MUNICIPIO','QT_DOC_BAS','QT_DOC_FUND','QT_DOC_FUND_AI','QT_DOC_FUND_AF','IN_LABORATORIO_INFORMATICA','QT_DESKTOP_ALUNO','QT_COMP_PORTATIL_ALUNO','QT_TABLET_ALUNO','IN_INTERNET_ALUNOS')]
            print({c: row[c] for c in cols if row.get(c) not in ('', '0', None)})
