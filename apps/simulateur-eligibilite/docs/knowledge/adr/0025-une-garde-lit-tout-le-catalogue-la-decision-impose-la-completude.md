# ADR-0025 - Une garde lit tout le catalogue ; la décision impose la complétude

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-14 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Les gardes lisaient les faits des pages d'avant la branche, puis
ceux de la branche, par deux fonctions faites pour elles, sans la complétude de
P1 et de P2. Constater la complétude pose les questions, donc lit leurs
gardes : une garde qui la lirait bouclerait.

**Décision.** Une garde lit tout le catalogue. La lecture dans l'ordre ne
valide, pour la garde d'une question, que les questions d'avant elle : un fait
posé plus loin reste inconnu. Le catalogue déclare la complétude inconnue, et
la préconisation l'impose (~~`read(answers, validated, fixed)`~~ `read(validated, fixed)`). Un fait ne lit
jamais une cible : `cible()` évalue tous les faits, celui qui la lit compris.
L'urgence en attente a donc une seule provenance, qui ne dit plus si la garde
de Q2.3.4 l'a écartée.

**Conséquences.** Les gardes de la branche et de Q2.3.4 lisent les mêmes faits
que la décision, ceux des questions d'avant elles. Une garde voit maintenant
les faits que la branche pose avant elle (le départ de Q2.13 pour Q2.14), et
l'exclusion du transport. Le banc d'équivalence ne montre aucune question
posée de plus ou de moins.
