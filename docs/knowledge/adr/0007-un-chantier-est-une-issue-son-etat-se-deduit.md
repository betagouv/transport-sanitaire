# ADR-0007 - Un chantier est une issue, son état se déduit

> Statut : **révoqué** · 2026-11-24 · Remplacé par l'ADR-0009 · décidé le 2026-10-13 · Anciennement ADR-6 de `cli.md`

> **Mise à jour 2026-11-24, le suivi passe dans Notion.** La décision est révoquée. Un chantier est un ticket Notion tenu à la main, sans issue GitHub ni tableau. L'ADR-0009 dit pourquoi.

**Contexte.** Le cadrage vivait dans `docs/specs`, le découpage dans
`docs/tasks`, l'état dans les deux, en prose. Sur un gros chantier, l'état
suivait la branche : invisible depuis `staging`, et recopié dans chaque
worktree. Aucune PR n'était rattachée à une tâche. On ne voyait ni ce qui était
fait, ni ce qui restait.

**Décision.** GitHub est la source unique du découpage et de l'état.

- Un chantier est une issue. Son corps porte le cadrage.
- Une tâche est une sous-issue, à la taille d'une PR. Une tâche peut avoir ses
  propres tâches.
- Un blocage est un lien natif entre deux issues.
- **L'état ne s'écrit nulle part.** Il se déduit de l'issue, de ses blocages, de
  sa branche et de sa PR.
- Une branche sert l'issue dont elle porte le numéro.
- La fusion d'une PR ferme son issue, par un workflow. GitHub ne le fait que
  pour une PR vers la branche par défaut, et toute PR vise ici `staging`.

Ce qui dure après le chantier quitte l'issue : une décision va dans un document
d'architecture, une connaissance métier dans `domain/`.

**Écarté.**

| Option | Pourquoi non |
|---|---|
| Garder les fichiers, avec un état structuré | l'état resterait sur une branche, et rédigé à la main |
| Des sous-tickets Notion | le tableau de l'équipe produit se remplirait d'items techniques |
| ~~Un GitHub Project~~ | ~~un tableau de plus à administrer, quand l'issue parente montre déjà l'avancement~~ : révoqué, voir l'ADR-0008 |

**Conséquences.**

- Le cadrage n'est plus relu en PR ni versionné par git. L'historique des
  modifications de l'issue en tient lieu.
- Sans réseau ou sans `gh`, l'avancement ne se lit plus.
- Le dépôt est public : une issue l'est aussi. La confidentialité de
  `datahub` vaut pour elle comme pour un commit.
- Le numéro d'issue se lit à deux endroits, la CLI et le workflow de fermeture.
  Ils doivent le lire de la même façon.

## Risques

| Id | Risque | État |
|---|---|---|
| R-7 | Une PR venue d'un fork n'a pas le droit de fermer une issue : le workflow échoue | Assumé, le dépôt n'a pas de contributeur externe |
| R-8 | `tsp issue list` lit au plus 1 000 issues et 1 000 PR | Assumé |

## Mises à jour

> **Mise à jour 2026-10-13, suivi par issues.** L'ADR-0004 est renversé. Les specs
> et les tâches quittent le dépôt : un chantier est une issue GitHub, ses
> tâches sont ses sous-issues. L'ADR-0007 dit pourquoi, et ce qui ferme une issue.
> La section 4 perd son absolu : l'état d'un chantier ne se lit plus dans un
> fichier.

> **Mise à jour 2026-10-14, tableau des chantiers.** Le refus d'un GitHub
> Project, dans l'ADR-0007, est révoqué. Les chantiers ont un kanban, projeté par
> `tsp` depuis l'état qu'il déduit. L'ADR-0008 dit pourquoi l'état ne s'y écrit
> pas pour autant.
