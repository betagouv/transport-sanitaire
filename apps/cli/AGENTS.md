# AGENTS.md - cli

> Les conventions du dépôt sont dans [`../../AGENTS.md`](../../AGENTS.md). Ici,
> ce qui est propre à cette app.

`tsp`, le point d'entrée du dépôt. Le mode d'emploi est dans le
[README](README.md), les décisions dans
[`docs/knowledge/adr/`](../../docs/knowledge/adr/) (ADR-0001, 0003, 0005, 0009
et 0010).

## Ce que c'est

- **Un lanceur shell**, `bin/tsp`. Il choisit le clone, puis exécute la CLI par
  `mise`. Il ne demande qu'un shell et `git`. `setup` pose un lien vers lui dans
  `~/.local/bin` : c'est ce lien qu'on appelle ensuite.
- **Du TypeScript exécuté directement par Node 24**, sans build, comme
  `datahub`.
- **Aucune dépendance d'exécution.** Les arguments se lisent avec
  `node:util.parseArgs`. N'en ajoute pas : la CLI doit démarrer sur un dépôt dont
  les dépendances ne sont pas encore installées.
- **Cinq commandes**, pas une de plus sans raison : `setup`, `doctor`, `open`,
  `branch`, `pr`. Une commande n'entre que si ni `pnpm`, ni `gh`, ni `git`, ni la
  lecture d'un fichier ne fait le même geste.

## Pas de tests

**Cette app n'a pas de tests, par décision du porteur.** N'en ajoute pas sans
qu'il le demande.

- `pnpm verifier` passe le lint, le typecheck et knip.
- Les gardes `lisibilite` et `architecture` du simulateur ne couvrent pas ce
  dossier. Biome y garde seul les limites de 30 et 300 lignes.
- Une commande se vérifie donc en la lançant.

## Les modules

`src/` est rangé par module : `core/` (la ligne de commande, les sorties), `apps/`,
`git/` et `machine/`. **Les dépendances ne vont que dans ce sens** : `core` n'importe
aucun module, `git` et `machine` n'importent que `core` (et `apps`, pour
`machine`), et aucun module n'importe `machine`. Rien ne le garde : c'est à la
relecture.

Une commande de lecture passe par `emit`, pour répondre à `--json`. Une commande
rend un code de sortie, et s'inscrit dans `src/commands.ts`, d'où vient l'aide.

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

Les noms de commande sont en anglais, comme les scripts `pnpm`. L'aide et les
sorties sont en français. Dans le code, le technique est en anglais et le
métier en français.
