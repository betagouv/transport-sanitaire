# ADR-0015 - Deux contrats : le métier d'un modèle, et son écran (~~un seul `Model`~~)

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-4 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Le contrat `Model` mêlait le questionnaire, la préconisation, les
seeds, les deux résultats et le cerfa. D-09 nommait le premier résultat
`transportAndEligibility`, du nom de la première partie du parcours.

**Décision.** `CoreModel`, dans `core/`, porte le métier : les parties d'avant
le verrou (`questionnaire`), celle d'après (`complement`), la préconisation et
les seeds. `Model`, dans `front/`, le porte sous `core`, et y ajoute les deux
résultats, `result` et `cerfa`. Le premier résultat ne s'appelle plus
`transportAndEligibility` : ce nom disait une partie du parcours, pas un
résultat. **Ceci remplace D-09** (D-149 du
[journal](./journal-des-decisions-v10.md)). Aucune fonction ne fabrique un `CoreModel` : un
type annoncé suffit, puisque rien n'est à effacer.

**Conséquences.** Le serveur ou un script prend le seul `CoreModel`. Le socle de
l'écran lit le métier sous `model.core`.
