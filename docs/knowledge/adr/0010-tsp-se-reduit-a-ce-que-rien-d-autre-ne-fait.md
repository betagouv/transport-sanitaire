# ADR-0010 - `tsp` se réduit à ce que rien d'autre ne fait

> Statut : **décidé** · 2026-11-24 · Remplace les ADR-0002 et ADR-0006

**Contexte.** Les agents passaient 4 à 100 fois plus souvent par `pnpm`, `gh` et
`git` que par `tsp`. Les lanceurs doublaient les scripts `pnpm`, les commandes
de lecture doublaient la lecture d'un fichier, et le suivi des chantiers part
dans Notion (ADR-0009).

**Décision.** `tsp` garde cinq commandes, plus `help`.

| Commande | Ce qu'elle fait |
|---|---|
| `setup`, `doctor` | préparer et diagnostiquer la machine |
| `open` | ouvrir les outils du projet |
| `branch <type>/<sujet>` | tirer une branche de `staging` |
| `pr` | pousser et ouvrir la PR vers `staging` |

Le reste se fait en direct : `pnpm --filter <app> <script>` pour une action
d'app, `gh` pour GitHub, la lecture du fichier pour les règles, les skills et la
documentation. Une commande retirée répond par un message qui dit ce qui la
remplace, et un code de sortie non nul.

**Conséquences.**

- Il n'y a plus de réglage ni de secret propre à la CLI : le jeton Notion et le
  `.env` de la racine disparaissent.
- Une action d'app reste un script de son `package.json`. Rien ne l'enveloppe.
- Les fichiers `features.md` des apps restent de la documentation, que rien ne
  liste plus.
