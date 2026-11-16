# ADR-0022 - Une condition de page s'ajoute à ses questions ; un message peut citer les réponses

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-11 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Sept pages de P2 ne se posent que dans le circuit de
prescription. Le modèle recopiait chacune de leurs questions pour y ajouter la
garde, ce qu'une question déclarée, qui ne s'ouvre pas, ne permet plus. Une incohérence
s'écrivait en tableau de messages, calculé d'un bloc : Q3.1.3 doit citer la
fréquence de Q2.8.6.a et son maximum.

**Décision.** `page(id, ...questions).appliesWhen(condition)` ajoute la condition à
chacune de ses questions. Une page dont aucune question ne se pose est sautée,
sans rien de plus à déclarer. Une incohérence se déclare par
`inconsistentWhen(condition, message)`, une par appel. Le message est un texte,
ou une valeur calculée sur les réponses quand il les cite (`condition.ts`).

**Conséquences.** Le moteur n'a pas de notion de page conditionnelle : la page
reste une liste de questions. Une incohérence se lit sur sa ligne, avec sa
condition.
