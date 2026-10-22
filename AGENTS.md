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

Monorepo en **workspace pnpm**. Le `pnpm-workspace.yaml` de la racine déclare
`apps/*`. Il en découle :

- une seule installation, à la racine ;
- un seul `pnpm-lock.yaml` ;
- un magasin de paquets mutualisé.

Le toolchain vient de `mise` :

- Node 24
- pnpm
- `gh`, pour les PR et la release d'une livraison

Les apps restent **indépendantes de code**. Aucune n'importe une autre. Chacune a
son `package.json`, son job CI et son `pnpm verifier`. Le workspace mutualise
l'installation, pas les frontières.

Deux conséquences qui ne sont pas cosmétiques.

**Une version d'outil partagé s'écrit dans le `catalog:` du
`pnpm-workspace.yaml`**, jamais dans une app. Les apps y renvoient par
`"typescript": "catalog:"`. Sans ça, deux apps peuvent tourner sur deux Biome,
avec un `verifier` vert dans l'une et rouge dans l'autre. Une dépendance propre à
une app (`express`, `publicodes`, `xlsx`) reste chez elle.

**pnpm ne résout pas les dépendances fantômes.** Un paquet utilisé sans être
déclaré marchait sous npm, par hoisting. Ici il casse.

Exemple : `glossaire-notion` compilait avec `types: ["node"]` sans avoir jamais
listé `@types/node`. La correction est toujours de déclarer la dépendance.

**Avant de toucher à `apps/X`, lis `apps/X/AGENTS.md`.** Ce fichier-ci ne décrit
aucune app.

| App | Ce que c'est |
|---|---|
| `apps/simulateur-eligibilite` | Le produit. Simulateur d'éligibilité au transport sanitaire : règles publicodes, front React/DSFR, backend Express, rattachement à un établissement et un service, remplissage du CERFA. |
| `apps/data-analyzer` | L'ETL qui calcule la part des trajets réalisés via les plateformes. Code public, **données et fournisseurs privés**. |
| `apps/glossaire-notion` | Une extension de navigateur qui affiche le glossaire tenu dans Notion. |
| `apps/cli` | `tsp`, le point d'entrée du dépôt. Sans dépendance d'exécution, **sans tests**. |

## `tsp`, le point d'entrée

**Tout geste sur le dépôt passe par `tsp`**, la CLI d'`apps/cli`. Sur une
machine neuve, `apps/cli/bin/tsp setup` installe `mise`, le toolchain, les dépendances, les
hooks, et rend `tsp` appelable de partout.

| Besoin | Commande |
|---|---|
| Lancer une action sur une app | `tsp <install\|build\|start\|test\|dev\|verifier> [app]` |
| Savoir ce qu'une app sait faire | `tsp apps`, `tsp features [app]` |
| Lire les règles, les skills, la doc | `tsp rules [recueil\|id]`, `tsp skills [skill]`, `tsp docs [app]` |
| Voir le travail en cours, à prendre | `tsp wip`, `tsp next` |
| Voir où en est un chantier | `tsp issue list`, `tsp issue show <n>` |
| Tenir un chantier | `tsp issue new`, `tsp issue add`, `tsp issue sync` |
| Ouvrir un outil du projet (site, préprod, hébergeur) | `tsp open [outil]` |
| Brancher, proposer | `tsp branch <type>/<sujet> [--issue <n>]`, `tsp pr`, `tsp pr status` |
| Diagnostiquer la machine | `tsp doctor` |

`tsp help` les liste toutes. Les commandes de lecture acceptent `--json`.
Sans app, une action passe sur toutes les apps qui la portent, une à la fois.
`dev` et `start` ne rendent pas la main : ils demandent une app dès que
plusieurs les portent.

## Vérifier

`tsp verifier <app>`. **C'est la commande à passer avant de dire que c'est
fait.** Elle lance le script `verifier` de l'app, et la CI lance exactement le
même : un `verifier` vert ici l'est là-bas. Une porte à ajouter se met dans ce
script, jamais dans le YAML.

`tsp verifier` sans app le passe sur toutes les apps, une à la fois.

La CI et le `Procfile` appellent `pnpm` en direct, pas `tsp` : la production ne
dépend pas de la CLI.

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
l'industrie nomme déjà ainsi. Le franciser produit des mots que personne n'emploie.

| En anglais | Exemples |
|---|---|
| les composants d'interface | `TextField`, `SelectField`, `Stepper`, `Container`, `Footer`, `RattachementForm` |
| les écrans | `RattachementScreen`, `SeedsScreen`, `SimulateurScreen` |
| la mécanique du questionnaire | `Questionnaire`, `QuestionnaireState`, `Answer`, `draft`, `lockedAnswers`, `askedIf`, `dependsOn` |
| la navigation et l'état | `screen`, `goTo`, `restart`, `state` |
| ce qu'une API tierce nomme | `useX`, `Props`, `track*`, `nativeInputProps`, `rowId` |

Un nom qui mêle les deux garde le terme métier tel quel et met le reste en
anglais : `RattachementForm`, `SeedsTable`, `seedAnswers`.

Aucun test ne garde cette règle : elle se tient à la relecture.

**Deux dérogations assumées.** `apps/cli` écrit ses identifiants techniques en
anglais et garde le français pour le métier (`recueil`, `tache`, `etat`) : voir
son `AGENTS.md`. Et `apps/glossaire-notion` est entièrement en anglais.
Elle n'a pas de vocabulaire métier propre. C'est un lecteur de base Notion, et la
franciser coûterait plus que ça ne clarifierait.

## Écrire du code et commiter

