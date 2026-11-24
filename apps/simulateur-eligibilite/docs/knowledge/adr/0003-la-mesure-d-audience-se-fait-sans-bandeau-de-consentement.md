# ADR-0003 - Mesure sans bandeau de consentement

> Statut : **décidé** · 2026-07-03

**Décision.** Le traceur s'initialise sans demander de
consentement : il est actif en build de production, ou en local sur demande, et
rien d'autre ne le conditionne. Le drapeau de consentement, jamais branché, est retiré du code. S'il
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
| Adresse IP anonymisée | Réglage de l'instance Matomo : l'IP est anonymisée par l'instance, vérifié |
| Information et droit d'opposition | Opt-out dans le pied de page du CMS (ADR-0011) ; texte d'information à publier (R-12) |

**Conséquences.** Plus de bandeau, et la couverture de la mesure est complète. La
réserve R-4 est levée.

## Risques

| Réf | Risque / à valider | Portée |
|---|---|---|
| **R-11** | **Très petits services** : dans un service d'une ou deux personnes, l'id du service désigne de fait des individus. Réserve mineure, acceptée sans traitement dans le code. | conformité |
| **R-12** | **Information des prescripteurs** : l'exemption exige de dire ce qui est mesuré et comment s'y opposer. Le texte, dans la politique de confidentialité du CMS, doit décrire la mesure par service et renvoyer à l'opt-out du pied de page. | conformité, **à publier avant la release** |
