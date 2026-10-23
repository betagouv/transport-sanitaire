---
name: carte-des-chantiers
description: Dessiner la carte d'avancement d'un chantier (par défaut la v10, issue 50) en schéma inline, d'après ses issues GitHub, l'issue de suivi des décisions et les livrables de l'éditeur dans tmp/. À charger dès qu'on demande un schéma, une carte, une vue d'ensemble ou l'état d'avancement des chantiers, ou de « mettre à jour le schéma ».
---

# Dessiner la carte des chantiers

Ce skill ne porte aucune règle. Les couleurs, les cas limites et la
disposition sont dans
[`docs/knowledge/carte-des-chantiers.md`](../../../docs/knowledge/carte-des-chantiers.md).
L'état d'une issue se déduit comme le dit
[`apps/cli/README.md`](../../../apps/cli/README.md#les-chantiers).

## Marche à suivre

1. Lis `docs/knowledge/carte-des-chantiers.md` en entier.
2. Récupère l'arbre du chantier (issue 50 par défaut), deux niveaux de
   sous-issues, avec l'état de chacune :

   ```bash
   gh api graphql -f query='{repository(owner:"betagouv",name:"transport-sanitaire"){issue(number:50){subIssues(first:60){nodes{number title state subIssues(first:60){nodes{number title state subIssues(first:30){nodes{number title state}}}}}}}}}'
   ```

   `tsp issue show 50` donne le même arbre avec les branches et les PR.
3. Pour chaque issue ouverte qui n'est pas déjà classée : lis son corps
   (`gh issue view <n> --json body`) et ses blocages
   (`blockedBy`, `blocking` en GraphQL). Cherche « en attente », « à
   replanifier », « manque », « Loïc », « pas dans la v… ».
4. Lis l'issue de suivi des décisions du chantier (pour la v10 : la 125),
   surtout « Réponses de l'éditeur » et « À faire chez nous » : elle dit ce
   qui reste sur une issue fermée et ce qui attend une livraison.
5. Vérifie ce que l'éditeur a livré : `ls tmp/` pour la dernière version, et
   cherche dans `tmp/<version>/` les fichiers qu'une réponse cite.
6. Regarde ce qui est fusionné : `git fetch origin` puis
   `git log origin/v10 --oneline -10`, et `gh pr list --state all --limit 10`.
7. Si une carte a déjà été dessinée dans la conversation, ne relis que ce qui
   a bougé depuis (`updatedAt` des issues et des PR).
8. Charge le module `diagram` (`mcp__visualize__read_me`), puis dessine avec
   `mcp__visualize__show_widget`, en partant de [`gabarit.svg`](gabarit.svg) :
   même grille, mêmes composants, cases ajoutées ou retirées selon l'arbre.
   Retire ses commentaires `<!-- -->` avant l'envoi.
9. Sous la carte, en quelques puces : ce qui a changé depuis la dernière, et
   chaque choix de couleur discutable (issue fermée mais pas finie, tâche en
   partie bloquée, issue laissée hors de la carte).

## Correspondance des couleurs dans le gabarit

| État | Classe |
|---|---|
| terminé | `c-green` |
| en cours | `c-amber` |
| plan fait | `c-blue` |
| package sans plan | `c-purple` |
| sans package | `c-gray` |
| hors échelle | `box` en pointillés |
