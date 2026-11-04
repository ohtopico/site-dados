"""Converte as gravações do IPA (Wikimedia Commons, CC BY-SA 3.0) para MP3, que toca em todos os navegadores.

As gravações originais estão no Wikimedia Commons (nomes em audio-commons.json). Aqui elas vêm da cópia
do repositório github.com/serverhiccups/ipa-chart (public/sounds, commit fc6270c), que reúne os mesmos arquivos.
Uso: python3 sons.py /caminho/para/ipa-chart/public/sounds
"""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gerar import slug
import simbolos as S

AQUI = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(AQUI, '..', '..', 'infograficos', 'alfabeto-fonetico', 'sons')
origem = sys.argv[1]
audio = json.load(open(os.path.join(AQUI, 'audio-commons.json'), encoding='utf-8'))
nomes = {x[0]: x[1] for x in S.CONSOANTES + S.VOGAIS + S.OUTROS}
os.makedirs(DEST, exist_ok=True)
for s, (local, commons, existe) in audio.items():
    if not existe:
        continue
    saida = os.path.join(DEST, slug(nomes[s]) + '.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(origem, local), '-ac', '1', '-ar', '44100',
                    '-b:a', '64k', '-af', 'loudnorm=I=-18:TP=-2', saida], check=True)
print(len(os.listdir(DEST)), 'arquivos em', os.path.normpath(DEST))
