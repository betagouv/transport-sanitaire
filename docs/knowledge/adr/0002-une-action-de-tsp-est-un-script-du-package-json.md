# ADR-0002 - Une action est un script du `package.json`

> Statut : **révoqué** · 2026-11-24 · Remplacé par l'ADR-0010 · décidé le 2026-10-12 · Anciennement ADR-2 de `cli.md`

> **Mise à jour 2026-11-24, `tsp` se réduit.** La décision est révoquée : les lanceurs et les commandes de lecture n'existent plus. L'ADR-0010 dit pourquoi.

> **Mise à jour 2026-11-24, la CI est la porte.** La CI ne lance plus le script
> `verifier` d'un bloc : elle en passe les étapes une à une, sous leur nom. Le
> script reste celui de l'app, et une porte ajoutée s'ajoute aussi à son job.

**Contexte.** Les apps ne savent pas faire les mêmes choses. Il faut que `tsp`
sache ce que chacune porte.

**Décision.** `tsp <action> <app>` lance le script du même nom. Une app porte
une action si le script existe. Il n'y a pas de manifeste dédié. Deux
exceptions : `install`, qui appelle `pnpm install`, et `features`, qui lit un
fichier.

**Écarté.** Un manifeste par app, qui aurait déclaré ses actions et ses
features. Il aurait doublé le `package.json`, et les deux auraient divergé.

**Conséquences.**

- Uniformiser une action revient à nommer un script : le simulateur et le
  glossaire ont gagné un script `dev`.
- `tsp` n'ajoute aucune porte. Le `verifier` d'une app reste son script, celui
  que lance la CI.
