# ADR-0006 - Rattachement déclaratif, sans identité (~~identification déclarative du prescripteur~~)

> Statut : **décidé** · 2026-07-03 · Anciennement ADR-3 de `identification.md`

**Décision (révisée 2026-09-29).** Le prescripteur déclare son établissement et son
service, sans preuve et **sans dire qui il est**. ~~Le prescripteur déclare qui il est, en
sélectionnant son établissement, son service et son nom, sans preuve d'identité.~~

**Pourquoi.** Le produit a besoin de savoir d'où viennent les simulations, pas qui les
fait. Le nom du prescripteur n'a jamais servi qu'au suivi analytique individuel, qui
rendait la mesure quasi nominative et imposait un bandeau de consentement. Sans lui, la
mesure agrégée par service reste dans l'exemption CNIL (voir
[ADR-0003](./0003-la-mesure-d-audience-se-fait-sans-bandeau-de-consentement.md)). La déclaration reste suffisante et simple.

**Conséquences.** L'usurpation déclarative d'un établissement ou d'un service reste
possible, et le rattachement n'a aucune valeur probante (voir ADR-0007). Une
authentification individuelle (ProConnect, AgentConnect) reste possible plus tard ;
elle serait une étape **distincte** du rattachement, appelée identification, et non
une extension de celui-ci.

## Risques

| Réf | Risque / à valider | Portée |
|---|---|---|
| **R-5** | Le rattachement n'est pas signé, donc l'usurpation déclarative d'un établissement ou d'un service reste possible. Acceptable tant que la mesure n'a pas de valeur probante. | sécurité |

## Mises à jour

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
