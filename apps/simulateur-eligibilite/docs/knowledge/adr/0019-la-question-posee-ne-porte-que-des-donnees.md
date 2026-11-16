# ADR-0019 - La question posée ne porte que des données

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-8 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** La lecture recopiait la question déclarée avec ses valeurs du
moment, fonctions comprises. Rien ne distinguait une question déclarée d'une
question posée, et une API n'aurait pas pu sérialiser ce que l'écran reçoit.
Juger une réponse passait par des fonctions libres réparties dans trois
fichiers.

**Décision.** Une question posée est un objet par sorte (`AskedSingleChoice`,
`AskedNumber`, `AskedAddress`…), distingué par `kind`. Ses champs ne sont que
des données : libellé, rappel, options, bornes, mode d'adresse, incohérences
du moment. Ses méthodes, sur le prototype, disent ce qu'elle garde d'une
réponse (`kept`), si la réponse suffit (`isAnsweredBy`) et ce qui n'y va pas
(`problemsWith`). `askedQuestion` la relit depuis son JSON, à l'identique ;
un test le vérifie sur toutes les questions posées par les seeds.

| Option | Pour | Contre |
|---|---|---|
| des données, et des fonctions libres pour les juger | rien à changer | ce que fait une question se lit dans plusieurs fichiers |
| un objet qui garde ses fonctions | rien à recopier | ne passe pas en JSON |
| un objet par sorte, données en champs, règles en méthodes | passe en JSON ; une sorte porte ses règles | une classe par sorte à tenir |

Les déclarations restent des objets littéraux jusqu'au constructeur de #204 :
`askedIn(question, contexte)` est donc une fonction du moteur, et non encore
une méthode de la question déclarée. *Levé par l'ADR-0020 : `askedIn` est
désormais une méthode de la question déclarée.*

**Conséquences.** L'écran ne reçoit plus que des questions posées. Le
récapitulatif de R3 relit P3 par le questionnaire, et le contexte d'une
question ne sort plus du socle (`contextOf`).

## Risques

| Id | Risque | Mesure |
|---|---|---|
| R-4 | Une question posée gagne une fonction, et ne passe plus en JSON | le test de conformité relit chaque question posée par les seeds |
