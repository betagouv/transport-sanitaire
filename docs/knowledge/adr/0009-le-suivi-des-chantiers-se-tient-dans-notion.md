# ADR-0009 - Le suivi des chantiers se tient dans Notion

> Statut : **décidé** · 2026-11-24 · Remplace le suivi par issues GitHub, par sous-issues et par tableau de projet

**Contexte.** Un chantier était une issue GitHub, ses tâches des sous-issues, son
état déduit par `tsp` et projeté dans un GitHub Project, puis recopié dans un
ticket Notion. Trois outils portaient le même suivi, et seul Notion est lu par
l'équipe produit.

**Décision.** Un chantier est un ticket Notion, tenu à la main. Il porte une
liste à cocher, une ligne par PR. Il n'y a plus d'issue ni de sous-issue
GitHub, plus de tableau GitHub Project, plus de workflow de fermeture.

- La PR cite le ticket Notion dans son corps.
- La branche s'appelle `<type>/<sujet>`, sans numéro d'issue.
- `tsp` ne lit ni n'écrit plus rien dans Notion ni dans GitHub.

**Écarté.**

| Option | Pourquoi non |
|---|---|
| Garder les issues et la synchronisation vers Notion | trois outils à tenir pour un suivi que l'équipe lit dans un seul |
| Garder les issues et supprimer Notion | l'équipe produit travaille dans Notion |

**Conséquences.**

- L'état d'un chantier se coche à la main. Il peut se périmer, ce que la
  déduction depuis la branche et la PR évitait.
- Une PR ne ferme plus rien : elle ne mentionne ni `Closes #`, ni numéro
  d'issue.
- Le cadrage d'un chantier vit dans Notion, plus dans un dépôt public. La
  confidentialité de `datahub` (GIT-008) vaut toujours pour les commits et les
  PR.
