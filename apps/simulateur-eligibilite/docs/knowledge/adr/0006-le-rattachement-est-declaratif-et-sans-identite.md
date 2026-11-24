# ADR-0006 - Rattachement déclaratif, sans identité

> Statut : **décidé** · 2026-07-03

**Décision.** Le prescripteur déclare son établissement et son
service, sans preuve et **sans dire qui il est**.

**Pourquoi.** Le produit a besoin de savoir d'où viennent les simulations, pas qui les
fait. Le nom du prescripteur n'a jamais servi qu'au suivi analytique individuel, qui
rendait la mesure quasi nominative et imposait un bandeau de consentement. Sans lui, la
mesure agrégée par service reste dans l'exemption CNIL (voir
[ADR-0003](./0003-la-mesure-d-audience-se-fait-sans-bandeau-de-consentement.md)). La déclaration reste suffisante et simple.

**Conséquences.** L'usurpation déclarative d'un établissement ou d'un service reste
possible, et le rattachement n'a aucune valeur probante (voir [le rattachement](../domain/rattachement.md)). Une
authentification individuelle (ProConnect, AgentConnect) reste possible plus tard ;
elle serait une étape **distincte** du rattachement, appelée identification, et non
une extension de celui-ci.

## Risques

| Réf | Risque / à valider | Portée |
|---|---|---|
| **R-5** | Le rattachement n'est pas signé, donc l'usurpation déclarative d'un établissement ou d'un service reste possible. Acceptable tant que la mesure n'a pas de valeur probante. | sécurité |
