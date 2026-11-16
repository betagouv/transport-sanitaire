# ADR-0002 - Découpage par service via propriété d'événement (~~par prescripteur~~)

> Statut : **décidé** · 2026-07-03 · Anciennement ADR-2 de `analytics.md`

**Décision (révisée 2026-09-29).** L'id Grist du service est porté en propriété
d'événement Matomo : chaque `trackEvent` l'a pour Nom, avec `simulateur` en catégorie
et le type d'événement en action. Un service saisi sous « Autre » donne l'id de
l'entrée « Autre » de son établissement, une structure (libéral, Assurance Maladie,
autre) donne l'id de son service sous l'établissement fourre-tout, un établissement
saisi à l'écran ne donne aucun Nom, et le rattachement dégradé, quand le référentiel
ne répond pas, donne `autre` (voir [ADR-0007](./0007-le-rattachement-reste-en-memoire-identifiants-en-clair.md)). Le reporting utilise le
rapport Événements, en Catégorie puis Action puis Nom, et la segmentation
`eventName == <id du service>`. ~~Le Nom portait le `prescripteurRef`, un
`HMAC-SHA256` calculé côté backend sur l'identité d'un prescripteur nommé.~~

**Pourquoi.** L'instance mutualisée beta.gouv n'expose pas les custom dimensions,
le plugin ou les droits n'étant pas disponibles (R-8). Les propriétés d'événement
donnent le découpage entre éligibles et non éligibles par service, sans
configuration admin ni backend de croisement. L'établissement n'est pas transmis : il
se déduit du service via le référentiel. Le service suffit au pilotage du produit, et
ne désigne pas une personne. Il part en clair : sans personne à masquer, un
pseudonyme n'apportait plus rien (voir [ADR-0007](./0007-le-rattachement-reste-en-memoire-identifiants-en-clair.md)).

**Conséquences.** Le nom d'un service se lit dans Grist à partir de son id, sans
secret. Qui a accès au Matomo mutualisé peut, avec le référentiel, savoir quels
établissements utilisent l'outil. Si les custom
dimensions deviennent disponibles, on pourra les ajouter sans changer le transport
actuel. Les données collectées avant le 2026-09-29 portent encore un
`prescripteurRef` en Nom et ne se raccordent pas aux nouvelles ; leur purge relève de
la gouvernance des données, hors de ce document.

## Risques

| Réf | Risque / à valider | Portée |
|---|---|---|
| **R-8** | Instance mutualisée beta.gouv : les custom dimensions sont indisponibles, ce que l'ADR-0002 contourne en passant par une propriété d'événement. Restent à confirmer la disponibilité des Funnels et les quotas. | partiellement tranché |

## Mises à jour

> **Mise à jour 2026-09-29, mesure par service, sans bandeau.** Le Nom d'événement
> porte désormais l'id Grist du service, en clair, et non plus le `prescripteurRef`
> pseudonymisé, retiré avec l'identification individuelle. Cela **révise** l'ADR-0002 (découpage par service) et
> l'ADR-0003 (plus de drapeau de consentement), et **lève** la réserve RGPD R-4 : la mesure
> redevient une mesure d'audience agrégée, dans l'exemption de consentement CNIL. Le
> risque R-7 devient sans objet. Deux points restent à tenir : l'anonymisation de l'IP,
> qui se règle sur l'instance Matomo et non dans le code (R-10), et les très petits
> services, où un id de service peut désigner une ou deux personnes (R-11).
