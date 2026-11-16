# ADR-0014 - Le moteur dit la nature d'un problème, l'écran en écrit la phrase

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-3 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Le moteur de questionnaire écrivait ses messages d'erreur
(« Cette réponse est attendue. », « Indiquez un code postal de 5 chiffres. »)
et le « (facultatif) » des libellés. Une API ne veut pas de ces phrases, et un autre
écran voudrait les siennes.

**Décision.** Le moteur donne la nature d'un problème (une réponse manquante,
un nombre hors bornes, un champ d'adresse mal formé). L'écran en écrit la
phrase. Les phrases que l'éditeur livre (un blocage, une incompatibilité, une
incohérence) restent dans le moteur, telles quelles : elles font partie du
métier, et une API doit pouvoir les donner.

**Conséquences.** Les phrases de l'écran vivent en un seul endroit du front.
Une nature nouvelle oblige l'écran à lui donner sa phrase : TypeScript le
réclame.
