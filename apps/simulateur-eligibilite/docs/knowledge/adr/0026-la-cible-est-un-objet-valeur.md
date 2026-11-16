# ADR-0026 - La cible est un objet valeur, comme le fait

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-15 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Le moteur de décision donnait chaque cible en valeur nue :
`true`, `false`, une constante, `null` quand elle ne s'applique pas,
`undefined` quand il manque un fait. Une trentaine d'appelants la comparaient
par `=== true`, `!== true` ou `=== "TAP"`. Écrire `!cible` ou `=== false`
prenait une cible inconnue pour un « non », sans que rien ne le signale.

**Décision.** `Cible` est une classe figée du socle, que seul `Cible.of(value)`
construit. `isOui()` et `isNon()` lisent une cible « oui ou non », `is(valeur)`
une cible à constantes, `isInconnue()` et `isSansObjet()` les deux cas qui ne
sont pas une décision. Le compilateur suit la sorte de la cible : `isOui()` sur
une cible à constantes, ou `is("MOYENNE")` hors de ses constantes, ne compile
pas. `is` prend une seule constante : deux constantes s'écrivent avec `||`.

La valeur reste lisible par `.value`, et une cible passe en JSON par sa valeur.
`cibleValues(cibles)` donne la valeur de chacune : la trace de débogage
l'affiche et l'exporte, une seed l'attend, un test la compare. Il n'y a pas
d'`equals` : une cible n'a pas de provenance, et deux cibles de même valeur
sont égales pour `toEqual`.

| Option | Pour | Contre |
|---|---|---|
| garder la valeur nue | rien à porter | `!cible` lit une inconnue comme un « non » |
| des fonctions libres (`estOui(cible)`) | aucun objet à construire | rien n'empêche la comparaison nue à côté |
| un objet valeur, comme `Fait` | une seule façon de lire, que le compilateur vérifie | chaque test écrit ses cibles par une aide |

La troisième, par symétrie avec le fait (ADR-0024). Les tests écrivent les
valeurs des cibles à la main, et une aide les emballe : un test reste aussi
court qu'avant.

**Conséquences.** Les règles publicodes ne changent pas. Sur les 4 688 états
du banc d'équivalence, les questions posées, les faits, les cibles et les
provenances sont les mêmes. Les précisions de la trace restent des valeurs
nues, jusqu'aux concepts du modèle (#207).
