# ADR-0033 - Un fait est une valeur nommée, faite de règles sur des conditions

> Statut : **décidé** · 2026-10-27 · Anciennement ADR-22 de `metier-et-ecran.md`

**Contexte.** Les gardes, R2 et R3 lisaient des valeurs, qui savent ce
qu'elles lisent (ADR-0032). Un fait restait une fonction qui recevait les
réponses et les faits : `faits/index.ts` les rangeait par nom, chaque fichier
lisait ce qu'il voulait, et sa provenance s'écrivait à la main
(`citant(…)`). Une règle reprise par plusieurs faits passait par un concept
qui donnait un `Fait` (`Sejour.of(validated).nonSiEcarte()`), et `selon`,
`selonCase` et `seulementSi` cachaient des règles dans une table ou une
barrière. On ne pouvait pas savoir, sans exécuter, ce qu'un fait lisait.

**Décision.** Un fait est une valeur nommée : `unFait("fait_…")`, ses règles,
puis `sinon(raison)` (D-202). Une règle est une condition et un état :
`ouiSi`, `nonSi`, `inconnuSi`, et `nonSiEcartee(réponse, case)`. La première
qui conclut l'emporte. Elle écrit seule sa provenance : ce que lit sa
condition, puis sa raison (D-203). `selon`, `selonCase`, `seulementSi`,
`retient`, `citant` et `faitOf` disparaissent (D-205). Une règle reprise mot
pour mot est une `RegleDeFait`, `uneRegle().nonSi(…)`, qu'un fait place avec
`applique` (D-204). Chaque fait écrit ses règles ; seuls les lectures, les
règles nommées et la table `SITUATION_PROPOSEE` se partagent, dans
`faits/communs.ts` (D-206). Le catalogue reçoit la liste des faits et les lit
sur les questions validées ; un fait ne lit ni cible ni jour. Le moteur de
questionnaire reçoit ce catalogue, et non une fonction :
`questionsOf({ faits: CATALOGUE_DES_FAITS })` (D-207).

| Option | Pour | Contre |
|---|---|---|
| garder les fonctions, citer à la main | rien à réécrire | ce qu'un fait lit ne se connaît qu'à l'exécution ; la provenance peut mentir |
| des valeurs, et des aides paramétrées partagées (`situation(x)`) | moins de lignes | un fait se lit dans deux fichiers |
| des valeurs, chaque fait écrit ses règles | un fait se lit d'un trait ; ce qu'il lit se sait sans l'exécuter | des règles semblables s'écrivent plusieurs fois |

La troisième, choisie par Simon.

**Conséquences.** Les 60 faits sont des valeurs, sans fonction ni `switch`.
Sur 2 782 états (chaque préfixe des seeds des deux modèles, et chaque option
d'une question posée sans réponse), les questions posées, les faits et les
cibles sont les mêmes ; 42 faits changent de provenance. Les concepts que
seuls les faits lisaient disparaissent avec leurs tests ; ceux qui restent
(`Permission`, `AideDuPatient`, `ContextesDuTrajet`) ne donnent plus de
`Fait`. Le graphe de #196 pourra lire ce que lit chaque fait.

## Mises à jour

> **Mise à jour 2026-10-27, les faits en valeurs (#245).** Un fait est une
> valeur nommée, faite de règles sur des conditions (ADR-0033). L'ADR-0023 et
> l'ADR-0024 perdent `retient`, l'ADR-0029 les concepts que seuls les faits
> lisaient. Décisions de Simon, au journal D-202 à D-207.
