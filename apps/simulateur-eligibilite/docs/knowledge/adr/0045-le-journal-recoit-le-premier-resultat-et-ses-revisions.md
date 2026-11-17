# ADR-0045 - Le premier résultat et ses révisions

> Statut : **décidé** · 2026-11-13 · Anciennement ADR-9 de `analytics.md`

**Contexte.** Le dashboard compte l'accès au premier résultat sur le premier R2
d'une simulation, et la répartition des issues sur le dernier R2 encore valide
(#386). Le contrat de l'éditeur donne `result_displayed`, avec `revision`,
`can_complete`, `issue`, `mode`, `reason_codes` et `support`, et
`result_invalidated`. Il dit qu'une modification de P1 ou de P2 invalide le R2,
que ces codes ne viennent que des sorties calculées, et qu'un champ absent vaut
« inconnu ». Il ne dit ni qui fournit les codes, ni quelle modification compte,
ni quand un R2 est affiché.

**Décision.**

1. **Les codes.** Le modèle déclare ce que le R2 donne au journal
   (`Model.resultCodes`), en une valeur calculée sur ses cibles : l'issue, le
   mode, les codes de raison, le support et le financeur. Le socle l'évalue à
   l'affichage et l'envoie, sans connaître les cibles. Comme pour l'indicateur
   ALD, ce qu'elle lit ne fait poser aucune question : la mesure suit le
   parcours.
2. **La révision.** `Journey` numérote les révisions du premier résultat, `r1`,
   `r2`… Un R2 réaffiché sans modification garde sa révision, et une révision
   tombée ne revient pas, même si les réponses redeviennent celles d'avant.
3. **L'invalidation.** Une révision tombe à la validation d'une page de P1 ou de
   P2 dont les réponses validées changent (`ValidatedAnswers.sameAs`) :
   `result_invalidated` part aussitôt, avec la révision. Revalider sans rien
   changer, ou reculer, ne fait rien tomber. Le complément ne touche pas au R2.
4. **L'affichage.** `result_displayed` part quand le contenu du R2 est chargé,
   une fois par révision. `can_complete` vaut ce que le socle affiche : le
   bouton qui verrouille, ou rien.
5. **Les états.** Un code part s'il a une valeur. Une cible sans valeur laisse
   le champ absent, ce que le contrat lit « inconnu ». Le dashboard sépare le
   sans objet du manquant par l'issue. `reason_codes` part dès que les règles
   l'ont calculé : une liste vide dit qu'elles n'ont donné aucun code, et son
   absence qu'il leur manquait un fait.
6. **Les compléments.** `financeur`, la cible du même nom. `motifs`, les
   identifiants des motifs du catalogue que le R2 affiche, choisis par le même
   calcul que leur texte (`FirstResult.motifs`). `portions`, les portions du
   trajet que le R2 restitue : `LIGNE_REGULIERE`, ou aucune
   (`FirstResult.portions`). ~~`TERRESTRE`~~ ne part plus (#443) : la
   présence d'une partie terrestre est inconnue, faute de réponse qui la
   prouve. Une liste vide part : rien n'est affiché. Sans liste, on ne sait
   pas, et le champ ne part pas.
7. **Le complément.** `phase_entered` de P3 porte la révision du R2 qui l'ouvre.

**Pourquoi.** Le socle reste aveugle au métier, comme pour l'intention.
Seul le moteur sait qu'une validation change les réponses : l'écran ne compare
rien. Envoyer au chargement est le seul moment où `can_complete` est connu et où
le prescripteur a vu le résultat. Les motifs et les portions viennent du calcul
qui les affiche : le journal et l'écran ne peuvent pas diverger. Une valeur
inventée pour le sans objet serait une sortie que le modèle ne calcule pas.

**Conséquences.** Le contrat de nos compléments reste en version 2, qui n'est pas
encore livrée : `financeur`, `motifs` et `portions` s'y ajoutent. Le modèle de
test ne déclare pas de codes : son R2 n'envoie que `revision` et `can_complete`.
L'éditeur a tranché la liste des motifs visibles et la classification des
modes (#443) : la collecte garde les identifiants source. Le catalogue cache le
pourquoi de l'étranger : ce R2 envoie une liste de motifs vide. S'il le
montrait, ses points, sans identifiant au catalogue, ne donneraient pas de
liste.

## Mises à jour

> **Mise à jour 2026-11-17, les compléments hors contrat retirés (#497).** Le
> contrat v10.2.2 ferme ses champs : cela **révoque** le point 6. `financeur` et
> `motifs` ne partent plus. Le motif affiché reste choisi par le calcul de son
> texte, sans rien dire au journal.

> **Mise à jour 2026-11-17, la composition du transport (#509).** `portions` ne
> part plus : `transport_composition` (ANA22-04, v10.2.2) la remplace sur
> chaque R2. Le modèle la calcule avec ses codes (`ResultCodes`), de
> `fait_avion_bateau_ligne`, de Q2.3.2.terrestre et des cibles du support et
> du mode, jamais du texte affiché. `mode` ne porte plus que l'un des cinq
> modes terrestres, et seulement pour `terrestrial_only` et `mixed`. Sans
> support (`AUCUN`), la composition vaut `not_applicable` : hypothèse, point 23
> du retour v10.2.2, à confirmer par l'éditeur. Le serveur reçoit encore
> `portions` d'un onglet d'avant, et l'écarte.

> **Mise à jour 2026-11-13, les arbitrages de l'éditeur sur les véhicules et les
> motifs (#443).** `portions` ne porte plus `TERRESTRE` : la portée M-COMMUN
> parle des « éventuelles » parties terrestres, et aucune réponse ne prouve leur
> présence ou leur absence. Le champ manque, ce qui se lit « inconnu », en
> attendant que l'éditeur dise quelle réponse les établit. Le serveur reçoit
> encore `TERRESTRE` d'un onglet resté sur une version d'avant, et l'écarte.
> Une liste de motifs vide dit qu'aucun motif n'est affiché, et son absence
> qu'on ne sait pas. Voir l'ADR-0045.

> **Mise à jour 2026-11-13, le premier résultat et ses révisions (#386).** Le journal
> reçoit chaque R2 affiché, avec sa révision, ses codes, ses motifs et les portions
> du trajet qu'il restitue, et l'invalidation d'une révision qu'une modification de
> P1 ou de P2 rend caduque. Voir l'ADR-0045. Cela **étend** l'ADR-0044 : trois compléments
> de champ.
