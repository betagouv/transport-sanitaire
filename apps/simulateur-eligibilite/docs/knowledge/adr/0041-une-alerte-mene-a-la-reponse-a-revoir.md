# ADR-0041 - Une alerte mène à la réponse à revoir, et l'adresse suit la position

> Statut : **décidé** · 2026-11-09 · Anciennement ADR-30 de `metier-et-ecran.md`

**Contexte.** Une incohérence se corrigeait par « Précédent » : aucun bouton,
aucun saut. Pour un conflit de lieux certain, l'alerte doit offrir un lien vers
chaque réponse d'avant qui le fonde. Le bouton Retour du navigateur doit aussi
revenir en arrière.

**Décision.** La règle du retour vit dans le socle, sans DOM
(`inconsistentWhen(..., { revisit })` et `Simulation.revisit`). L'adresse de la
page n'est qu'une projection de la position : `#/etape/<n>`, et
`#/etape/<n>?retour=<m>` pendant une correction. Elle ne porte que des rangs :
ni page, ni réponse, ni donnée.

| Option | Pour | Contre |
|---|---|---|
| A. l'écran seul garde la correction, sans adresse | rien dans le socle | le bouton Retour du navigateur quitte le simulateur ; la règle ne se teste qu'avec un DOM |
| B. réduite : le socle tient la correction, l'adresse porte la position seulement | la règle se teste sans DOM ; Retour fonctionne ; rien de personnel dans l'adresse | un rechargement perd les réponses |
| B. complète : l'adresse porte aussi les réponses | un rechargement ou un partage reprend le parcours | des données de santé dans l'adresse, l'historique et les journaux ; un relais à la page parente |

La B réduite est choisie.

**Conséquences.** Un rechargement recommence le parcours : c'est le prix de
l'adresse sans donnée. Pour la mesure d'audience, la correction reste dans la
même simulation : elle n'ouvre ni étape ni exposition, et change d'adresse sans
rien envoyer à Matomo. Le détail de la correction est dans le code et ses
tests (`correction.ts`, `position.ts`).
