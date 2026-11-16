# ADR-0021 - Une option se règle dans une lambda, et `order` est une vue

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-10 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Une option portait jusqu'à cinq réglages : sa description, ce qui
la propose, son aide, ce qu'elle bloque, son exclusivité. Écrits en méthodes de
la question (`offeredWhen(valeur, …)`), ils se seraient dispersés sur la chaîne.

**Décision.** `.option(valeur, (option) => option.offeredWhen(…).description(…))` :
tous les réglages d'une option au même endroit. `order(…)` dit quelles options
s'affichent, dans quel ordre, sans retirer les autres du catalogue : une option
hors de l'ordre se règle encore, et peut être l'exclusive (« Aucune »).
`exclusive(valeur)` la met à part. Une règle qui vaut pour toutes les options du
catalogue (Q2.2.1.b, Q2.6, les natures de P3) s'écrit par un `reduce` sur ses
clés, sans les recopier.

**Conséquences.** Une option inconnue ne compile pas. Un catalogue qui gagne une
option l'affiche sans qu'on touche à la déclaration, sauf si elle a un `order`.