24 règles numérotées vivent dans `docs/knowledge/contributing/`. **À lire avant
d'écrire une ligne ou de commiter.**

| Fichier | Ce qu'il porte |
|---|---|
| [`regles-de-code.md`](docs/knowledge/contributing/regles-de-code.md) | les 17 `QUAL-*` : forme d'un fichier, découpage, noms, exports, suppressions de lint |
| [`regles-git.md`](docs/knowledge/contributing/regles-git.md) | les 7 `GIT-*` : branche et PR vers `staging`, forme du message, métadonnée d'IA, confidentialité |
| [`ecrire-une-regle.md`](docs/knowledge/contributing/ecrire-une-regle.md) | le format d'une règle, pour en ajouter, modifier ou retirer une |

Chaque règle porte un identifiant, sa raison, un exemple juste, un exemple faux,
et la garde qui l'applique. **Ne les recopie pas ici.** Cite l'identifiant en
revue et en commit : « corrige QUAL-006 ».

## Où écrire quoi

| Ce que tu veux écrire | Où ça va |
|---|---|
| Une décision d'architecture | `docs/knowledge/adr/` de l'app concernée, ou celui de la racine si la décision traverse plusieurs apps. Format ADR maison, au niveau composant C4, sans détail de fichier |
| Le cadrage d'un chantier | le corps de son issue GitHub, que `tsp issue new` ouvre. Jamais un fichier du dépôt |
| Le découpage d'un chantier | ses sous-issues, une par PR, que `tsp issue add` ouvre |
| L'état d'un chantier | **nulle part** : il se déduit de l'issue, de sa branche et de sa PR. `tsp issue show <n>` l'affiche, et `tsp` le projette dans le tableau GitHub Project |
| Ce qu'une app sait faire | son `docs/knowledge/features.md`, un tableau « feature, ce qu'elle fait » que lit `tsp features` |
| Une connaissance métier actée | `docs/knowledge/domain/` de l'app concernée, ou celui de la racine si elle traverse plusieurs apps |
| Le mode d'emploi d'une app | son `README.md` |
| Ce qu'une version apporte | le `CHANGELOG.md` de l'app. Un TL;DR, puis une ligne par commit groupée par type |
| Une règle pour l'IA | `AGENTS.md`, celui de la racine ou celui de l'app |
| Une règle de code ou de commit | `docs/knowledge/contributing/`, au format de [`ecrire-une-regle.md`](docs/knowledge/contributing/ecrire-une-regle.md) |
| Une garde | **un test**, pas une phrase |

Ce que `docs/knowledge/` contient aujourd'hui ne se recopie pas ici : liste les
dossiers `adr/` et `domain/` de la racine et de chaque app plutôt que de te fier
à un inventaire, qui se périmerait au premier fichier ajouté ou déplacé.

**Quand deux sources se contredisent**, l'ordre d'autorité est :

**le test > le code > le README de l'app > `docs/knowledge/adr/` > `docs/knowledge/domain/`**

Cette chaîne classe ce qui *décrit* le dépôt. `AGENTS.md` et
`docs/knowledge/contributing/` *prescrivent*. Ils ne se périment pas contre le
code : c'est le code qui a tort contre eux.

Les specs se périment. Exemple : `etl-part-plateformes.md` annonce 5 marts, le
README de `data-analyzer` en documente 6. Corrige la source la moins à jour, ne
t'y fie pas.

## Marches à suivre

Sept gestes récurrents ont leur mode d'emploi dans `.claude/skills/`, chargé à la
demande plutôt que recopié ici :

| Skill | Quand |
|---|---|
| `regle-de-contribution` | Ajouter, modifier ou retirer une règle de `docs/knowledge/contributing/` : identifiant, raison, deux exemples, garde nommée |
| `regle-publicodes` | Toucher au modèle d'éligibilité : les quatre endroits qu'une règle traverse, et l'encodage des choix multiples en mosaïque |
| `situation-de-reference` | Couvrir un cas métier : il va dans le catalogue de seeds, pas dans un fichier de test |
| `implement-publicodes-version` | Intégrer une version du modèle livrée par l'éditeur : le diff du paquet, le contrat, les seeds, la recette portée, le retour à l'éditeur |
| `doc-architecture` | Écrire ou réviser un document de `docs/knowledge/adr/` : format ADR maison, décisions révoquées conservées et barrées |
| `livrer-une-version` | Livrer une app : numéro, journal des versions, tag `<app>@<version>` et release GitHub, qui vont ensemble |
| `revue-d-une-issue` | Revoir une issue et sa PR : fonctionnel puis technique, écarts à l'issue, couverture, cahier de tests à cocher, app lancée à la tête de la PR, verdict |

## Toute règle nomme sa garde

**Une règle de forme nomme l'assertion qui la garde. Sans assertion, elle
n'existe pas.** Mieux vaut l'écrire dans un test que la répéter ici.

Exemple : neuf fichiers ouvraient sur un `import` pendant des mois, sous une
règle qui l'interdisait, parce que rien ne la vérifiait.

Une règle de jugement, elle, ne se mécanise pas. Une assertion dirait *qu'*on a
coupé, jamais *si* on a coupé au bon endroit. Elle écrit alors `*Aucune garde.*`
en toutes lettres, plutôt que de laisser croire qu'elle en a une.

L'état de chaque règle des 24 de
[`docs/knowledge/contributing/`](docs/knowledge/contributing/) se lit dans la
colonne « Garde » de son tableau, pas ici : recopier cet état dans ce fichier
créerait deux sources à tenir à jour au lieu d'une.
