# ADR-0005 - Intégration par iframe dans le CMS

> Statut : **décidé** · 2026-07-03

**Décision.** L'app entière, rattachement et simulateur, est **embarquée en
iframe** dans une page Sites Conformes.

**Pourquoi.** Aucune navigation top-level entre deux apps : tout le
parcours vit dans le même iframe, ce qui simplifie l'intégration puisqu'il n'y a qu'une
origine à autoriser et aucun saut de contexte. Le choix produit est conservé : garder le
parcours dans le site CMS.

**Conséquences.** On dépend toujours de la coopération du CMS, pour les attributs
`sandbox` et la CSP (`frame-ancestors`, `frame-src`), voir plus bas et le risque R-1. Le
suivi analytics ayant lieu dans l'iframe, donc en contexte tiers, il est sans cookie (ADR-0003). Le repli sans iframe, en ouvrant
l'app en top-level, reste possible si l'intégration iframe se révèle bloquée.

## Points d'attention de l'iframe

Tout le parcours vit dans le même iframe, rattachement et simulation compris. Il n'y
a pas de navigation top-level, donc pas besoin d'`allow-top-navigation-by-user-activation`. Le code de Sites Conformes, open source,
a été lu le 2026-09-30 (commit `bb64754`). Restent :

- **`sandbox`** : le bloc iframe de Sites Conformes n'en pose pas par défaut. Ses
  « paramètres » libres permettraient d'en ajouter un ; il faudrait alors
  `allow-scripts` et `allow-forms`, plus `allow-same-origin` pour que l'app garde son
  origine.
- **CSP** : notre app doit servir `Content-Security-Policy: frame-ancestors
  https://<domaine-cms>`, et surtout pas `X-Frame-Options: DENY`. Côté CMS, la seule CSP
  émise est son propre `frame-ancestors` : ni `frame-src` ni `script-src` ne bloquent
  notre iframe. Des en-têtes ajoutés par l'hébergement de l'instance restent possibles,
  à vérifier sur la vraie page.
- **`postMessage`** : il sert à l'opt-out de la mesure d'audience, tenu par
  le pied de page du CMS (voir [ADR-0011](./0011-le-cms-tient-l-opt-out-et-le-transmet-a-l-iframe.md)). Le CMS l'autorise
  par ses réglages « Scripts personnalisés », qui injectent un script sur chaque page.
- **Cookies tiers** : ils sont bloqués dans l'iframe, par ITP et par Chrome. Le tracking
  ayant lieu dans l'iframe, le traceur est sans cookie
  (`disableCookies`) pour fonctionner sans eux (cf. [ADR-0003](./0003-la-mesure-d-audience-se-fait-sans-bandeau-de-consentement.md)).
- **Non-indexation** : l'app est destinée à être embarquée, la page canonique étant celle
  du CMS, donc l'URL brute ne doit pas être indexée. Le backend sert `X-Robots-Tag:
  noindex, nofollow` sur toutes les réponses et un `robots.txt` en `Disallow: /`, doublés
  d'un `<meta name="robots" content="noindex, nofollow">` dans `index.html`.

## Risques

| Réf | Risque / à valider | Portée |
|---|---|---|
| **R-1** | **Coopération Sites Conformes** : **Levé côté CMS**, à la lecture de son code (2026-09-30) : le bloc iframe ne pose pas de `sandbox`, la seule CSP émise est `frame-ancestors`, et les scripts personnalisés permettent l'opt-out. Reste de notre côté : servir `frame-ancestors` avec le domaine du CMS, et vérifier sur la page réelle qu'aucun en-tête d'hébergement ne bloque l'iframe. | intégration, à finir quand le domaine du CMS est connu |
