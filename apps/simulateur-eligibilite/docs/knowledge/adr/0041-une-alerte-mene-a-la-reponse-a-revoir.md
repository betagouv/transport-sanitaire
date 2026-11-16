# ADR-0041 - Une alerte mène à la réponse à revoir, et l'adresse suit la position

> Statut : **décidé** · 2026-11-09 · Anciennement ADR-30 de `metier-et-ecran.md`

**Contexte.** Jusqu'ici, on corrigeait une incohérence par « Précédent » :
aucun bouton, aucun saut. La v10.1.7 demande plus pour un conflit de lieux
certain (#353, NAV-LIEUX-CORRECTION-001). L'alerte offre un lien vers chaque
réponse d'avant qui le fonde : « Revoir la situation particulière » pour Q1.3,
« Revoir la nature du déplacement » pour une question de P2. Le lien rouvre la
page de la réponse, le focus sur son champ. Pendant la correction, un choix
seul n'avance plus, et « Suivant » ramène vers l'alerte. Le bouton Retour du
navigateur doit aussi revenir en arrière. Pour la mesure d'audience, la
correction reste dans la même simulation (ANA-1017-001) : pas de nouvelle
étape, pas d'exposition.

**Décision.** La règle du retour vit dans le socle, sans DOM.
`inconsistentWhen(condition, message, { revisit })` dit les réponses à revoir,
une valeur lue comme la condition : rien d'après la question.
`Simulation.revisit(question, draft)` rouvre la page d'avant qui pose cette
question validée, avant le verrou. La page ouverte devient l'origine, avec son
brouillon et son rang. « Suivant » valide la page, puis va d'abord à une
question devenue nécessaire avant l'origine, puis à l'origine si elle se pose
encore, sinon à la suite du parcours. L'adresse de la page n'est qu'une
projection de la position : `#/etape/<n>`, et `#/etape/<n>?retour=<m>` pendant
une correction. Des rangs seulement : ni page, ni réponse, ni donnée.
`Simulation.moveTo` valide toute adresse : une page déjà posée, avant le
verrou. Une adresse refusée revient à la page ouverte ; après un
rechargement, on recommence.

| Option | Pour | Contre |
|---|---|---|
| A. l'écran seul garde la correction, sans adresse | rien dans le socle | le bouton Retour du navigateur quitte le simulateur ; la règle du retour ne se teste qu'avec un DOM |
| B. réduite : le socle tient la correction, l'adresse porte la position seulement | la règle se teste sans DOM ; Retour fonctionne ; rien de personnel dans l'adresse | une position de plus à valider ; un rechargement perd les réponses |
| B. complète : l'adresse porte aussi les réponses | un rechargement ou un partage reprend le parcours | des données de santé dans l'adresse, l'historique et les journaux ; un relais à la page parente |

La B réduite, choisie au cadrage de #353.

**Conséquences.** Les liens sont de vrais `<a href>` : leur adresse est la
position que la correction ouvre. Un lien vers la page ouverte ou une page
d'après ne s'affiche pas. Le rang de l'origine est figé au début de la
correction : une page devenue nécessaire ne le décale pas. Une seconde
correction garde la première origine. « Précédent » l'abandonne, brouillon
compris. Une adresse sans retour l'abandonne aussi, mais le brouillon de
l'origine suit sa page : le bouton Retour du navigateur ramène à l'alerte. Pendant
la correction, `simulation_step` ne part pas ; `simulation_complete` part si
la correction mène au résultat. Matomo ne compte qu'une page vue, au démarrage
du traceur, sans suivi des liens : un changement d'adresse n'envoie rien.
La correction (`correction.ts`), la position (`position.ts`) et les étapes
(`stages.ts`) ont leur fichier : `simulation.ts` reste sous sa limite de
taille. Le modèle de démonstration montre la capacité
sur le service : « Glacée » ne va pas avec un café (seed `service-cafe-glace`).
Au journal, D-274 à D-277.

## Mises à jour

> **Mise à jour 2026-11-06, corriger depuis une alerte (#353).** L'ADR-0041
> donne à une alerte ses liens vers les réponses à revoir, tient la correction
> dans la simulation, et fait suivre la position par l'adresse de la page. Au
> journal D-274 à D-277.
