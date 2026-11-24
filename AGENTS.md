# AGENTS.md

> Ce qui vaut pour tout le dépôt. Le reste est dans l'app concernée.

## Communication

> Concerne TOUTES TRACES : prompts, code, documentation, messages de commit.

### TOUJOURS
- Être concis
- Écrire en français
- Utiliser des mots simples
- Faire des phrases courtes

### JAMAIS
- De tirets cadratins
- De sentence en fin de paragraphe
- De flatterie

### PRÉFÉRER
- Les listes à puces quand on énumère 3 éléments ou plus
- Les tableaux quand les listes ne suffisent pas
- Les exemples plutôt que les longues phrases

## Le dépôt

Monorepo en **workspace pnpm** (`apps/*`) : une seule installation, à la
racine, et un seul `pnpm-lock.yaml`. Le toolchain vient de `mise` : Node 24, pnpm,
et `gh` pour les PR et la release d'une livraison.

Les apps restent **indépendantes de code**. Aucune n'importe une autre. Chacune a
son `package.json`, son job CI et son `pnpm verifier`. Le workspace mutualise
l'installation, pas les frontières.

**Une version d'outil partagé s'écrit dans le `catalog:` du
`pnpm-workspace.yaml`**, jamais dans une app. Les apps y renvoient par
`"typescript": "catalog:"`. Sans ça, deux apps peuvent tourner sur deux Biome,
avec un `verifier` vert dans l'une et rouge dans l'autre. Une dépendance propre à
une app (`express`, `publicodes`, `xlsx`) reste chez elle.

**pnpm ne résout pas les dépendances fantômes.** Un paquet utilisé sans être
déclaré marchait sous npm, par hoisting. Ici il casse : on le déclare.

**Avant de toucher à `apps/X`, lis `apps/X/AGENTS.md`.** Ce fichier-ci ne décrit
aucune app.

| App | Ce que c'est |
|---|---|
| `apps/simulateur-eligibilite` | Le produit. Simulateur d'éligibilité au transport sanitaire : règles publicodes, front React/DSFR, backend Express, rattachement à un établissement et un service, remplissage du CERFA. |
| `apps/datahub` | L'ETL qui calcule la part des trajets réalisés via les plateformes. Code public, **données et fournisseurs privés**. |
| `apps/cli` | `tsp`, la CLI du dépôt. Sans dépendance d'exécution, **sans tests**. |

**`tsp` ne fait que ce que rien d'autre ne fait.** Sur une machine neuve,
`apps/cli/bin/tsp setup` installe `mise`, le toolchain, les dépendances, les
hooks, et rend `tsp` appelable de partout.

| Besoin | Commande |
|---|---|
| Préparer et diagnostiquer la machine | `tsp setup`, `tsp doctor` |
| Ouvrir un outil du projet | `tsp open [outil]` |
| Tirer une branche de `staging` | `tsp branch <type>/<sujet>` |
| Pousser et ouvrir la PR vers `staging` | `tsp pr` |

Le reste passe par les outils eux-mêmes : `pnpm --filter <app> <script>`, `gh`,
et la lecture des fichiers.

**Ce qui traîne se nettoie.**

- Un worktree est supprimé à la fusion de sa PR, avec sa branche locale.
- `tmp/` ne garde que le livrable de l'éditeur en cours et le précédent.
- Pas de dossier `spec/` à la racine : le cadrage d'un chantier vit dans son
  ticket Notion. `apps/datahub/spec/` est autre chose : il est suivi par git.

## Vérifier

**La CI est la porte.** Avant de pousser, on lance seulement ce qui est rapide :
les tests du ou des fichiers qu'on vient d'écrire, `pnpm lint` en entier, et
`pnpm typecheck`. On pousse, et la CI dit le reste en 3 minutes.

Elle passe une à une les étapes du script `verifier` de chaque app (lint,
typecheck, knip, test, build), sous leur nom. Une porte ajoutée au `verifier`
d'une app s'ajoute aussi à son job, sous le même nom.

On ne lance pas la suite entière en local, ni deux commandes de test en même
temps, autres sessions comprises.

Les parcours en navigateur du simulateur (`pnpm test:navigateur`) demandent des
navigateurs installés et ont leur propre job en CI.

La CI et le `Procfile` appellent `pnpm`, pas `tsp` : la production ne dépend pas
de la CLI.

`pnpm audit` ne se scope pas à une app : il lit le lock, et le lock est unique
au dépôt. Il a son job de CI à la racine.

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
son `AGENTS.md`.

## Écrire du code et commiter

27 règles numérotées vivent dans `docs/knowledge/contributing/`. **À lire avant
d'écrire une ligne ou de commiter.**

- [`regles-de-code.md`](docs/knowledge/contributing/regles-de-code.md) : les 20 `QUAL-*`
- [`regles-git.md`](docs/knowledge/contributing/regles-git.md) : les 7 `GIT-*`
- [`ecrire-une-regle.md`](docs/knowledge/contributing/ecrire-une-regle.md) et
  [`ecrire-une-decision.md`](docs/knowledge/contributing/ecrire-une-decision.md) :
  écrire une règle, une décision ou un ADR
