---
name: ajouter-une-seed
description: Ajouter une situation de référence (« seed ») à un modèle du simulateur d'éligibilité : des réponses nommées, avec les cibles qu'on en attend. À charger dès qu'il s'agit de couvrir un cas du modèle, d'ouvrir un écran depuis l'écran des seeds, ou de reproduire un scénario signalé par le porteur.
---

# Ajouter une seed

Ce skill ne porte que la marche à suivre. Les règles sont ailleurs :

| Ce qu'il faut savoir | Où |
|---|---|
| où va une seed, et pourquoi pas dans un fichier de test | `apps/simulateur-eligibilite/AGENTS.md` § « Tests » |
| ce qu'est une seed, champ par champ | [`core/socle/seeds/seed.ts`](../../../apps/simulateur-eligibilite/core/socle/seeds/seed.ts) |
| l'écran des seeds | `apps/simulateur-eligibilite/AGENTS.md` § « Les developer tools » |
| une seed n'annonce pas où elle s'ouvre (D-56), une seed par cas de l'oracle (D-57, D-79), une seed par capacité du socle (D-66) | [`journal-des-decisions-v10.md`](../../../apps/simulateur-eligibilite/docs/knowledge/adr/journal-des-decisions-v10.md) |

Les chemins ci-dessous partent de `apps/simulateur-eligibilite/`.

## 1. Choisir le modèle

| Ce que la seed montre | Où elle va |
|---|---|
| un cas du modèle de l'éditeur | `core/models/eligibilite/seeds-catalogue.ts` |
| une capacité du socle, sur sa page de démonstration | `core/models/fake/seeds-catalogue.ts` |

Lis l'en-tête du catalogue avant d'écrire : il dit quels cas il couvre déjà, et
d'où viennent ses réponses.

## 2. Écrire les réponses

Les réponses se donnent par identifiant de question (`"Q1.2"`), avec les
valeurs de `declarations/questions.ts`. Un groupe de réponses partagé par
plusieurs seeds devient une constante en tête du catalogue (`TAP_1_5`,
`TRAJET_COURT`).

Les réponses disent où la seed s'ouvre :

- complètes, elle ouvre un résultat, et annonce ses cibles attendues ;
- incomplètes, elle s'arrête sur la première question sans réponse, et
  n'annonce rien.

Pour un cas de l'oracle, les réponses s'écrivent d'après le contrat
réponses/faits du paquet, dans `tmp/<version>/package/`. Les helpers de
`tests/model/eligibilite/` (`reponses-de-la-branche.ts`,
`reponses-du-transfert.ts`…) montrent comment on l'a fait.

## 3. Écrire les attendus

`expected` ne nomme que les cibles qui caractérisent la seed, avec la valeur
que les règles donnent. Ce sont les cibles de `declarations/cibles.ts`, pas les
faits.

`label` dit l'écran où elle s'ouvre, puis ce qu'on y voit. `description` dit
pourquoi elle existe. `id`, en kebab-case, ne change plus une fois cité.

## 4. Vérifier

```bash
pnpm test conformite metier-sous-node
```

| Ce qui échoue | Ce que ça veut dire |
|---|---|
| « portent chacune un identifiant qui leur est propre » | l'`id` est déjà pris |
| « ne répondent qu'à des questions du modèle » | une réponse nomme une question qui n'existe pas, ou plus |
| « sont rejouées sans écart avec leurs attendus » | les règles ne donnent pas la cible annoncée |
| « posent des questions qui passent en JSON » | une question posée par la seed ne se relit pas à l'identique |

Sur un écart, ne corrige pas l'attendu pour qu'il passe. Lis la règle et le
contrat : soit l'attendu était faux, soit les règles ont changé. Une règle de
l'éditeur qui te semble fausse ne se corrige pas chez nous :
[`livrable-de-l-editeur.md`](../../../apps/simulateur-eligibilite/docs/knowledge/domain/livrable-de-l-editeur.md)
§ « En attendant une réponse de l'éditeur ».

Ouvre ensuite la seed sur l'écran des seeds (`pnpm dev`, puis les developer
tools) : elle doit tomber sur l'écran que dit son `label`.

Puis :

```bash
tsp verifier simulateur
```
