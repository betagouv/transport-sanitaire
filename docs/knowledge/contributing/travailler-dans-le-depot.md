# Travailler dans le dépôt

> Comment on écrit, on vérifie, on range et on nettoie. Les `AGENTS.md` sont
> générés depuis les sources du dépôt : ils ne portent aucune connaissance
> (ADR-0011).

## Écrire

Cela vaut pour toutes les traces : documentation, commentaires, messages de
commit.

| | |
|---|---|
| **Toujours** | être concis ; écrire en français ; utiliser des mots simples ; faire des phrases courtes |
| **Jamais** | de tirets cadratins ; de sentence en fin de paragraphe |
| **Préférer** | les listes à puces quand on énumère 3 éléments ou plus ; les tableaux quand les listes ne suffisent pas ; les exemples plutôt que les longues phrases |

## Français et anglais

**Le français** porte tout ce qui se lit comme du texte, et le métier :

- l'interface
- les noms de règles
- les intitulés de tests
- la documentation et les commentaires
- les messages de commit
- **les identifiants du métier** : `rattachement`, `etablissement`, `service`,
  `referentiel`, `cerfa`, `seed`, `simulateur`.

**L'anglais** porte le vocabulaire technique des identifiants, celui que
l'industrie nomme déjà ainsi : composants d'interface (`TextField`, `Stepper`),
écrans (`SeedsScreen`), mécanique du questionnaire (`Answer`, `draft`,
`dependsOn`), navigation et état, et ce qu'une API tierce nomme (`useX`, `Props`).
Le franciser produit des mots que personne n'emploie.

Un nom qui mêle les deux garde le terme métier tel quel et met le reste en
anglais : `RattachementForm`, `SeedsTable`, `seedAnswers`.

Aucun test ne garde cette règle : elle se tient à la relecture.

**Une dérogation assumée.** `apps/cli` écrit ses identifiants techniques en
anglais et garde le français pour le métier (`recueil`, `tache`, `etat`) : voir
son [README](../../../apps/cli/README.md).

## Vérifier

**La CI est la porte.** Avant de pousser, on lance seulement ce qui est rapide :
les tests du ou des fichiers qu'on vient d'écrire, `pnpm lint` en entier, et
`pnpm typecheck`. On pousse, et la CI dit le reste en 3 minutes.

- Elle passe une à une les étapes du script `verifier` de chaque app (lint,
  typecheck, knip, test, build), sous leur nom. Une porte ajoutée au `verifier`
  d'une app s'ajoute aussi à son job, sous le même nom.
- On ne lance pas la suite entière en local, ni deux commandes de test en même
  temps, autres sessions comprises.
- Les parcours en navigateur du simulateur (`pnpm test:navigateur`) demandent
  des navigateurs installés et ont leur propre job en CI.
- Le contrôle des `AGENTS.md` générés est une étape du job `audit` : voir
  [ADR-0011](../adr/0011-agents-md-est-genere-jamais-ecrit-a-la-main.md).

## Ce qui traîne se nettoie

- Un worktree est supprimé à la fusion de sa PR, avec sa branche locale.
- `tmp/` ne garde que le livrable de l'éditeur en cours et le précédent.
- Pas de dossier `spec/` à la racine : le cadrage d'un chantier vit dans son
  ticket Notion. `apps/datahub/spec/` est autre chose : il est suivi par git.

## Où écrire quoi

| Ce que tu veux écrire | Où ça va |
|---|---|
| Une décision courante | le corps du message du commit (le pourquoi) et le ticket Notion du chantier. Pas de `D-<n>`, ni dans le code ni dans un commentaire : le journal des décisions de la v10 est clos |
| Une décision d'architecture coûteuse à défaire et surprenante | un fichier par décision, sans détail d'implémentation, dans `docs/knowledge/adr/` de l'app concernée, ou celui de la racine si la décision traverse plusieurs apps, au format de [`ecrire-une-decision.md`](ecrire-une-decision.md) |
| Le cadrage, le découpage et l'état d'un chantier | son ticket Notion, tenu à la main, avec une liste à cocher d'une ligne par PR. La PR cite le ticket dans son corps. Jamais un fichier du dépôt, ni une issue GitHub |
| Ce qu'une app est, ses commandes, sa structure, sa configuration | son `README.md`. La section « Commandes » est la source des commandes : une table « commande, ce qu'elle fait » |
| Ce qu'une app sait faire | son `docs/knowledge/features.md`, un tableau « feature, ce qu'elle fait » |
| Le vocabulaire | `CONTEXT.md`, celui de l'app ou celui de la racine |
| Une connaissance métier actée | `docs/knowledge/domain/` de l'app concernée, ou celui de la racine si elle traverse plusieurs apps. Ce qu'une décision d'architecture change pour le métier y va aussi |
| Le détail d'une implémentation | le code, que ses tests documentent. Ni un ADR ni un README. Un code obscur se corrige (un nom, une étape explicite), il ne s'explique pas dans une doc |
| Ce qu'une version apporte | le `CHANGELOG.md` de l'app, au format de [`livraisons.md`](livraisons.md) |
| Une règle de code ou de commit | ce dossier, au format de [`ecrire-une-regle.md`](ecrire-une-regle.md) |
| Une garde | **un test**, pas une phrase |
| Une consigne aux agents | la source de la connaissance qu'elle porte, parmi les lignes ci-dessus. Les `AGENTS.md` sont générés par `pnpm agents` : on ne les édite jamais |

### Quand deux sources se contredisent

L'ordre d'autorité est :

**le test > le code > le README de l'app > `docs/knowledge/adr/` > `docs/knowledge/domain/`**

Cette chaîne classe ce qui *décrit* le dépôt. Les `AGENTS.md` générés et ce
dossier *prescrivent*. Ils ne se périment pas contre le code : c'est le code qui
a tort contre eux.

Les specs se périment : corrige la source la moins à jour, ne t'y fie pas.

## Les skills

Trois gestes récurrents ont leur marche à suivre dans `.claude/skills/`, chargée
à la demande. Un skill ne porte que la marche à suivre et des liens : toute règle
vit dans `docs/knowledge/`. Il désigne un rôle (le relecteur, le porteur), jamais
une personne. Son nom et sa description sont repris dans l'`AGENTS.md` de la
racine, depuis son en-tête.
