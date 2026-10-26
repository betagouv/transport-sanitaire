---
name: implement-publicodes-version
description: Intégrer une nouvelle version du modèle d'éligibilité livrée par l'éditeur dans apps/simulateur-eligibilite (paquet déposé dans tmp/<version>/package/). À charger dès qu'il s'agit de recopier, porter ou monter le modèle publicodes, de faire le diff d'un livrable, ou de remonter une anomalie à l'éditeur.
---

# Intégrer une version du modèle

Ce skill ne porte que la marche à suivre. Les règles sont ailleurs :

| Ce qu'il faut savoir | Où |
|---|---|
| où ranger le paquet et nos notes, ce que le dépôt garde du paquet, ce qui fait foi, comment répondre à l'éditeur | [`docs/knowledge/domain/livrable-de-l-editeur.md`](../../../apps/simulateur-eligibilite/docs/knowledge/domain/livrable-de-l-editeur.md) |
| où vit le modèle, ce qu'il a le droit d'importer | `apps/simulateur-eligibilite/AGENTS.md`, ADR [`metier-et-ecran`](../../../apps/simulateur-eligibilite/docs/knowledge/adr/metier-et-ecran.md) |
| les décisions de la v10 (D-70, D-79, D-103…) | [`journal-des-decisions-v10.md`](../../../apps/simulateur-eligibilite/docs/knowledge/adr/journal-des-decisions-v10.md) |

Les chemins ci-dessous partent de `apps/simulateur-eligibilite/`, sauf `tmp/`,
qui est à la racine du dépôt. Le livrable se dépose dans
`tmp/<version>/package/`. Ce qu'on écrit sur la version va à côté, dans
`tmp/<version>/`.

Les intégrations passées sont dans
[`references/precedents.md`](references/precedents.md), à lire au besoin.

## 1. Vérifier le paquet

```bash
cd tmp/<version>/package && sha256sum -c --quiet MANIFEST.sha256
```

N'écris rien dans `package/`, et n'y lance pas les tests de l'éditeur : un
fichier de plus, et le manifeste ne tient plus.

Lis ensuite, dans cet ordre :

1. `README.md` du paquet ;
2. `GUIDE_DEVELOPPEUR_v<version>.md`, qui dit ce que l'application doit faire ;
3. `CHANGEMENTS_v<version>.json` et `tickets/`, qui disent ce qui a bougé et
   ce que l'éditeur répond à nos tickets.

## 2. Faire le diff

```bash
P=tmp/<précédente>/package V=tmp/<version>/package
M=apps/simulateur-eligibilite/core/models/eligibilite/rules
diff -u $M/regles.publicodes $V/transports-sanitaires.publicodes.v<version>.yaml
diff -u $M/catalogue-resultats.json $V/integration_resultats/catalogue-resultats.json
diff -rq $P $V | grep -v historique/
```

Le premier diff est, au caractère près, ce que la recopie va changer. Le
dernier liste les contrats et les gabarits qui ont bougé.

Pose au diff ces questions, et montre les réponses avant de coder :

| Question | Ce qu'elle touche |
|---|---|
| Quels faits entrent ou sortent ? | `declarations/faits.ts`, un fichier par fait sous `faits/` |
| Quelles cibles, ou quelles valeurs de cible, changent ? | `declarations/cibles.ts`, les fiches de R2 qui lisent `cible_issue_id` |
| Quel contrat réponses/faits change ? | le fichier du fait concerné, sous `faits/` |
| Quelles questions, options ou libellés changent ? | `declarations/questions.ts`, les pages de `p1/`, `p2/`, `p3/` |
| Quels textes de R2 changent ? | les attendus des tests `texte-*` de R2 |
| Quel gabarit ou quel mapping de cerfa change ? | `front/models/eligibilite/r3/` |

## 3. Découper

Une version s'intègre sous une issue, découpée en sous-issues, une par PR
(`tsp issue add`, ou `/to-tasks` avec le diff en contexte). La première est
toujours la recopie : elle casse tout ce qui nomme le modèle, et rien n'est vert
tant qu'elle ne l'est pas. Chaque point du changelog qui change un comportement
mérite ensuite la sienne.

Le retour à l'éditeur est une sous-issue à part, qui ne bloque rien.

La livraison est un autre geste : skill `livrer-une-version`.

## 4. Recopier

```bash
V=tmp/<version>/package M=apps/simulateur-eligibilite/core/models/eligibilite/rules
cp $V/transports-sanitaires.publicodes.v<version>.yaml $M/regles.publicodes
cp $V/integration_resultats/catalogue-resultats.json $M/
printf '<version>\n' > $M/VERSION
cp $V/formulaires/*.pdf apps/simulateur-eligibilite/front/models/eligibilite/r3/gabarits/
cd apps/simulateur-eligibilite && pnpm regles
```

Puis mets à jour la version annoncée dans `apps/simulateur-eligibilite/README.md`
(« Entre deux modèles ») et dans `apps/simulateur-eligibilite/AGENTS.md`.

## 5. Lire ce qui tombe

Chaque garde dit une chose précise. Lis son message avant de toucher au code.

| Ce qui échoue | Ce que ça veut dire |
|---|---|
| `tests/model/regles-a-jour.test.ts` | `pnpm regles` n'a pas été relancé |
| `tests/model/eligibilite/catalogue-resultats.test.ts` | le catalogue, `VERSION` et le YAML ne sont pas de la même version, ou une issue n'a pas de texte |
| `tests/model/eligibilite/declarations.test.ts` | un fait, une cible ou une valeur de cible ne sont plus ceux des règles |
| `tests/model/eligibilite/catalogue-des-faits.test.ts` | un fait n'a pas son fichier sous `faits/`, ou l'inverse |
| `tests/model/eligibilite/oracle.test.ts` | un cas de l'oracle ne donne plus son issue, en faits |
| `tests/model/eligibilite/oracle-par-reponses.test.ts` | le même, par les réponses du questionnaire |
| `tests/model/conformite.test.ts` | une seed répond à une question disparue, ou ne donne plus ses cibles attendues |
| les tests `texte-*` de R2 | un texte du catalogue a changé : l'attendu le suit, mot pour mot |

## 6. Porter l'oracle

Les cas neufs des tests livrés vont dans `tests/model/eligibilite/`, sous leur
identifiant chez l'éditeur. En faits d'abord (`oracle.test.ts`, sur
`faits-de-l-oracle.ts`), puis en réponses quand le questionnaire sait les
produire (`oracle-par-reponses.test.ts`). Un cas qui ne se rejoue pas en
réponses le dit dans l'en-tête du fichier, avec sa raison.

Les seeds suivent : skill `ajouter-une-seed`.

## 7. Vérifier

```bash
tsp verifier simulateur
```

## 8. Répondre à l'éditeur

Écris le retour au moment où tu constates, pas de mémoire, dans
`tmp/<version>/retour-editeur/` : `message.md`, et une annexe au besoin. Sa
forme est dans
`docs/knowledge/domain/livrable-de-l-editeur.md` § « Répondre à l'éditeur ».
