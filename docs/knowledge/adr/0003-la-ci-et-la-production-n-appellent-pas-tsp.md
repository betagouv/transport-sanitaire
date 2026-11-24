# ADR-0003 - La CI et la production n'appellent pas `tsp`

> Statut : **décidé** · 2026-10-12 · Anciennement ADR-3 de `cli.md`

> **Mise à jour 2026-11-24, la CI est la porte.** La CI appelle toujours `pnpm`,
> mais les étapes du `verifier` une à une, plus le script d'un bloc.

**Décision.** La CI et le `Procfile` appellent `pnpm` en direct. `tsp` remplace
les tâches `mise`, qui n'étaient qu'un autre point d'entrée pour un humain.

**Conséquences.** Une panne de la CLI ne casse ni un déploiement ni une CI.
« La CI lance la même commande que localement » reste vrai, puisque `tsp`
délègue au même script.

> **Mise à jour 2026-11-24, `tsp` se réduit.** `tsp` ne lance plus les scripts
> des apps : on écrit `pnpm --filter <app> <script>`. La CI et le `Procfile`
> appelaient déjà `pnpm`, la décision tient. Voir l'ADR-0010.
