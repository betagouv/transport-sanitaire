# ~~ADR-0031 - Le numéro d'une option est une fonction, pas un objet~~

> Statut : **révoqué** · 2026-10-23 · Anciennement ADR-20 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

> Renversé le 2026-10-28 (#247, D-209) : la trace et les précisions de R2
> lisent le numéro par `Number.parseInt`, chacune avec un commentaire qui cite
> D-75. Une fonction partagée pour une ligne ne valait pas un dossier.

**Contexte.** Le slug d'une option porte son numéro au catalogue (D-75). La
trace de R2 et la famille de soin de ses précisions le lisaient chacune par
`Number.parseInt`.

**Décision.** `numeroDeLOption(option)` le lit, dans `concepts/`. Son type
dit la forme du slug, `` `${number}_${string}` `` : une chaîne qui n'en est
pas une ne compile pas. Une fonction suffit : le numéro est la seule chose
qu'on lit d'un slug, et un objet n'aurait pas d'autre règle à porter.

**Conséquences.** `declarations/questions.ts` garde les seules déclarations.
Un test lit le numéro de slugs à un et deux chiffres.

## Mises à jour

> **Mise à jour 2026-10-28, la fin des concepts (#247).** L'ADR-0029 et l'ADR-0031
> sont renversés : `concepts/` disparaît, avec `AnswersReader` et
> `numeroDeLOption`. Une lecture de réponse s'écrit là où elle sert, même deux
> fois. Une donnée de l'éditeur se partage en donnée, dans `declarations/`
> (`RETIREE_SI_Q21`). Aucun fichier n'est commun aux pages et aux faits.
> Décisions de Simon, au journal D-208 à D-210.
