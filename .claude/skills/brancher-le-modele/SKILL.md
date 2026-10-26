---
name: brancher-le-modele
description: Brancher le code sur une règle du modèle d'éligibilité (apps/simulateur-eligibilite/core/models/eligibilite/rules/regles.publicodes) : déclarer un fait, une cible ou une option, écrire le fichier d'un fait, poser une question, lire une cible. À charger dès qu'un fait, une cible ou une question de l'éditeur entre, sort ou change, ou qu'il s'agit de toucher au modèle métier.
---

# Brancher le modèle

Les règles sont celles de l'éditeur : `rules/regles.publicodes` ne se modifie
pas, il se recopie (skill `implement-publicodes-version`). Ce qui s'écrit chez
nous, c'est ce qui les relie au questionnaire : les faits qu'elles reçoivent,
les cibles qu'elles donnent, les questions qui établissent les faits.

Ce skill ne porte que l'ordre des gestes. Les règles sont ailleurs :

| Ce qu'il faut savoir | Où |
|---|---|
| ce qui fait foi chez l'éditeur, ce qu'on ne tranche pas à sa place | [`docs/knowledge/domain/livrable-de-l-editeur.md`](../../../apps/simulateur-eligibilite/docs/knowledge/domain/livrable-de-l-editeur.md) |
| comment déclarer une question, une garde, une dépendance | `apps/simulateur-eligibilite/AGENTS.md` § « Le questionnaire » |
| `Fait`, `FaitCatalogue`, `regles()`, `Cible` | `apps/simulateur-eligibilite/AGENTS.md` § « La décision » |
| où vit chaque partie, ce qu'elle a le droit de lire | `apps/simulateur-eligibilite/AGENTS.md` § « Ce que c'est » |

Les chemins ci-dessous partent de `apps/simulateur-eligibilite/core/models/eligibilite/`.

## 1. Lire ce que dit l'éditeur

| Ce qui change | Ce qu'on lit dans `tmp/<version>/package/` |
|---|---|
| un fait | sa règle dans le YAML, et sa ligne de `CONTRAT_REPONSES_FAITS.json` : ce qui le met à « oui », à « non », et ce qui le laisse absent |
| une cible | sa règle dans le YAML, et `dictionnaire_cibles.json` |
| une question ou une option | `CATALOGUE_COMPLET_QUESTIONS.md`, mot pour mot |

Un contrat ambigu ne se tranche pas dans le code : il se remonte à l'éditeur.

## 2. Déclarer

| Ce qui change | Où | Ce qui le garde |
|---|---|---|
| un fait | `FAITS`, dans `declarations/faits.ts`, à son rang dans les règles | `tests/model/eligibilite/declarations.test.ts` |
| une cible | `CIBLES` ou `CIBLES_ENUMEREES`, dans `declarations/cibles.ts` | le même |
| une option | `OPTIONS`, dans `declarations/questions.ts` : son numéro au catalogue, puis ce qu'elle veut dire (`"2_AVEC_UN_PROCHE"`) | le même |

Ces listes typent le modèle. Un nom absent n'existe pas pour TypeScript.

## 3. Écrire le fait

Un fait vit dans `faits/<nom sans fait_>.ts`, réuni aux autres par
`faits/index.ts`. Le fichier s'ouvre sur le titre que l'éditeur donne au fait,
et n'exporte que sa déclaration, une chaîne `regles()`. Exemple :
`faits/accompagnant.ts`.

Un savoir que deux faits, ou un fait et une garde, lisent va dans son concept,
sous `concepts/`.

## 4. Poser la question

La question se déclare dans la page de sa partie : `p1/partie-1.ts`, les
`p2/pages-*.ts`, les `p3/pages-*.ts`. Sa garde lit le fait quand il en existe
un.

## 5. Lire une cible

Une cible se lit par `Cible` : `isOui()`, `isNon()`, `is("TAP")`,
`isInconnue()`, `isSansObjet()`. R2 et R3 la lisent dans
`front/models/eligibilite/`. Une cible inconnue n'est pas un « non ».

## 6. Tester

- Le fait se teste par les réponses qui l'établissent, dans le test de sa
  partie (`tests/model/eligibilite/faits-de-p1.test.ts`, `faits-de-p2.test.ts`…)
  ou dans le sien.
- Un cas de l'éditeur qui le traverse va dans l'oracle
  (`tests/model/eligibilite/oracle.test.ts`).
- Un cas métier nommé devient une seed : skill `ajouter-une-seed`.

## 7. Vérifier

```bash
tsp verifier simulateur
```

## Ce qui trahit une erreur

| Symptôme | Cause probable |
|---|---|
| `declarations.test.ts` échoue | un fait, une cible ou une constante ne sont plus ceux des règles |
| `catalogue-des-faits.test.ts` échoue | un fait n'a pas son fichier sous `faits/`, ou un fichier n'a plus de fait |
| « … se déclare deux fois », « Ces faits ne sont pas déclarés » au chargement | `faits/index.ts` ne réunit pas chaque fait une fois |
| « … se lit lui-même : a → b → a » | un fait se relit, par d'autres faits ou par une garde qui lit les faits |
| une cible reste inconnue | un fait dont elle dépend n'est pas établi : le moteur n'envoie aux règles que les faits établis |
| `domaines.test.ts` échoue | une partie lit celle qui la suit, ou un fait ou un concept lit une partie |
| `tests/architecture.test.ts` échoue sur publicodes | le modèle importe publicodes : seul le moteur de décision du socle le fait (D-76) |
