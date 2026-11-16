# ADR-0003 - Mesure sans bandeau de consentement (~~initialisation derrière un flag de consentement~~)

> Statut : **décidé** · 2026-07-03 · Anciennement ADR-3 de `analytics.md`

**Décision (révisée 2026-09-29).** Le traceur s'initialise sans demander de
consentement : il est actif en build de production, ou en local sur demande, et
rien d'autre ne le conditionne. ~~L'initialisation du tracking est conditionnée par
un composant de gestion du consentement, donné par défaut et sans bandeau en phase
expérimentale.~~ Le drapeau de consentement, jamais branché, est retiré du code. S'il
fallait un jour un bandeau, on le rajouterait à ce moment-là.

**Pourquoi.** La recommandation CNIL exempte de consentement la mesure d'audience
qui reste agrégée, sans suivi individuel ni recoupement entre sites. Le suivi par
prescripteur sortait de ce cadre : il était quasi nominatif. Le suivi par service y
revient, pourvu que les conditions techniques tiennent :

| Condition d'exemption | Comment elle tient |
|---|---|
| Pas de traceur persistant sur le terminal | Traceur cookieless (`disableCookies`), rien en `localStorage` |
| Finalité de mesure d'audience seule | Événements de parcours et compteurs, aucune réponse détaillée |
| Pas de suivi individuel | Nom d'événement = service, jamais une personne (voir R-11) |
| Pas de recoupement avec d'autres traitements | Instance Matomo dédiée aux produits beta.gouv, aucun export croisé |
| Adresse IP anonymisée | Réglage de l'instance Matomo, à vérifier (R-10) |
| Information et droit d'opposition | Opt-out dans le pied de page du CMS (ADR-0011) ; texte d'information à publier (R-12) |

**Conséquences.** Plus de bandeau, et la couverture de la mesure est complète. La
réserve R-4 est levée, à la condition R-10 près. ~~Tant que le sujet RGPD n'est pas
tranché, la collecte individuelle sans bandeau est une réserve de conformité
explicite.~~

## Risques

| Réf | Risque / à valider | Portée |
|---|---|---|
| **R-10** | **Anonymisation de l'IP** : l'exemption CNIL l'exige, et elle se règle sur l'instance Matomo (Administration → Confidentialité), pas dans le code. À confirmer auprès des admins de stats.beta.gouv.fr pour le site 275. | conformité, **à vérifier avant la release** |
| **R-11** | **Très petits services** : dans un service d'une ou deux personnes, l'id du service désigne de fait des individus. Réserve mineure, acceptée sans traitement dans le code. | conformité |
| **R-12** | **Information des prescripteurs** : l'exemption exige de dire ce qui est mesuré et comment s'y opposer. Le texte, dans la politique de confidentialité du CMS, doit décrire la mesure par service et renvoyer à l'opt-out du pied de page. | conformité, **à publier avant la release** |

## Mises à jour

> **Mise à jour 2026-09-29, mesure par service, sans bandeau.** Le Nom d'événement
> porte désormais l'id Grist du service, en clair, et non plus le `prescripteurRef`
> pseudonymisé, retiré avec l'identification individuelle. Cela **révise** l'ADR-0002 (découpage par service) et
> l'ADR-0003 (plus de drapeau de consentement), et **lève** la réserve RGPD R-4 : la mesure
> redevient une mesure d'audience agrégée, dans l'exemption de consentement CNIL. Le
> risque R-7 devient sans objet. Deux points restent à tenir : l'anonymisation de l'IP,
> qui se règle sur l'instance Matomo et non dans le code (R-10), et les très petits
> services, où un id de service peut désigner une ou deux personnes (R-11).
