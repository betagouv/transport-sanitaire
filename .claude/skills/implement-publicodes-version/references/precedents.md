# Précédents d'intégration

Ce que les intégrations de la v10 ont appris. C'est daté : à relire au besoin,
pas à suivre à la lettre. Le corps de chaque commit dit ce qui a changé et
pourquoi.

## Les commits

| Version | Commits | Ce qu'il faut en retenir |
|---|---|---|
| v10.0.2 | `a241d718` (#61), `39f69036` (#62) | le premier modèle de l'éditeur, posé en deux temps : le noyau, puis P0 et P1 |
| v10.1.1 | `3cc7b542`, `2a0d57d3` (#126) | un refactor préalable sort les faits de l'oracle dans un fichier partagé ; la v10.1.0 est sautée, la v10.1.1 la contient |
| v10.1.2 | `b05c3ab8` (#181) | le YAML ne bouge pas : seuls `VERSION` et le catalogue changent, et les corrections tiennent à l'écran |
| v10.1.3 | `35ee0b14`, `a80d10bc`, `29efd1e9` (#193), fusionnés par `03be39a6` (#194) | une PR, un commit par couche : le modèle, R2, les questions de P2 |

## Les leçons

- **Une version peut en contenir une autre.** La v10.1.1 portait la v10.1.0 et
  les réponses de l'éditeur du 15 octobre. On a intégré la plus récente seule.
- **Un YAML identique n'est pas une version vide.** La v10.1.2 ne changeait que
  le catalogue et des libellés. Le diff des contrats et du guide reste à faire.
- **Un défaut du livrable se recopie tel quel** (D-126). Le lien
  `contact-cpam.fr` abîmé en v10.1.3 est resté abîmé, en attendant l'éditeur.
- **Le contrat l'emporte sur un texte du catalogue** (D-127). En v10.1.3,
  `CONTRAT_RENDU_DOCUMENTAIRE.json` disait le libellé du bouton de complétion,
  et le catalogue en disait un autre.

## Avant la v10

Les intégrations de la v9 vivaient dans une autre arborescence. Leurs
précédents sont dans l'historique de ce fichier :

```bash
git log --oneline -- .claude/skills/implement-publicodes-version/references/precedents.md
```
