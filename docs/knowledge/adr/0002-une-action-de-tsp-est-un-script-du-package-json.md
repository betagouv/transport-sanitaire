# ADR-0002 - Une action est un script du `package.json`

> Statut : **décidé** · 2026-10-12 · Anciennement ADR-2 de `cli.md`

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
