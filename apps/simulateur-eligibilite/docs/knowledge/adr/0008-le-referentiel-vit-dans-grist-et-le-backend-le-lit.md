# ADR-0008 - Référentiel dans Grist, lu par le backend de l'app fusionnée

> Statut : **décidé** · 2026-07-03 · Anciennement ADR-5 de `identification.md`

**Décision (révisée 2026-09-29).** Le référentiel établissement/service est maintenu à
la main dans Grist. L'app simulateur, rattachement et simulation compris, est une app
unique servie par un backend Node/Express hébergé sur Scalingo. Ce backend sert le front
React construit par Vite et expose une API same-origin qui détient la clé Grist :
`/api/etablissements|services` pour le référentiel filtré, et `POST /api/rattachement`
pour ajouter un service saisi sous « Autre ». ~~`POST /api/identite-pseudonymisee`
renvoyait les refs pseudonymisées.~~
~~`/api/prescripteurs` exposait les prescripteurs d'un service.~~ La table des
prescripteurs reste dans Grist pour l'admin, mais l'app ne la lit ni ne l'écrit plus.
~~Ce backend appartenait à une app d'identification distincte ; le simulateur restait
statique sur GitHub Pages.~~

**Pourquoi.** L'accès direct du navigateur à Grist n'est pas viable : la clé est
toute-puissante et ne peut pas vivre dans une SPA, et Grist bloque le CORS. Il faut donc
un composant serveur qui détienne la clé. Scalingo ne propose pas de FaaS. Depuis la
fusion, c'est le backend du simulateur qui joue ce rôle : une seule app, tout en
same-origin donc sans CORS, des données fraîches puisque Grist est lu en direct, et un
seul déployable.

**Conséquences.** Le simulateur quitte GitHub Pages pour Scalingo et n'est plus
entièrement statique, puisqu'il a un backend. C'est le prix du rattachement
obligatoire. Le workflow GitHub Pages est supprimé. La clé Grist vit en variable
d'environnement Scalingo, et le serveur refuse de démarrer sans elle en production :
son repli, un référentiel factice, n'est bon que pour un poste de développement, et le
servir en production donnerait un simulateur silencieusement faux.
~~`PSEUDONYMISATION_SECRET` était exigée de la même façon.~~ Le front et ses tests sont préservés :
l'interface `Referentiel` a un client HTTP same-origin et garde le snapshot factice
en défaut, pour le dev et les tests. Grist reste l'outil d'admin. Voir [le rattachement](../domain/rattachement.md) pour le
modèle.

## Risques

| Réf | Risque / à valider | Portée |
|---|---|---|
| **R-2** | Choix d'hébergement Grist, entre grist.com et self-hosted. L'app fusionnée, front et backend, est sur Scalingo faute de FaaS (cf. ADR-0008). | décision infra |
| **R-3** | Fraîcheur du référentiel : le backend lit Grist en direct, ce qui convient. Ne pas retomber sur un snapshot figé si le maintien à la main doit rester visible immédiatement. | conception backend |

## Mises à jour

> **Mise à jour 2026-07-08, fusion des apps.** L'identification et le simulateur ont un
> temps été conçus comme **deux apps séparées** : une SPA d'identification en iframe, une
> redirection top-level vers le simulateur statique, et le contexte passé en fragment
> `#ctx`. Ils sont désormais **une seule app**, où l'identification est un **écran de rattachement**
> en amont du simulateur. Cela **réverse** l'ADR-0004 (app dédiée), l'ADR-0007 (contexte en
> fragment d'URL) et l'invariant « simulateur 100 % statique » de l'ADR-0008. Deux raisons :
> l'intégration Sites Conformes est plus simple avec **un seul iframe**, sans navigation
> top-level, et le passage de contexte devient trivial une fois l'**état en mémoire**,
> sans fragment. Les sections ci-dessous ont été mises à jour. Les décisions restées
> valables sont conservées : identification déclarative, PII hors bundle, moteur
> publicodes intouché.

> **Mise à jour 2026-09-29, release officielle, rattachement sans identité.**
> L'écran de rattachement ne demande plus **qui** réalise la simulation : plus de liste de
> prescripteurs, plus de nom ni de prénom saisis. Il ne reste que l'établissement et
> le service. Cela **révise** l'ADR-0006 (on ne déclare plus son identité), l'ADR-0007 (plus
> de pseudonymisation : sans personne à masquer, le HMAC n'avait plus d'objet, et les
> identifiants du référentiel restent en clair) et l'ADR-0008 (le référentiel lu par l'app
> se limite aux établissements et aux services, et le backend ne détient plus que la
> clé Grist). La raison : le `prescripteurRef` rendait le suivi Matomo quasi nominatif,
> donc soumis à un bandeau de consentement, ce qui bloquait la release officielle (voir
> [ADR-0003](./0003-la-mesure-d-audience-se-fait-sans-bandeau-de-consentement.md)). Le mot « identification » est réservé à une
> éventuelle authentification individuelle future ; l'étape actuelle s'appelle
> **rattachement**. Le nom de ce fichier est conservé, parce que tout le dépôt le cite.
> Les risques R-6 et R-9 deviennent sans objet. Si le référentiel ne répond pas,
> l'écran laisse désormais entrer avec un rattachement dégradé « Autre / Autre ».
