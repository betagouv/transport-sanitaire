# ADR-0032 - R2 et R3 lisent des valeurs, comme les gardes

> Statut : **décidé** · 2026-10-27 · Anciennement ADR-21 de `metier-et-ecran.md`

**Contexte.** Les gardes lisaient des conditions, qui savent ce qu'elles lisent
(#243). R2 et R3 recevaient encore les réponses et les questions validées, et
chaque fonction y lisait ce qu'elle voulait. Les pages des lieux lisaient leurs
réponses par un pont, `given.answers(…ids)`, en attendant.

**Décision.** Le socle passe à R2 et à R3 `{ read, faits, cibles }` (D-201).
`read` lit une valeur sur les questions validées, les faits et les cibles figés
au verrou, et le jour de complétion. Une rubrique de R3, un champ de cerfa, la
trace de R2 et ses précisions sont des valeurs (`given…`). Un calcul sur
plusieurs valeurs les nomme, `given.all({ sens, repetition }).compute(sensDe)`,
et chacune garde ce qu'elle lit. Le pont disparaît. Un savoir que R2 seule
lisait vit près d'elle : le séjour réel est `UN_SEJOUR_REEL`, dans les
précisions, et `Sejour.estReel()` disparaît. Les libellés, rappels, aides et
bornes restent des fonctions du contexte.

**Conséquences.** Aucune fonction de `r2/` ni de `r3/` ne reçoit les réponses.
Le graphe pourra dérouler ce que lit chaque morceau du résultat jusqu'aux
questions. Les textes de R2 et les cerfa remplis ne changent pas : leurs tests
sur les seeds passent tels quels.
