# ADR-0024 - Le fait est un objet valeur

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-13 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Un fait était un objet `{ value, provenance }`. Les appelants
lisaient `faits.fait_permission.value === true`, et un test pouvait poser `{}`
à la place d'un fait.

**Décision.** `Fait` est une classe figée. `Fait.oui`, `Fait.non`,
`Fait.inconnu` et `Fait.valant` la construisent ; `isOui()`, `isNon()` et
`isInconnu()` la lisent. `avecProvenance` en donne une copie, `equals` compare
la valeur et la provenance. Le constructeur de règles gagne `inconnuSi`, qui
s'arrête sur un inconnu, ~~`retient`, qui reprend un fait établi ailleurs,~~
`applique`, qui place une règle écrite ailleurs (ADR-0033), et un `sinon` ~~qui
reçoit un fait~~ qui reçoit la raison d'un fait resté inconnu.

**Conséquences.** `.value` reste lisible, pour les règles publicodes et la
trace. Le front et les tests lisent les méthodes.

## Mises à jour

> **Mise à jour 2026-10-27, les faits en valeurs (#245).** Un fait est une
> valeur nommée, faite de règles sur des conditions (ADR-0033). L'ADR-0023 et
> l'ADR-0024 perdent `retient`, l'ADR-0029 les concepts que seuls les faits
> lisaient. Décisions de Simon, au journal D-202 à D-207.
