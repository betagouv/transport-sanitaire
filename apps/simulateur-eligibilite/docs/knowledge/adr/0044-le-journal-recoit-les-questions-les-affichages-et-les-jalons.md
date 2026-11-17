# ADR-0044 - Les questions, les affichages et les jalons de phase

> Statut : **décidé** · 2026-11-13 · Anciennement ADR-8 de `analytics.md`

**Contexte.** Les funnels par question du dashboard (P07 à P09) demandent, par
phase, la première et la dernière question applicables vues, l'arrêt avant
validation, et des validations qui restent justes après une correction (#385). Le
contrat de l'éditeur donne `question_exposed`, `question_interacted`,
`question_validated`, `phase_entered` et `phase_completed`, avec `question_id`,
`page_id` et `exposure_id`. Il ne dit ni quelle page ferme une phase, ni quel
affichage de page porte une exposition, ni qu'une validation ne vaut plus.

**Décision.**

1. **Jalons.** La première et la dernière page d'une phase se marquent à
   l'affichage. `Simulation` dit, pour la page ouverte, si elle est la première ou
   la dernière de sa partie parmi les pages qui se posent avec les réponses
   validées. Chaque `question_exposed` de la page en porte le complément
   `milestones` (`first`, `last`, ou les deux). Les phases sont les parties du
   modèle dont l'id est une phase du contrat (`P1`, `P2`, `P3`) : aucune étiquette
   de funnel sur les questions, la partie les range déjà. Si une réponse sur la
   page marquée « dernière » ouvre une page de plus, c'est la dernière exposition
   de la phase qui compte.
2. **`page_id`.** C'est l'id de la page du modèle, sans traduction. Les deux pages
   que le contrat nomme portent son nom : `P2/contextes-situations` (Q2.2.1) et
   `P2/contextes-soins` (Q2.2.1.b). L'urgence est `Q2.3.4` à ses deux places.
3. **Affichages.** Un affichage de page naît quand le simulateur ouvre une page :
   un bouton, un lien de correction ou le bouton Retour du navigateur, jamais un
   rendu. Il porte le complément `page_view_id`. Une question y est exposée une
   fois, à son apparition, sous `exposure_id = page_view_id:question_id`. Une
   sous-question qu'un brouillon révèle est exposée dans le même affichage. Une
   saisie émet `question_interacted` quand elle change de question, et une page
   validée émet `question_validated` pour chaque question affichée.
4. **Invalidation.** Après chaque validation, les questions validées qui ne le
   sont plus (`Simulation.validated`) émettent le type complémentaire
   `question_invalidated`, avec l'`exposure_id` de la validation qu'il annule.
5. **Matomo et journal.** Un geste de l'écran est un use case, qui reçoit la
   mesure d'audience et le journal : « Suivant » fait avancer `QuestionnaireRun`
   vers Matomo et le parcours vers le journal.
6. **Phases.** `phase_entered` part au premier affichage d'une page de la phase,
   `phase_completed` à la première validation qui la quitte. Une fois chacun par
   simulation : un retour n'en émet plus. L'entrée en P3 portera la `revision` du
   R2 qui l'ouvre avec #386.

**Pourquoi.** Le simulateur sait déjà quelles pages se posent : marquer à
l'affichage évite au dashboard de recalculer le parcours. Une exposition tirée de
son affichage n'a rien à mémoriser, et un rendu redonne le même id. Seul le moteur
sait quelle validation une correction fait tomber : le dashboard ne peut pas la
déduire. Un use case par geste garde le hook sans règle (#414).

**Conséquences.** Le contrat de nos compléments passe en version 2 :
`page_view_id`, `milestones` et `question_invalidated`. Le second questionnaire,
celui du cerfa, ne mesure toujours rien dans Matomo, mais il alimente le journal.
Aucune réponse ne part : seulement des identifiants de question et de page.

## Mises à jour

> **Mise à jour 2026-11-17, les limites de phase affichées (#497).** Le contrat
> v10.2.2 remplace les jalons par un événement : cela **révise** le point 1.
> `phase_boundary_displayed` part avec l'affichage de la première ou de la
> dernière page d'une phase, avant ses questions, avec `screen` (P1, P2 ou P3),
> `boundary` (`first` ou `last`) et le `page_id` de la page. La page reste
> marquée comme avant, d'après les réponses validées. Une limite part une fois
> par page : une page rouverte ne la redit pas, une autre page devenue la
> dernière la dit à son tour. `question_exposed` ne porte plus `milestones`.

> **Mise à jour 2026-11-17, les compléments hors contrat retirés (#497).** Le
> contrat v10.2.2 ferme ses champs (`additionalProperties: false`) : cela
> **révoque** les points 3 et 4 pour ce qui part au journal. `page_view_id` ne part
> plus. L'affichage d'une page reste, dans le navigateur, ce qui fait une
> exposition, et `exposure_id` le garde en préfixe. `question_invalidated`
> disparaît, comme l'éditeur le demande au point 24 du retour v10.2.2 : une
> validation qu'une correction fait tomber ne se dit plus.

> **Mise à jour 2026-11-13, les questions et les jalons affichés (#385).** Le journal
> reçoit ce que le prescripteur voit et fait de chaque question : son affichage, sa
> première saisie, sa validation, et l'invalidation d'une validation qu'une
> correction rend caduque. Il reçoit aussi l'entrée et la fin de P1, P2 et P3, et le
> marquage de la première et de la dernière page de chaque phase. Voir l'ADR-0044. Cela
> **étend** l'ADR-0042 : deux compléments de champ et un type d'événement de plus.
