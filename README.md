# Transport sanitaire

Le dépôt public du simulateur d'éligibilité au transport sanitaire et de ses
outils. C'est un monorepo en workspace pnpm : une seule installation, à la
racine, et un seul `pnpm-lock.yaml`. Le toolchain (Node, pnpm, `gh`) vient de
`mise`, déclaré dans [`mise.toml`](mise.toml).

## Les apps

| App | Ce que c'est |
|---|---|
| [`apps/simulateur-eligibilite`](apps/simulateur-eligibilite/README.md) | Le produit. Simulateur d'éligibilité au transport sanitaire : règles publicodes, front React/DSFR, backend Express, rattachement à un établissement et un service, remplissage du CERFA. |
| [`apps/datahub`](apps/datahub/README.md) | L'ETL qui calcule la part des trajets réalisés via les plateformes. Code public, **données et fournisseurs privés**. |
| [`apps/cli`](apps/cli/README.md) | `tsp`, la CLI du dépôt. Sans dépendance d'exécution, **sans tests**. |
| [`apps/dashboard`](apps/dashboard/README.md) | Le tableau de bord. Une coquille Vite, déployée par `DEPLOY_APP=dashboard`. |

Avant de toucher à une app, lis son `README.md` et, si elle en a un, son `AGENTS.md`.

## Les apps restent indépendantes

Aucune app n'en importe une autre. Chacune a son `package.json`, et les apps de code
ont leur job de CI et leur script `verifier`. Le workspace met en commun l'installation, pas les
frontières.

- **Une version d'outil partagé s'écrit dans le `catalog:`** du
  [`pnpm-workspace.yaml`](pnpm-workspace.yaml), jamais dans une app. Les apps y
  renvoient par `"typescript": "catalog:"`. Sans cela, deux apps peuvent tourner
  sur deux Biome, avec un `verifier` vert dans l'une et rouge dans l'autre. Une
  dépendance propre à une app (`express`, `publicodes`, `xlsx`) reste chez elle.
- **pnpm ne résout pas les dépendances fantômes.** Un paquet utilisé sans être
  déclaré marchait sous npm, par hoisting. Ici il casse : on le déclare.
- **`pnpm audit` ne se scope pas à une app** : il lit le lock, et le lock est
  unique au dépôt. Il a son job de CI, à la racine.

## Commandes

| Commande | Ce qu'elle fait |
|---|---|
| `pnpm verifier` | passe le `verifier` de chaque app, l'une après l'autre |
| `pnpm --filter <app> <script>` | lance une action d'une app, par exemple `pnpm --filter simulateur-eligibilite dev` |
| `pnpm --filter <app> verifier` | vérifie une app : lint, typecheck, knip, tests, build, selon l'app |
| `pnpm agents` | régénère les quatre `AGENTS.md` depuis leurs sources (ADR-0011) |
| `pnpm audit` | audite les dépendances du lock unique |
| `tsp` | prépare la machine, ouvre les outils, tire une branche, ouvre la PR : voir [`apps/cli`](apps/cli/README.md) |

La CI et le `Procfile` appellent `pnpm`, jamais `tsp` : la production ne dépend
pas de la CLI. Ce qu'on lance avant de pousser, et pourquoi, est dans
[`travailler-dans-le-depot.md`](docs/knowledge/contributing/travailler-dans-le-depot.md).

## Où lire la suite

- [`docs/knowledge/CONTEXT.md`](docs/knowledge/CONTEXT.md) : le vocabulaire du dépôt.
- [`docs/knowledge/contributing/`](docs/knowledge/contributing/) : écrire du
  code, commiter, livrer, écrire une règle ou une décision.
- [`docs/knowledge/adr/`](docs/knowledge/adr/) : les décisions d'architecture
  qui traversent plusieurs apps.
- [`.claude/skills/`](.claude/skills/) : trois marches à suivre, chargées à la demande.
- Chaque app a son `README.md`. Le simulateur et datahub ont aussi leur dossier `docs/knowledge/`.
