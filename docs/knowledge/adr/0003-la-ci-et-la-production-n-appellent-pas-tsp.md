# ADR-0003 - La CI et la production n'appellent pas `tsp`

> Statut : **décidé** · 2026-10-12 · Anciennement ADR-3 de `cli.md`

**Décision.** La CI et le `Procfile` appellent `pnpm` en direct. `tsp` remplace
les tâches `mise`, qui n'étaient qu'un autre point d'entrée pour un humain.

**Conséquences.** Une panne de la CLI ne casse ni un déploiement ni une CI.
« La CI lance la même commande que localement » reste vrai, puisque `tsp`
délègue au même script.
