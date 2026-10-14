# tsp

`tsp` (pour « transport sanitaire ») est le point d'entrée du dépôt. Il rassemble
ce qui demandait de retenir `mise`, `pnpm`, `git`, `gh`, les issues GitHub et
Notion.

## Installer

Sur une machine neuve, depuis la racine du dépôt :

```bash
apps/cli/bin/tsp setup
```

C'est la seule fois où le chemin complet sert : `setup` rend ensuite `tsp`
appelable de partout.

Seuls un shell et `git` sont requis. `setup` fait le reste, dans l'ordre :

1. propose d'installer `mise` s'il manque, après confirmation ;
2. installe le toolchain épinglé dans `mise.toml` (Node, pnpm, `gh`) ;
3. installe les dépendances ;
4. branche les hooks git ;
5. crée les fichiers locaux manquants depuis leurs gabarits : les `.env` et
   la liste des outils ;
6. pose un lien `~/.local/bin/tsp`, pour appeler `tsp` de partout. Un lien qui
   marche déjà est gardé : `setup` lancé depuis un worktree ne le détourne pas ;
7. finit par `tsp doctor`.

Il se rejoue sans risque. Un agent passe `--yes` pour ne recevoir aucune
question.

## Les commandes

Par app, sous la forme `tsp <action> [app]` :

| Commande | Ce qu'elle fait |
|---|---|
| `tsp install [app]` | installe les dépendances |
| `tsp build [app]` | construit l'app |
| `tsp start [app]` | lance la version de production |
| `tsp test [app]` | lance les tests |
| `tsp dev [app]` | lance le serveur de développement local |
| `tsp verifier [app]` | passe la porte : lint, typecheck, knip, tests, build |
| `tsp features [app]` | liste les features de l'app |

Transverses :

| Commande | Ce qu'elle fait |
|---|---|
| `tsp setup` | prépare la machine |
| `tsp doctor` | dit ce qui manque, et la commande qui le répare |
| `tsp apps` | liste les apps, leur version, leurs actions |
| `tsp rules` | liste les recueils de règles |
| `tsp rules git` | liste les règles d'un recueil |
| `tsp rules GIT-009` | affiche une règle entière |
| `tsp skills` | liste les skills du dépôt |
| `tsp skills <skill>` | affiche un skill |
| `tsp docs [app]` | liste les ADR et les connaissances métier |
| `tsp open` | liste les outils du projet |
| `tsp open <outil> […]` | ouvre un ou plusieurs outils dans le navigateur |
| `tsp wip` | montre le travail en cours |
| `tsp next` | montre le travail en cours, puis le travail à prendre |
| `tsp issue list` | liste les chantiers ouverts, avec leur avancement |
| `tsp issue show <n>` | montre un chantier en arbre : l'état de chaque tâche, sa branche, son worktree, sa PR |
| `tsp issue new <type> <titre>` | ouvre un chantier, `--app <app>` pour l'étiqueter à une app |
| `tsp issue add <n> <titre>` | ajoute une tâche à un chantier, `--blocked-by <n,…>` pour ce qui la bloque |
| `tsp issue sync [n]` | projette le tableau des chantiers, puis crée ou met à jour le ticket Notion d'un chantier |
| `tsp branch <type>/<sujet>` | tire une branche de `staging`, `--issue <n>` pour celle d'une tâche |
| `tsp pr` | pousse la branche et ouvre la PR vers `staging` |
| `tsp pr status` | montre l'état de la PR courante et de sa CI |

`tsp help` affiche cette liste. Les commandes de lecture acceptent `--json`.
`tsp rules --json` rend chaque recueil avec ses règles.

## Les apps et leurs actions

Une app se nomme en entier ou par un début sans ambiguïté : `simulateur`,
`data`, `glossaire`, `cli`.

**Une action est un script du `package.json` de l'app.** `tsp dev glossaire`
lance son script `dev`. Pour qu'une app porte une action, il suffit d'écrire le
script. `install` fait exception : il appelle `pnpm install`.

| Cas | Ce qui se passe |
|---|---|
| l'app nommée ne porte pas l'action | un message, code de sortie 1 |
| sans app | l'action passe sur chaque app qui la porte, une à la fois. Les autres sont sautées, une ligne le dit |
| `dev` ou `start` sans app, portées par plusieurs apps | `tsp` demande d'en nommer une : ces actions ne rendent pas la main |

Ce qui suit `--` part tel quel au script :

```bash
tsp test simulateur -- tests/cerfa
```

## Les outils du projet

`tsp open` ouvre ce qu'on va chercher dix fois par semaine : le site, la
préprod, les tableaux de bord de l'hébergeur, le DNS, Notion, GitHub.

