# ADR-0034 - Une garde est une condition, lue selon l'endroit

> Statut : **décidé** · 2026-10-28 · Anciennement ADR-23 de `metier-et-ecran.md`

**Contexte.** Une garde était une fonction du contexte (`askedIf`,
`offeredIf`, `inconsistentIf`) : elle lisait ce qu'elle voulait, et rien ne
disait quoi. Deux lectures d'une réponse se côtoyaient, la validée et la
saisie, et chaque garde choisissait la sienne. Une garde de P2 calculait ses
cibles elle-même, et P1 en calculait une en tenant ses faits pour finis
(`cibleEnCoursDeP1`). Le graphe de #196 doit savoir, sans exécuter, ce que
lit chaque garde.

**Décision.** Une garde est une condition : une valeur qui sait ce qu'elle
lit (`condition.ts`), composée par `and`, `or` et `not`, calculée par
`compute` et `computeWith` (D-212). Ses entrées viennent de `given` : la
réponse d'une question, un fait, une cible, le jour. Il n'y a qu'une lecture
d'une réponse, `given.question(id).answer()`, et le socle la choisit selon
l'endroit (D-213, `answer-readings.ts`) :

| Endroit | Ce que `answer()` lit |
|---|---|
| une garde | les questions posées avant elle : validées sur les pages d'avant, telles que saisies sur la sienne |
| une incohérence | de même, sa propre question comprise ; elle se déclare sur la dernière qu'elle lit |
| un fait, R2, R3 | les questions validées |

Une garde qui lit sa question, ou une question d'après, s'arrête net. Elle lit
une cible par le même chemin que la décision, réponses, validées, faits,
cibles ; seule une partie déclarée `afterLock` lit les cibles figées au verrou
(D-211).

Une garde dit pourquoi elle tient (D-214) :

| Verbe | Ce qu'il dit | Exemple |
|---|---|---|
| `appliesWhen` | la question a un sens, d'après les réponses | `page(…).appliesWhen(…)`, ajoutée à chacune de ses questions (ADR-0022) |
| `mattersWhile` | sa réponse peut encore changer le résultat, d'après un fait, une cible ou un support | `.mattersWhile(given.fait("fait_permission").isOui())` |
| `offeredWhen` | une option se propose | `possibleAnswer.offeredWhen(unModePartageable)` |
| `inconsistentWhen` | une réponse contredit une autre | Q3.1.3 au-delà de la fréquence de Q2.8.6.a |

La complétude de P1 et de P2 reste inconnue pour une garde (ADR-0025). Une seule
garde suppose une partie finie, isolée et nommée : l'option 6 de Q1.3 lit
`given.cible("cible_mode_tap_ou_tpmr").assuming("fait_p1_complete")`, parce
que les règles ne donnent le mode qu'une fois P1 complète (D-215). Elle
remplace `cibleEnCoursDeP1`.

| Option | Pour | Contre |
|---|---|---|
| garder les fonctions du contexte | rien à réécrire | ce qu'une garde lit ne se connaît qu'à l'exécution |
| des conditions, deux lectures nommées (`wasAnsweredWith`, `isBeingAnsweredWith`) | la lecture se voit à l'appel | chaque garde choisit, et peut choisir mal |
| des conditions, une lecture que le socle choisit selon l'endroit | une seule façon d'écrire ; l'endroit décide | il faut savoir où l'on est pour savoir ce qu'on lit |

La troisième, choisie par Simon. Pour la complétude, Simon refuse de
généraliser l'exception : on l'isole et on la nomme.

**Conséquences.** Les gardes des deux modèles sont des conditions ; les
libellés, rappels, aides et bornes restent des fonctions du contexte. Les
natures de Q3.2 ne voient plus de l'arrivée que ce que P2 en établit, puisque
Q3.3 se choisit après. R2, R3 (ADR-0032) et les faits (ADR-0033) suivent la même
forme. Le graphe de #196 pourra lire ce que lit chaque garde ; ~~là où il dira
qu'une réponse ne change plus le résultat, il remplacera `mattersWhile`~~. Il
n'en remplace aucun (D-227).

## Mises à jour

> **Mise à jour 2026-10-28, les gardes écrites (#248).** L'ADR-0034 écrit les
> décisions de #243 et #244, prises le 2026-10-27 : une garde est une
> condition, `answer()` se lit selon l'endroit, `appliesWhen` dit le sens et
> `mattersWhile` l'utilité, et la complétude n'a qu'une exception,
> `assuming`. L'ADR-0027 est précisé. Décisions de Simon, au journal D-211 à
> D-215.

> **Mise à jour 2026-10-28, le tri des gardes d'utilité (#256).** Le graphe ne
> remplace aucun `mattersWhile` : ils restent tous (ADR-0035, conséquences). La
> dernière phrase de l'ADR-0034 ne vaut plus. Décision de Simon, au journal D-227.
