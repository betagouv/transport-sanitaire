# ADR-0050 - Les versions de l'app sur chaque événement

> Statut : **décidé** · 2026-11-13 · Anciennement ADR-14 de `analytics.md`

**Contexte.** Le dashboard compare des simulations faites sur des règles, et des
builds, différents (#380). Le champ `version` d'ANA-1015 valait une constante,
`10.1.7`, restée telle depuis l'intégration de la v10.1.8. La version de l'app et
le commit déployé ne s'affichaient qu'au pied de page. Les exemples et le contrat
de l'éditeur (`analytics/` du paquet v10.1.8) mettent dans `version` la version
du modèle, `10.1.8`, et son dashboard range les simulations par elle.

**Décision.**

1. **Trois champs, sur chaque événement.** Le parcours les ajoute à tous ceux
   qu'il numérote, comme `simulation_id` :

   | Champ | Ce qu'il dit | D'où il vient | Format |
   |---|---|---|---|
   | `version` | la version des règles | `core/models/eligibilite/rules/VERSION`, que l'intégration d'une livraison écrit | `10.1.8` |
   | `app_version` | la version de l'app | `package.json`, lu au build (`VERSION_APP`) | `0.8.0` |
   | `commit_sha` | le commit déployé | `SOURCE_VERSION` de Scalingo, ou `git`, au build (`SHA_COMMIT`) | 7 caractères hexadécimaux, ou `inconnu` |

2. **La version des règles vient du modèle.** Le contrat `Model` du socle front
   la déclare. Le modèle de l'éditeur la lit dans `rules/VERSION` par un import
   `?raw` : une montée du modèle la change sans retouche du code.
3. **Le serveur les exige.** Un événement sans l'un des trois, ou d'un autre
   format, est refusé.
4. **La version de notre contrat reste à part.** C'est `schema_version`, que le
   serveur écrit (ADR-0042).

**Pourquoi.** On colle au contrat de l'éditeur : son dashboard filtre par
`version`. Une seule source pour chaque version : rien à monter à la main, donc
rien à oublier. Le build écrit `inconnu` quand il ne trouve pas le commit, et le
pied de page l'affiche : le serveur l'accepte, pour qu'un tel build ne perde pas
tous ses événements, et l'inconnu se lit dans le journal.

**Conséquences.** Le contrat de nos compléments reste en version 2, qui n'est pas
encore en production : `app_version` et `commit_sha` s'y ajoutent. Les événements
de staging antérieurs n'ont pas ces champs, et portent `10.1.7`. Le modèle de
démonstration et celui des tests déclarent leur propre version.

## Mises à jour

> **Mise à jour 2026-11-17, l'enveloppe du contrat v10.2.2 (#497).** Cela
> **révise** les points 1, 3 et 4. `version` est désormais la version du
> contrat, la constante `10.2.2`, et la version des règles part en
> `model_version`, toujours lue dans `rules/VERSION`. `app_version` reste.
> `commit_sha` quitte l'événement, que le contrat ferme : le serveur écrit en
> colonne `commit_sha` le commit de celui qui reçoit l'événement, dans
> `Evenements` et dans `Collisions`. Un onglet resté sur un ancien build garde
> sa propre `app_version`, mais la colonne dit le serveur, pas l'onglet. Chaque
> événement porte aussi `sequence` et `activity_origin` (point 18 du retour
> v10.2.2) : `user` pour un geste ou un affichage que le prescripteur voit,
> `background` pour ce que l'app fait seule (une exposition de bouton ou
> d'avis, une mesure, un échec de génération, un PDF remis). Le serveur exige
> `version`, `model_version`, `app_version`, `sequence` et `activity_origin`.
> La colonne `commit_sha` doit exister dans les deux tables avant le
> déploiement.

> **Mise à jour 2026-11-13, les versions de l'app (#416).** Chaque événement dit
> quelle app l'a produit : `version` est la version des règles, lue dans
> `rules/VERSION`, et non plus une constante figée à 10.1.7. `app_version` et
> `commit_sha` s'y ajoutent. Le serveur refuse un événement sans elles. Voir
> l'ADR-0050.
