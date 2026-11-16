# ADR-0010 - Référentiel figé des noms d'évènement, jamais composés

> Statut : **décidé** · 2026-09-28 · Anciennement ADR-4 de `analytics.md`

**Décision.** Le nom de chaque évènement Matomo est une valeur fixe d'un
référentiel unique (`front/socle/analytics/audience-event.entity.ts`, `EventName`), jamais
composé à la volée par concaténation de chaîne. Ce module n'interprète aucune
donnée métier — ni l'outil, ni le statut d'un résultat, ni le formulaire d'un
CERFA : c'est l'appelant qui choisit l'entrée à émettre, via
`trackEvenement(nom)`. Un nom qui n'est pas une valeur exacte du référentiel
ne compile pas.

**Pourquoi.** Composer un nom à l'exécution (`${outil}:${action}`,
`resultat:${statut}`) rend le vocabulaire ingrepable — aucun symbole ne
correspond au nom réellement envoyé à Matomo — et ne protège d'aucune valeur
incohérente. `cible_cas_final` et `cible_resultat_medical`, deux cibles
publicodes dont la valeur est une phrase d'affichage (jusqu'à 152 caractères
pour l'une d'elles, VSL/TPMR), aggravaient le problème : les utiliser telles
quelles comme nom d'évènement aurait rendu les rapports Matomo dépendants du
phrasé exact du modèle, livré par l'éditeur et sujet à reformulation sans
changement de sens.

**Conséquences.** `outil` (`prescripteur`/`secretariat`) et, pour un résultat,
un **slug court** font désormais partie du nom lui-même — voir [la mesure d'audience](../domain/mesure-d-audience.md) pour la
liste complète. Le slug est traduit depuis la phrase publicodes par
l'appelant, pas par le référentiel (`SLUG_CAS_FINAL` dans `Secretariat.tsx`,
`SLUG_RESULTAT_MEDICAL` dans `Prescripteur.tsx`) ; une phrase absente de la
table (montée de version du modèle) retombe sur le slug `indetermine` plutôt
que de faire échouer le parcours pour un souci d'analytics. Les CERFA suivent
le même principe : `formulaire` (typé `Formulaire`, réutilisé par
`DocumentCerfa.fichier`) fait partie du nom, un par document produit.

## Mises à jour

> **Mise à jour 2026-10-06, vidage avant la v10.** Les événements de résultat et de
> téléchargement de CERFA sont retirés avec le modèle v9 qui les définissait, et les
> noms d'action perdent leur préfixe d'outil (`prescripteur:`, `secretariat:`) : il
> n'y a plus qu'un parcours. Il reste les quatre événements de parcours. Les
> séries Matomo antérieures portent les anciens noms et ne se raccordent pas aux
> nouvelles. Les événements de résultat reviendront avec la v10.

> **Mise à jour 2026-10-29, indicateur de parcours ALD.** À chaque arrivée sur le
> premier résultat, un parcours ALD envoie son verdict, avec le nombre de questions
> posées de P1 à P2. Le modèle déclare ce qui compte, le socle compte et envoie
> (D-228 à D-231 du journal de la v10).
