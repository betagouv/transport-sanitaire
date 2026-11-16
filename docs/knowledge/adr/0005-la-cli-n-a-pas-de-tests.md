# ADR-0005 - Pas de tests sur la CLI

> Statut : **décidé** · 2026-10-12 · Anciennement ADR-5 de `cli.md`

**Décision.** Par choix du porteur, `apps/cli` n'a pas de tests. Son `verifier`
passe le lint, le typecheck et knip.

**Conséquences.**

- Une régression d'une commande se voit à l'usage, pas en CI.
- Les gardes de forme écrites en tests dans le simulateur ne couvrent pas la
  CLI. Seul Biome y garde les limites de taille.
- L'adresse de l'API Notion se remplace par l'environnement : c'est ce qui
  permet d'éprouver la synchronisation à la main, sur un serveur local.

## Risques

| Id | Risque | État |
|---|---|---|
| R-4 | Sans tests, une régression ne se voit qu'à l'usage | Assumé (ADR-0005) |
