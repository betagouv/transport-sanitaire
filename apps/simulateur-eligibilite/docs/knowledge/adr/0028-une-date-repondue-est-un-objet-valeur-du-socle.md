# ADR-0028 - Une date répondue est un objet valeur du socle

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-17 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Les cinq contrôles des dates de la permission (Q2.8) prenaient
des chaînes brutes, et chacun relisait la date. La déclaration de Q2.8.2 leur
passait les réponses une à une, dans le bon ordre. La période de Q2.8.6 se
comparait au jour de la fin par un découpage de la chaîne.

**Décision.** `LocalDateTime` est une classe figée du socle, nommée en anglais
comme ses voisines, d'après la `LocalDateTime` de Java : une date et une heure
sans fuseau. `LocalDateTime.parse(saisie)` lit une fois `AAAA-MM-JJ` ou
`AAAA-MM-JJTHH:mm`. Elle compare (`isBefore`, `isAfter`, `isAtOrBefore`,
`equals`) et se décale (`plusDays`, `plusHours`, `startOfDay`). Les heures se
comptent comme un instant UTC : un changement d'heure ne décale rien.

Une saisie absente ou mal écrite est illisible : toute comparaison avec elle
vaut « non ». Aucune méthode ne dit si une date est lisible : aucun appelant
n'en a besoin.

**Conséquences.** Les seuils de la permission (48 heures, 14e jour) vivent sur
la permission (ADR-0029), plus dans les calculs de date. `startOfDay()` remplace
le découpage des dix premiers caractères : une date et heure mal écrite, dont
le jour est lisible, n'est plus lue comme ce jour. Le champ de l'écran n'en
produit pas, et le banc d'équivalence ne montre aucun écart.

## Risques

| Id | Risque | Mesure |
|---|---|---|
| R-8 | Une date s'écrit en lettres à trois endroits : le rappel des permissions de P3, le récapitulatif de R3, les textes de l'écran | hors de #207, qui ne lit que des dates ; à ranger quand un quatrième apparaîtra |