```bash
tsp open                 # la liste : nom, ce que c'est, adresse
tsp open admin           # ouvre un outil
tsp open preprod dns     # en ouvre plusieurs
```

Un outil se nomme en entier ou par un début sans ambiguïté. L'adresse est
toujours affichée : si rien ne s'ouvre, elle se copie.

**La liste n'est pas versionnée.** Elle vit dans `apps/cli/tools.json`, ignoré
par git, parce qu'elle nomme l'infrastructure du projet et que le dépôt est
public. `tsp setup` la crée depuis `tools.example.json`. Chaque entrée porte
trois champs :

```json
{ "name": "preprod", "description": "La préprod du simulateur", "url": "https://…" }
```

Le fichier se transmet entre membres de l'équipe hors du dépôt. Il n'existe que
dans le clone où il a été posé : un worktree n'en hérite pas.

## Le travail en cours et à prendre

| Source | `tsp wip` | `tsp next` |
|---|---|---|
| issues GitHub | les chantiers commencés, avec leurs tâches en cours | les tâches que rien ne bloque et que personne n'a commencées |
| GitHub | les PR ouvertes | |
| git | « Sans issue » : les branches et les worktrees qu'aucune issue ne suit | |
| Notion | `Doing Dev`, `Reviewing dev` | `Ready To Dev` |

`tsp next` affiche d'abord tout ce qu'affiche `tsp wip`, puis sa propre colonne :
on ne choisit pas la suite sans voir ce qui est déjà commencé. En JSON, le
travail en cours est sous la clé `wip`.

Un ticket lié à un chantier n'apparaît qu'une fois, du côté des chantiers.

## Les chantiers

Un chantier est une issue GitHub, ses tâches sont ses sous-issues. Une tâche
tient en une PR. **L'état ne s'écrit nulle part**, il se déduit :

| État | Condition |
|---|---|
| à faire | l'issue est ouverte, sans branche ni PR |
| bloquée | une issue qui la bloque est ouverte |
| en cours | une branche ou une PR ouverte la sert |
| fait | l'issue est fermée |
| abandonnée | l'issue est fermée comme non prévue |

Une branche sert l'issue dont elle porte le numéro, `feat/51-adresse` pour la
51. À défaut, c'est la PR que GitHub lie à l'issue qui désigne la branche.

```bash
tsp issue list
tsp issue show 42
```

```
#42 v10 : Intégration de la v10  en cours 14/23
  #51 Adresse                   en cours        feat/51-adresse  .claude/worktrees/v10-adresse  PR #60
  #52 Validation croisée        bloquée par #51
  #53 Décision                  à faire
```

Un chantier étiqueté `brouillon` n'est pas fini de cadrer : `tsp next` ne le
propose pas, et il n'a pas de ticket Notion. L'étiquette se pose et se retire
sur GitHub.

Le décompte ne porte que sur les tâches, pas sur les issues qui les
regroupent, et laisse de côté les abandonnées.

### Tenir un chantier

```bash
tsp issue new feat "v10 : Intégration de la v10" --app simulateur   # le chantier
tsp issue add 42 "Adresse"                                    # une tâche, « v10 - Adresse »
tsp issue add 42 "Validation croisée" --blocked-by 51         # une tâche bloquée
tsp branch feat/adresse --issue 51                            # feat/51-adresse
tsp pr                                                        # « Closes #51 »
```

- Le corps vient des gabarits de `.github/ISSUE_TEMPLATE/`, ou de
  `--body-file`. Le cadrage du chantier s'écrit dans son issue.
- `new` pose le type et l'app en étiquettes, et crée celles qui manquent.
- Une tâche peut avoir ses propres tâches : `tsp issue add 51 …`.
- **Le titre d'une tâche commence par le nom court de ses parents** :
  `v10 - Chantier 07 - Écrire les seeds des cas d'oracle`. Il se lit ainsi
  seul, dans une notification ou une recherche. `add` pose ce préfixe, et
  `show` ne le répète pas dans l'arbre.
- Le nom court d'une issue est ce qui précède ` : ` dans son titre. Un
  chantier se nomme donc `v10 : Intégration de la v10`.
- `branch --issue` refuse une issue inconnue ou fermée.
- **La fusion de la PR ferme l'issue.** GitHub ne le fait que pour une PR vers
  `main` : le workflow `close-issue.yml` s'en charge, d'après le numéro que
  porte la branche. Un chantier, lui, se ferme à la main.

### Le tableau

Le GitHub Project « Transport Sanitaire » de l'organisation montre les issues en
kanban. Il est privé. **`tsp` est seul à y écrire une colonne**, d'après l'état
qu'il déduit : une carte déplacée à la main reprend sa place à la projection
suivante.

