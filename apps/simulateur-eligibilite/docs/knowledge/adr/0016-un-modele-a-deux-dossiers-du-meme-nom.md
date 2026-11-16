# ADR-0016 - Un modèle a deux dossiers du même nom

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-5 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Il fallait ranger le métier d'un modèle dans `core/` sans perdre
le lien avec son écran.

**Décision.** Un modèle a un dossier dans `core/models/` et un dans
`front/models/`, sous le même nom. Le métier (déclarations, parties du
questionnaire, faits, règles, seeds) va dans `core/`. L'écran (résultats,
fiches, cerfa, illustrations) va dans `front/`. `front/models/` dit quels
modèles existent : un modèle sans écran ne s'ouvre pas. Le socle a deux points
d'entrée, un par racine : un modèle importe le socle du métier par l'un, celui
de l'écran par l'autre. Les règles d'architecture raisonnent par nom de modèle,
à travers les deux dossiers : aucun modèle n'importe l'autre, d'un côté comme
de l'autre.

**Conséquences.** Une partie du parcours qui pose des questions vit dans
`core/` (P1, P2, P3). Un résultat vit dans `front/` (R2, R3). Le type des
textes de R2 que l'éditeur livre va dans `core/` : c'est une déclaration de
son livrable. Le formatage d'une adresse pour l'affichage reste dans `front/`.
