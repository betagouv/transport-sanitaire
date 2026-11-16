# ADR-0040 - Une question peut avoir plusieurs places ; elle se pose à la première utile (~~une question, une page~~)

> Statut : **décidé** · 2026-11-09 · Anciennement ADR-29 de `metier-et-ecran.md`

**Contexte.** L'éditeur range l'urgence sous une seule réponse, Q2.3.4, même
quand la branche (Q2.14) la rend utile après la page du trajet
(NAV-CAISSE-URGENCE, v10.1.7, #354). Son Q2.12 n'est pas une question : c'est
la reprise de Q2.3 sur la page de branche (`CONTRAT_SAISIES_ET_PAGES.md`).
Nous la reposions sous un autre id, Q2.12 : deux réponses, que chaque fait
départageait. Le socle supposait qu'une question a une page : l'index des
positions, la validation d'une page qui efface ce qu'elle cache, la
pertinence.

**Décision.** Une question se déclare sur plusieurs pages. Sa première page
la porte telle quelle, les suivantes par `.unlessAskedBefore()`. Une seule
réponse, sous son id. Elle se pose à sa première place où ses gardes tiennent
et qui compte ; une place suivante ne la pose pas si elle s'est déjà posée,
validée ou en attente. « Avant » et « après » se lisent à sa première place,
et chaque place a ses gardes. Une place qui la cache ne lui fait perdre sa
réponse que si c'est la dernière et qu'aucune place d'avant ne la pose. Le
questionnaire refuse dès sa construction une place suivante sans première,
deux places sur une page, un id répété sans `.unlessAskedBefore()`, et des
places de part et d'autre du verrou (D-271).

| Option | Pour | Contre |
|---|---|---|
| un alias de stockage (Q2.12 rangée sous Q2.3.4) | rien ne bouge dans la navigation | l'id et la clé se séparent partout ; deux questions pour une réponse |
| le même id sur deux pages, sans marque | aucune API | un doublon par erreur ne se voit plus |
| une place suivante déclarée, résolue par le socle | l'intention se lit dans la page ; les erreurs s'arrêtent au chargement | un réglage de plus |

La troisième, choisie par Simon.

**Conséquences.** Q2.12 disparaît, les faits de l'urgence ne lisent que
Q2.3.4, les seeds aussi. Une urgence répondue à la branche puis rendue utile
au trajet par une correction s'y rouvre pré-remplie. Une réponse cachée peut
attendre, non validée, sa dernière place ; le verrou ne la garde pas. Changer
de condition en Q2.14 n'efface plus l'urgence : son `dependsOn` part avec
Q2.12. La pertinence juge chaque place à son rang, et une question reste
vivante tant qu'une de ses places l'est. La conformité vérifie qu'un id
répété est une place suivante. Le modèle factice montre la capacité avec la
mignardise, aux accompagnements et au service.

## Mises à jour

> **Mise à jour 2026-11-06, une question à plusieurs places (#354).** L'ADR-0040
> déclare une question sur plusieurs pages, sous une seule réponse : Q2.3.4 se
> pose au trajet ou à la branche, et Q2.12 disparaît. Décision de Simon, au
> journal D-271.
