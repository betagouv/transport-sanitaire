# ADR-0049 - Les rechargements de page

> Statut : **décidé** · 2026-11-13 · Anciennement ADR-13 de `analytics.md`

**Contexte.** Un rechargement crée une nouvelle simulation, et l'ancienne reste
sans fin (R-14). La reprise (#392) garderait l'état du parcours dans le
navigateur : plusieurs jours de travail, des textes médicaux et l'adresse du
patient dans le stockage de session, et une révision des ADR-0003 et ADR-0010. Rien ne
dit encore que les prescripteurs rechargent. Le navigateur donne le type de
chargement d'une page (`PerformanceNavigationTiming.type`) : `navigate`,
`reload` ou `back_forward`. Mais dans l'iframe du CMS, vérifié sous Chrome, un
rechargement de la page du CMS laisse l'iframe se dire `navigate`.

**Décision.**

1. **Mesurer avant de reprendre.** #392 attend les chiffres. Si les
   rechargements sont rares, elle ne se fait pas.
2. **Le complément.** `simulation_started` porte `navigation` : `navigate`,
   `reload` ou `back_forward`. Un type inconnu, ou pas de réponse, et le
   complément manque.
3. **La première simulation seulement.** « Faire une nouvelle simulation » ne
   recharge pas la page : les simulations suivantes de la page ne portent pas
   `navigation`.
4. **Le CMS le donne.** Le simulateur demande
   `chargement-simulateur:demande` à la page qui l'embarque, au démarrage. Le
   script du CMS répond `chargement-simulateur:type`, avec le type de sa propre
   page. Hors iframe, le simulateur lit le sien.

**Pourquoi.** Une mesure coûte quelques lignes, la reprise plusieurs jours et des
données de santé dans le navigateur. Le type du navigateur est le seul signal
fiable d'un rechargement : sans stockage, une simulation ne sait rien de la
précédente. Seule la page du CMS voit le sien, d'où la question au script qui
répond déjà au simulateur (ADR-0011). La demande part avec le conteneur, bien avant
que le rattachement ouvre la simulation : la réponse est là, sans délai à
attendre. Seule la page parente est écoutée, sans vérifier son origine : le
message ne porte qu'un type que le contrat borne.

**Conséquences.** Le contrat de nos compléments reste en version 2 :
`navigation` s'y ajoute. Le script du CMS est à recoller dans Sites Conformes ;
d'ici là, dans l'iframe, `navigation` manque. La part des `reload` parmi les
premières simulations se lit dans le journal. Un rechargement par le navigateur
d'un onglet resté ouvert (mise en veille, mémoire) compte aussi en `reload`.

## Risques

| Réf | Risque / à valider | Portée |
|---|---|---|
| **R-14** | **Reprise après rechargement** : garder le même `simulation_id` après un rechargement demande un stockage dans le navigateur, que l'ADR-0003 écarte. D'ici #392 (priorité basse), un rechargement crée une nouvelle simulation et l'ancienne reste sans fin. La première simulation d'une page dit si elle a été rechargée (ADR-0049) : #392 attend ces chiffres. | décidé, plus tard |

## Mises à jour

> **Mise à jour 2026-11-13, les rechargements de page (#434).** La première
> simulation d'une page dit comment la page s'est chargée : ouverte, rechargée,
> ou rouverte par l'historique. Dans l'iframe, c'est le script du CMS qui le
> donne. La mesure dira si la reprise après rechargement (#392) vaut d'être
> faite. Voir l'ADR-0049.
