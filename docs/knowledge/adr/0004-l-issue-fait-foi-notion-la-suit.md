# ADR-0004 - L'issue fait foi, Notion la suit (~~la spec fait foi~~)

> Statut : **révoqué** · 2026-11-24 · Remplacé par l'ADR-0009 · décidé le 2026-10-12 · Anciennement ADR-4 de `cli.md`

> **Mise à jour 2026-11-24, le suivi passe dans Notion.** La décision est révoquée. Un chantier est un ticket Notion tenu à la main, sans issue GitHub ni tableau. L'ADR-0009 dit pourquoi.

**Contexte.** L'équipe produit suit le travail dans Notion. Le cadrage
technique, lui, vit dans ~~les specs du dépôt~~ l'issue du chantier (ADR-0007).

**Décision.** ~~Une spec a au plus un ticket.~~ Un chantier a au plus un
ticket, et ses tâches n'en ont pas : Notion ne porte que le suivi macro. La
synchronisation est à sens unique, ~~de la spec~~ de l'issue vers Notion.

- Le corps du ticket est écrit à sa création, puis jamais réécrit.
- Un statut ne recule jamais. Les statuts qu'aucun état de chantier ne produit
  se posent à la main.
- Le lien se garde des deux côtés : ~~dans l'en-tête de la spec~~ dans le corps
  de l'issue, et dans le ticket.

**Écarté.** Une synchronisation dans les deux sens. Elle aurait demandé de
trancher les conflits, pour un tableau dont l'équipe produit attend surtout
qu'on ne lui écrase rien.

**Conséquences.** Sans jeton, les commandes de lecture affichent le reste et le
disent. Seule la synchronisation s'arrête.

## Risques

| Id | Risque | État |
|---|---|---|
| R-1 | La synchronisation Notion n'a été éprouvée que sur un serveur local qui joue l'API. Les noms de propriétés de la base réelle sont ceux relevés le 2026-10-09. | À valider avec un vrai jeton |
| R-2 | L'intégration Notion demande des droits d'écriture, à créer par un administrateur de l'espace | En attente |

## Mises à jour

> **Mise à jour 2026-10-13, suivi par issues.** L'ADR-0004 est renversé. Les specs
> et les tâches quittent le dépôt : un chantier est une issue GitHub, ses
> tâches sont ses sous-issues. L'ADR-0007 dit pourquoi, et ce qui ferme une issue.
> La section 4 perd son absolu : l'état d'un chantier ne se lit plus dans un
> fichier.
