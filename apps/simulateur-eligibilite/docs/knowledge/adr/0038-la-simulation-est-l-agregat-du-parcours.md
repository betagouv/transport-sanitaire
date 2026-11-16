# ADR-0038 - La simulation est l'agrégat du parcours (~~l'état dans l'écran~~)

> Statut : **décidé** · 2026-11-04 · Anciennement ADR-27 de `metier-et-ecran.md`

**Contexte.** L'ADR-0036 donnait au parcours son entité, `Simulation`, mais elle
ne lisait qu'une préconisation : `Simulation.of(core, réponses)`. L'état du
parcours restait à l'écran : `useQuestionnaire` gardait la page ouverte, le
brouillon et les réponses ; `screen.ts` devinait l'écran de départ d'une seed ;
`move-between-pages.ts` et `resume-where-left.ts` avançaient ou reprenaient ;
le verrou était un drapeau que chaque écran recevait à part (`lockedAnswers`,
les cibles). Où l'on en est s'écrivait en quatre endroits, et aucun test ne
l'éprouvait sans DOM.

**Décision.** `Simulation` est l'agrégat du parcours : un modèle, les réponses
validées, la page ouverte et l'étape. L'étape est une union explicite,
questionnaire, résultat, complément, cerfa. Le verrou est une étape, pas un
drapeau : après lui, l'étape porte ce qu'il a figé, les réponses d'avant et
leur préconisation. Chaque transition, `validate`, `back`, `reopen`, `lock`,
donne une nouvelle simulation ; `start` et `resume` disent où des réponses
commencent ou reprennent. L'étape et ses lectures sont privées : seule la
simulation lit à une étape, et les tests du modèle passent par elle (D-262).
L'écran n'y ajoute que le brouillon de la page ouverte : `useQuestionnaire`
reçoit la simulation et donne, par `onChange`, celle que chaque bouton ouvre ;
`Simulateur.tsx` choisit l'écran sur `stage.name`.

| Option | Pour | Contre |
|---|---|---|
| garder l'état dans l'écran, documenter le déroulé | rien à déplacer | quatre endroits pour un savoir ; aucun test sans DOM |
| une machine à états du socle, que l'écran pilote (`next`, `back`) | le déroulé en un endroit | l'écran garde encore la page et les réponses : deux états à tenir d'accord |
| un agrégat immuable qui porte tout, l'étape comprise ; l'écran ne garde que le brouillon | un seul état, testable sous Node ; une transition est une méthode | le fichier touche la limite des 300 lignes |

La troisième, choisie par Simon. L'étape a d'abord eu son fichier, `stage.ts`,
que quatre tests du modèle lisaient à côté de l'agrégat ; Simon l'a repliée
dans `simulation.ts`, pour qu'un seul fichier porte le concept et qu'aucun
test ne lise une étape par une porte de côté.

**Conséquences.** `screen.ts`, `move-between-pages.ts`, `resume-where-left.ts`
et `QuestionnaireState` disparaissent ; `preconisationOf` passe dans
`preconisation.ts`. `tests/socle/simulation/simulation.test.ts` couvre
l'agrégat sans DOM. Aucun écran ne change, à une exception près : une seed qui
mène derrière le verrou y va toujours, parce que le core ne sait pas si le
modèle donne un cerfa ; avant, l'écran la gardait au résultat. Le résultat
garde la garde qui ne propose le verrou que si un cerfa suit, et un complément
sans page ouvre une étape sans page, où l'écran ne monte rien. `simulation.ts`
tient en 299 lignes : une capacité de plus en sort dans son fichier (R-13).

## Risques

| Id | Risque | Mesure |
|---|---|---|
| R-13 | `simulation.entity.ts` touche la limite des 300 lignes : une méthode de plus la dépasse | `taille-du-code.test.ts` le garde ; une capacité de plus sort dans son fichier, sous `simulation/` |

## Mises à jour

> **Mise à jour 2026-11-03, l'agrégat du parcours (#336).** L'ADR-0038 fait de
> `Simulation` l'agrégat du parcours : l'étape, le verrou, la page ouverte et
> les transitions y vivent ; l'écran ne garde que le brouillon. L'ADR-0036 est
> précisé : `Simulation.of` devient `start` et `resume`. Décision de Simon, au
> journal D-262.
