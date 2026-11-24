# ADR-0006 - Les commandes de lecture ne possèdent rien

> Statut : **révoqué** · 2026-11-24 · Remplacé par l'ADR-0010 · décidé le 2026-10-12 · Anciennement la section 4 de `cli.md`

> **Mise à jour 2026-11-24, `tsp` se réduit.** La décision est révoquée : les lanceurs et les commandes de lecture n'existent plus. L'ADR-0010 dit pourquoi.

Aucune commande de lecture ne tient de donnée à elle. Chacune affiche ~~un
fichier que le dépôt tient déjà~~ ce qu'une source tient déjà : un fichier du
dépôt, ou GitHub pour les chantiers.

| Commande | Ce qu'elle lit |
|---|---|
| `features` | le `features.md` de chaque app |
| `rules` | les recueils de `docs/knowledge/contributing/` |
| `skills` | les skills du dépôt |
| `docs` | les dossiers `adr/` et `domain/` |
| `issue list`, `issue show` | les issues GitHub, les branches et les worktrees de git |
| `wip`, `next` | ~~les trackers, `docs/tasks`,~~ les issues, git, GitHub et Notion |
| `open` | la liste des outils, un fichier local jamais versionné |

Corriger ce que `tsp` affiche, c'est donc corriger la source : le fichier, ou
l'issue. L'état d'une tâche, lui, ne se corrige pas : il change quand sa branche
naît et quand sa PR est fusionnée.

`open` est la seule dont la source n'est pas dans le dépôt. Sa liste nomme
l'infrastructure du projet (hébergement, DNS, administration), et le dépôt est
public : elle suit le même régime que le `.env`, avec un gabarit neutre. Seul
`features.md` a été créé pour la CLI : rien ne décrivait les features d'une app.
Il se tient à la main et rien ne le garde.

## Risques

| Id | Risque | État |
|---|---|---|
| R-3 | `features.md` se périme sans garde | Assumé |