| Issue | Colonne |
|---|---|
| à faire, étiquetée `brouillon` | Brouillon |
| à faire | À faire |
| bloquée | Bloquée |
| en cours | En cours |
| fait | Fait |
| abandonnée | archivée |

- `issue sync` projette tout le tableau, puis passe à Notion.
- `issue new`, `issue add`, `branch` et `pr` le projettent après leur geste, et
  le disent sur la sortie d'erreur en une ligne. Un échec du tableau ne fait
  pas échouer la commande.
- Une issue ouverte absente du tableau y est ajoutée. Une fermée hors du
  tableau n'y revient pas.
- Le Project ajoute de lui-même les sous-issues d'une carte, passe une issue
  fermée en `Fait`, et archive une carte faite depuis deux semaines.
- Le tableau ne bouge qu'avec un geste `tsp` : une issue que la fusion d'une
  autre débloque attend la projection suivante.

### Le ticket Notion

Notion ne porte que le suivi macro : **un ticket par chantier**, aucun pour
ses tâches. `tsp issue sync` le tient. L'issue fait foi, à sens unique.

| Chantier | `Status P&T` du ticket |
|---|---|
| étiqueté `brouillon` | pas de ticket |
| à faire, bloqué | `Ready To Dev` |
| en cours | `Doing Dev` |
| fait | `Staging` |
| abandonné | inchangé |

- À la création : le titre, le statut, le type `Tech`, l'adresse de l'issue,
  et dans le corps le « Problème » et la « Solution ». L'adresse du ticket est
  écrite dans l'issue, ligne `Notion :`.
- Pour un ticket qui existe déjà, écrire soi-même `Notion : <adresse>` dans
  l'issue : `sync` le reprend au lieu d'en créer un.
- Ensuite : le titre, le statut et l'adresse de l'issue. Le corps n'est jamais
  réécrit.
- Un statut ne recule jamais. `Reviewing dev` et `Prod / Done` se posent à la
  main dans Notion.
- Sans numéro, `sync` passe les chantiers ouverts, et les fermés qui ont un
  ticket.

## Les branches et les PR

```bash
tsp branch fix/libelle-article-80
tsp branch feat/adresse --issue 51
tsp pr
tsp pr status
```

- `branch` refuse un type hors Conventional Commits.
- `--issue <n>` glisse le numéro dans le nom, `feat/51-adresse`. C'est ce
  numéro qui rattache la branche à sa tâche, et qui ferme l'issue à la fusion.
- `pr` vise toujours `staging` (GIT-009). Son titre est le sujet du premier
  commit de la branche, ou `--title`. Il doit respecter GIT-003.
- `--body-file <fichier>` donne le corps de la PR. Un chemin relatif part du
  dossier courant. Sans lui, le corps est celui des commits. Sur la branche
  d'une issue, il se termine par `Closes #<n>`.
- La fusion reste un geste humain sur GitHub.

## Configuration

`tsp` lit l'environnement, puis le `.env` de la racine. `setup` le crée depuis
`.env.example`. Il n'est jamais versionné : le dépôt est public.

| Variable | Rôle |
|---|---|
| `NOTION_TOKEN` | le jeton d'une intégration Notion interne, avec lecture et écriture, partagée avec la base des tickets |
| `NOTION_DATABASE_ID` | l'identifiant de la base des tickets |
| `NOTION_API_URL` | facultatif. Remplace l'adresse de l'API, pour éprouver la CLI sur un serveur local |

Sans jeton, `wip` et `next` affichent le reste et la ligne
« Notion : jeton absent ». Seul `issue sync` s'arrête, après le tableau.

Le tableau demande le droit `project` sur le jeton de `gh` :

```bash
gh auth refresh -s project
```

## Comment c'est fait

Le lanceur, `bin/tsp`, est un script shell. Il choisit le clone, puis exécute
`src/main.ts` par `mise`, qui fournit Node. La CLI est du TypeScript exécuté
directement, sans build et sans dépendance d'exécution.

- **Depuis un worktree**, `tsp` exécute la CLI de ce worktree. On essaie donc la
  version qu'on modifie.
- **Hors de tout clone**, il retombe sur celui d'où il a été installé.
- **Sans `mise`**, seul `setup` passe : c'est lui qui l'installe, par
  `bin/setup.sh`, le seul morceau de `setup` écrit en shell.

La CI et le `Procfile` appellent `pnpm` en direct. La production ne dépend pas
de la CLI.

## Vérifier

```bash
tsp verifier cli
```

Lint, typecheck et knip. L'app n'a pas de tests : une commande se vérifie en la
lançant. Voir [AGENTS.md](AGENTS.md).
