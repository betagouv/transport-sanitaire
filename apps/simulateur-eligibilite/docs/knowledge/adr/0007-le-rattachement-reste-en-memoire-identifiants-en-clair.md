# ADR-0007 - Rattachement en mémoire, identifiants en clair (~~refs pseudonymisées~~, ~~fragment d'URL~~)

> Statut : **décidé** · 2026-07-03 · Anciennement ADR-4 de `identification.md`

**Décision (révisée 2026-09-29).** À la validation, le front garde en mémoire de session
le rattachement saisi, fait des identifiants du référentiel
(`{ etabId, serviceId, serviceEstAutre?, serviceLibre? }`), et l'id du service part
tel quel à Matomo. Aucun nom, aucune donnée patient n'y figure. Seul un service saisi
sous « Autre » est déclaré au serveur (`POST /api/rattachement`), sans attendre la
réponse, pour qu'il l'ajoute à Grist.
~~Le backend construisait une identité pseudonymisée `v: 2`, faite de refs
`{ etabRef, serviceRef, prescripteurRef }` : chacune un `HMAC-SHA256(id, secret)`
tronqué à 128 bits, renvoyé par `POST /api/identite-pseudonymisee`, avec un secret dédié
`PSEUDONYMISATION_SECRET`.~~ ~~Le contexte était transmis au simulateur via le fragment
d'URL `#ctx=<base64url>` ; la fusion l'a rendu inutile.~~

**Pourquoi.** Le HMAC protégeait une personne, le prescripteur. Sans elle, il ne
masquait plus que des organisations : ce n'était plus une pseudonymisation au sens du
RGPD, qui ne vise que des données personnelles, et l'exemption CNIL de la mesure
d'audience ne l'exige pas (voir [ADR-0003](./0003-la-mesure-d-audience-se-fait-sans-bandeau-de-consentement.md)). Il ne réglait
pas non plus le cas des très petits services (R-11 de l'[ADR-0003](./0003-la-mesure-d-audience-se-fait-sans-bandeau-de-consentement.md)) : un HMAC
déterministe désigne toujours le même service. Il coûtait en revanche un secret à
tenir, une route, un mode « en clair » pour le debug, et des rapports Matomo illisibles
sans table de correspondance. Un id Grist se retrouve dans le référentiel sans secret.

**Conséquences.** Le rattachement reste en mémoire, sans `localStorage` ni URL. Qui a
accès au Matomo mutualisé de beta.gouv peut, avec le référentiel, savoir quels
établissements utilisent l'outil : c'est accepté. Le rattachement n'est pas signé, la
déclaration n'ayant pas de valeur probante (ADR-0006). Les évènements émis avant la
release portent encore des refs HMAC et ne se raccordent pas aux nouveaux.

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
