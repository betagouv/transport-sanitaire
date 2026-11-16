# ADR-0001 - Matomo mutualisé hébergé par beta.gouv.fr

> Statut : **décidé** · 2026-07-03 · Anciennement ADR-1 de `analytics.md`

**Décision.** Utiliser l'instance Matomo mutualisée que beta.gouv.fr héberge pour
les produits publics, un service fourni par la communauté beta.gouv et la DINUM,
plutôt qu'une instance auto-hébergée, un backend de collecte maison ou un outil
tiers non souverain.

**Pourquoi.** Matomo couvre le suivi d'événements, les funnels et la segmentation
sans qu'on ait à construire de stockage ni de reporting. L'instance beta.gouv est
hébergée en France et gérée par l'infra publique, ce qui répond à la souveraineté
et à la conformité attendues d'un service public, cohérent avec le DSFR, et ne nous
laisse aucune opération à assurer.

**Conséquences.** Il faut demander la création d'un site dans le Matomo beta.gouv
et récupérer le `siteId` et l'URL du tracker. Les fonctionnalités disponibles
(Funnels, Custom Dimensions) et les quotas dépendent de la configuration de cette
instance mutualisée, qui reste à confirmer (voir R-8). Les réglages de
confidentialité de l'instance, dont l'anonymisation de l'IP, ne sont pas entre nos
mains (voir R-10).

Depuis le 2026-11-12, Matomo ne porte plus que la mesure d'audience. Il ne garde ni
identifiant d'événement dédoublonné, ni séquence, ni lien entre un bouton affiché et
son clic : le journal des parcours qu'attend le dashboard passe par notre backend
(ADR-0042).
