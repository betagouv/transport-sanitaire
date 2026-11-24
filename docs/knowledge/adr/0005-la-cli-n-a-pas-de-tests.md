# ADR-0005 - Pas de tests sur la CLI

> Statut : **décidé** · 2026-10-12 · Anciennement ADR-5 de `cli.md`

**Décision.** Par choix du porteur, `apps/cli` n'a pas de tests. Son `verifier`
passe le lint, le typecheck et knip.

**Conséquences.**

- Une régression d'une commande se voit à l'usage, pas en CI.
- Les gardes de forme écrites en tests dans le simulateur ne couvrent pas la
  CLI. Seul Biome y garde les limites de taille.

## Risques

| Id | Risque | État |
|---|---|---|
| R-4 | Sans tests, une régression ne se voit qu'à l'usage | Assumé (ADR-0005) |

> **Mise à jour 2026-11-24, `tsp` se réduit.** La CLI ne parle plus à Notion : il
> n'y a plus de synchronisation à éprouver sur un serveur local. Voir l'ADR-0010.
