# tsp

`tsp` (pour « transport sanitaire ») est le point d'entrée du dépôt. Il ne fait
que ce que `pnpm`, `gh` et `git` ne font pas : préparer la machine, ouvrir les
outils du projet, tirer une branche de `staging`, ouvrir une PR vers `staging`.

## Installer

Sur une machine neuve, depuis la racine du dépôt :

```bash
apps/cli/bin/tsp setup
```

C'est la seule fois où le chemin complet sert : `setup` rend ensuite `tsp`
appelable de partout.

Seuls un shell et `git` sont requis. `setup` installe `mise` s'il manque, après
confirmation, puis le toolchain de `mise.toml`, les dépendances, les hooks git, les
fichiers locaux manquants (les `.env` des apps et la liste des outils) et un lien
`~/.local/bin/tsp`. Il finit par `tsp doctor`. Un lien qui marche déjà est gardé :
`setup` lancé depuis un worktree ne le détourne pas.

Il se rejoue sans risque. Un agent passe `--yes` pour ne recevoir aucune question.

## Commandes

| Commande | Ce qu'elle fait |
|---|---|
| `tsp setup` | prépare la machine |
| `tsp doctor` | dit ce qui manque, et la commande qui le répare |
| `tsp open` | liste les outils du projet |
| `tsp open <outil> […]` | ouvre un ou plusieurs outils dans le navigateur |
| `tsp branch <type>/<sujet>` | tire une branche de `staging` |
| `tsp pr` | pousse la branche et ouvre la PR vers `staging` |

`tsp help` affiche cette liste. `doctor` et `open` acceptent `--json`.

**Le reste n'est plus dans `tsp`.** Une commande retirée répond par ce qui la
remplace.

| Besoin | Geste |
|---|---|
| lancer une action d'une app | `pnpm --filter <app> <script>`, par exemple `pnpm --filter simulateur-eligibilite dev` |
| vérifier une app | `pnpm --filter <app> verifier` |
| lire les règles, les skills, la doc | ouvrir les fichiers : `docs/knowledge/contributing/`, `.claude/skills/`, `docs/knowledge/` |
| état d'une PR et de sa CI | `gh pr view`, `gh pr checks` |
| suivre un chantier | son ticket Notion, tenu à la main |

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

## Les branches et les PR

```bash
tsp branch fix/libelle-article-80
tsp pr
```

- `branch` refuse un type hors Conventional Commits. Le nom est
  `<type>/<sujet>`, sans numéro d'issue.
- `pr` vise toujours `staging` (GIT-009). Son titre est le sujet du premier
  commit de la branche, ou `--title`. Il doit respecter GIT-003.
- `--body-file <fichier>` donne le corps de la PR. Un chemin relatif part du
  dossier courant. Sans lui, le corps est celui des commits. Le corps cite le
  ticket Notion du chantier.
- La fusion reste un geste humain sur GitHub.

## Comment c'est fait

Le lanceur, `bin/tsp`, est un script shell. Il choisit le clone, puis exécute
`src/main.ts` par `mise`, qui fournit Node. La CLI est du TypeScript exécuté
directement, sans build et sans dépendance d'exécution.

- **Depuis un worktree**, `tsp` exécute la CLI de ce worktree. On essaie donc la
  version qu'on modifie.
- **Hors de tout clone**, il retombe sur celui d'où il a été installé.
- **Sans `mise`**, seul `setup` passe : c'est lui qui l'installe, par
  `bin/setup.sh`, le seul morceau de `setup` écrit en shell.
- **Aucune dépendance d'exécution.** Les arguments se lisent avec
  `node:util.parseArgs`. N'en ajoute pas : la CLI doit démarrer sur un dépôt dont
  les dépendances ne sont pas encore installées.

**Pourquoi un lanceur shell.** `tsp` doit être le premier geste sur une machine
neuve, alors que Node vient de `mise` : la CLI ne peut pas s'amorcer elle-même.
Un `bin` de paquet n'existerait qu'après `pnpm install`. Un binaire compilé
demanderait un build par plateforme pour une CLI interne. Le Node déjà présent
sur la machine n'a pas de version garantie, et l'exécution directe de
TypeScript en dépend.

La CI et le `Procfile` appellent `pnpm` en direct : une panne de la CLI ne casse ni
un déploiement ni une CI. Une commande n'entre dans `tsp` que si ni `pnpm`, ni `gh`,
ni `git`, ni la lecture d'un fichier ne fait le même geste (ADR-0010).

## Ce qu'il ne faut pas casser

| Invariant | Pourquoi |
|---|---|
| Une erreur prévue rend un code non nul et une ligne sur stderr | un agent lit le code de sortie, pas le texte |
| Une commande retirée dit ce qui la remplace, et rend un code non nul | un agent habitué à l'ancienne CLI sait où aller |
| La cible d'une PR est `staging`, sans option pour en changer | c'est ce qui applique GIT-009 |
| `tsp` ne lit ni n'écrit dans Notion ni dans les issues | le suivi se tient à la main (ADR-0009) |
| `setup` se rejoue sans risque | il sert aussi à réparer |
| La liste des outils de `tsp open` n'entre jamais dans git | elle nomme l'infrastructure, le dépôt est public |

## Langue

Les noms de commande sont en anglais, comme les scripts `pnpm`. L'aide, les sorties et
les commentaires sont en français. Les identifiants du code sont en anglais : la CLI
n'a aucun terme métier à nommer, la règle française du dépôt n'a donc rien à y régler
(voir [`travailler-dans-le-depot.md`](../../docs/knowledge/contributing/travailler-dans-le-depot.md)).

## Vérifier

```bash
pnpm --filter cli verifier
```

Lint, typecheck et knip. **L'app n'a pas de tests, par décision du porteur**
(ADR-0005) : n'en ajoute pas sans qu'il le demande. Une commande se vérifie donc
en la lançant.

- Les gardes `lisibilite` et `architecture` du simulateur ne couvrent pas ce
  dossier. Biome y garde seul les limites de 30 et 300 lignes.
- Les décisions sont dans [`docs/knowledge/adr/`](../../docs/knowledge/adr/) de la
  racine : ADR-0005, 0009 et 0010.
