# ADR-0027 - P1 lit la cible qui dit ce qu'elle cherche, plutôt que le mode

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-16 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Deux lectures déduisaient une famille de modes de la cible
`cible_mode_id`. L'option « partage incompatible » de Q1.3 cherchait le TAP ou
le TPMR, par la fonction `modeDe` qui calculait le mode pendant P1. Le rang du
titre du prescripteur cherchait le véhicule personnel ou le transport en
commun. Les règles calculent déjà ces familles : `cible_mode_tap_ou_tpmr`,
`cible_mode_individual`, `cible_mode_public`.

**Décision.** Ces lectures lisent la cible de la famille. `modeDe` devient
~~`cibleEnCoursDeP1(faits, nom)`, qui calcule n'importe quelle cible en tenant P1
pour complète le temps de la poser~~. Précision du 2026-10-28 : c'est
`given.cible("cible_mode_tap_ou_tpmr").assuming("fait_p1_complete")`, la seule
garde qui suppose une partie finie (ADR-0034).

**Conséquences.** La liste des modes d'une famille ne s'écrit plus que dans les
règles de l'éditeur. Un test dit le titre du prescripteur pour le véhicule
personnel et le transport en commun.

## Mises à jour

> **Mise à jour 2026-10-28, les gardes écrites (#248).** L'ADR-0034 écrit les
> décisions de #243 et #244, prises le 2026-10-27 : une garde est une
> condition, `answer()` se lit selon l'endroit, `appliesWhen` dit le sens et
> `mattersWhile` l'utilité, et la complétude n'a qu'une exception,
> `assuming`. L'ADR-0027 est précisé. Décisions de Simon, au journal D-211 à
> D-215.
