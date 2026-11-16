# ADR-0017 - Un test charge le métier sous Node

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-6 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Les frontières de `core/` se vérifient par ses imports. Rien ne
prouvait encore qu'il se charge vraiment hors de Vite : un import sans
extension, un JSON sans attribut d'import passent le typecheck et cassent sous
Node.

**Décision.** Un test lance Node sur le métier de chaque modèle, sans Vite. Il
rejoue les seeds qui annoncent des attendus, et compte celles que la
préconisation dément.

**Conséquences.** Une régression de chargement tombe dans `pnpm verifier`, pas
au premier script qui en aurait besoin.