- [`livraisons.md`](docs/knowledge/contributing/livraisons.md) : ce qu'une livraison produit

**Ne recopie pas les règles ici.** Cite l'identifiant en revue et en commit :
« corrige QUAL-006 ».

## Où écrire quoi

| Ce que tu veux écrire | Où ça va |
|---|---|
| Une décision courante | le corps du message du commit (le pourquoi) et le ticket Notion du chantier. Pas de `D-<n>`, ni dans le code ni dans un commentaire : le journal des décisions de la v10 est clos |
| Une décision d'architecture coûteuse à défaire et surprenante | un fichier par décision, sans détail d'implémentation, dans `docs/knowledge/adr/` de l'app concernée, ou celui de la racine si la décision traverse plusieurs apps, au format de [`ecrire-une-decision.md`](docs/knowledge/contributing/ecrire-une-decision.md) |
| Le cadrage, le découpage et l'état d'un chantier | son ticket Notion, tenu à la main, avec une liste à cocher d'une ligne par PR. La PR cite le ticket dans son corps. Jamais un fichier du dépôt, ni une issue GitHub |
| Ce qu'une app sait faire | son `docs/knowledge/features.md`, un tableau « feature, ce qu'elle fait » |
| Une connaissance métier actée | `docs/knowledge/domain/` de l'app concernée, ou celui de la racine si elle traverse plusieurs apps. Ce qu'une décision d'architecture change pour le métier y va aussi |
| Le détail d'une implémentation | le code, que ses tests documentent. Ni un ADR ni un README. Un code obscur se corrige (un nom, une étape explicite), il ne s'explique pas dans une doc |
| Le mode d'emploi d'une app | son `README.md` |
| Ce qu'une version apporte | le `CHANGELOG.md` de l'app, au format de [`livraisons.md`](docs/knowledge/contributing/livraisons.md) |
| Une consigne aux agents | `AGENTS.md`, celui de la racine ou celui de l'app, selon le critère ci-dessous |
| Une règle de code ou de commit | `docs/knowledge/contributing/`, au format de [`ecrire-une-regle.md`](docs/knowledge/contributing/ecrire-une-regle.md) |
| Une garde | **un test**, pas une phrase |

**Un `AGENTS.md` garde le pourquoi et les contraintes qu'on ne peut pas déduire du
code, des tests ou des docs.** Tout ce qui décrit ce que fait le code en sort :
table de fichiers, état d'avancement, détail d'une implémentation. Avant d'y
ajouter une ligne, cherche le test ou le fichier qui la dit déjà.

Ce que `docs/knowledge/` contient ne se recopie pas ici : liste les dossiers
`adr/` et `domain/` plutôt que de te fier à un inventaire.

**Quand deux sources se contredisent**, l'ordre d'autorité est :

**le test > le code > le README de l'app > `docs/knowledge/adr/` > `docs/knowledge/domain/`**

Cette chaîne classe ce qui *décrit* le dépôt. `AGENTS.md` et
`docs/knowledge/contributing/` *prescrivent*. Ils ne se périment pas contre le
code : c'est le code qui a tort contre eux.

Les specs se périment : corrige la source la moins à jour, ne t'y fie pas.

## Marches à suivre

Trois gestes récurrents ont leur mode d'emploi dans `.claude/skills/`, chargé à la
demande plutôt que recopié ici. Un skill ne porte que la marche à suivre et des
liens : toute règle vit dans `docs/knowledge/`. Il désigne un rôle (le relecteur,
le porteur), jamais une personne.

| Skill | Quand |
|---|---|
| `implement-publicodes-version` | Intégrer une version du modèle livrée par l'éditeur : le paquet dans `tmp/<version>/package/`, le diff, la recopie, l'oracle, le retour à l'éditeur |
| `livrer-une-version` | Livrer une app : numéro, journal des versions, PR vers `staging`, tag `<app>@<version>` et release, puis fusion de `staging` dans `main` |
| `revue-d-une-pr` | Revoir une PR et son ticket Notion : fonctionnel puis technique, écarts au ticket, couverture, cahier de tests à cocher, app lancée à la tête de la PR, verdict |

Les autres marches sont écrites dans `docs/knowledge/` : écrire une règle ou une
décision (`contributing/`), brancher le modèle et ajouter une seed (le livrable
de l'éditeur et l'`AGENTS.md` du simulateur).

## Toute règle nomme sa garde

**Une règle de forme nomme l'assertion qui la garde. Sans assertion, elle
n'existe pas.** Mieux vaut l'écrire dans un test que la répéter ici. Une règle de
jugement, que rien ne mécanise, écrit `*Aucune garde.*` en toutes lettres plutôt
que de laisser croire qu'elle en a une.

L'état de chaque règle des 27 de
[`docs/knowledge/contributing/`](docs/knowledge/contributing/) se lit dans la
colonne « Garde » de son tableau, pas ici : le recopier créerait deux sources à
tenir à jour.
