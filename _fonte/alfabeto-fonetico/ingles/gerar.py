"""Gera infograficos/alfabeto-fonetico/ingles-cmudict.txt a partir do CMUdict
(github.com/cmusphinx/cmudict, commit 7479086, licença BSD de 2 cláusulas, Carnegie Mellon University).
Fica só a primeira pronúncia de cada palavra. Uso: python3 gerar.py caminho/cmudict.dict"""
import os, re, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, '..', '..', '..', 'infograficos', 'alfabeto-fonetico', 'ingles-cmudict.txt')
vistos, linhas = set(), []
for l in open(sys.argv[1], encoding='utf-8'):
    l = l.split('#')[0].strip()
    if not l:
        continue
    w, pron = l.split(' ', 1)
    if '(' in w or not re.fullmatch(r"[a-z][a-z']*", w) or w in vistos:
        continue
    vistos.add(w)
    linhas.append(w + ' ' + pron)
open(SAIDA, 'w', encoding='utf-8').write('\n'.join(linhas) + '\n')
print(len(linhas), 'palavras', os.path.getsize(SAIDA) // 1024, 'KB')
