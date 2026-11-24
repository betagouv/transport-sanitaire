# ADR-0042 - Journal des parcours écrit par le backend

> Statut : **décidé** · 2026-11-12

**Contexte.** Le dashboard analytics doit recalculer ses 62 blocs depuis des
événements unitaires, conservés, dédoublonnés et reliés entre eux : une
simulation de P0 à sa fin, un bouton affiché à son clic, un document à son
résultat. Matomo ne sait pas le porter : il ne garde ni identifiant d'événement
dédoublonné, ni séquence, ni lien entre un bouton et son clic. Le responsable du
traitement a donné son accord à cette collecte.

**Décision.** Le navigateur envoie chaque événement à une route de collecte
versionnée de notre backend Express. Le backend valide l'événement contre le
contrat de l'éditeur, liste fermée de champs et règles croisées comprises, y
ajoute ce que le navigateur ne peut pas prouver (date de réception,
environnement), le conserve, et n'accuse réception qu'une fois l'écriture
faite. Un renvoi identique du même `event_id` est ignoré, un autre contenu sous
le même `event_id` est mis à part comme collision.

Le contrat vit dans `shared/analytics/`, en TypeScript : le navigateur n'en
prend que les types, le backend valide avec. Les fichiers `analytics/` du paquet
de l'éditeur en sont les dérivés. Son validateur n'entre pas dans le code : ses
exemples doivent passer notre validateur, et son réducteur sert d'oracle dans
les tests. Si le texte et le code du paquet divergent, le texte fait foi.

Le navigateur envoie chaque événement seul, en `keepalive`, et réessaie
quelques secondes sur une erreur réseau ou un 5xx. Il n'y a ni file ni stockage
dans le navigateur. Le journal ne s'exporte pas : le dashboard le lit par une
API du backend.

Ce que le journal reçoit, événement par événement, est décrit dans
[`journal-des-parcours.md`](../domain/journal-des-parcours.md). Le canal Matomo
est dans [`mesure-d-audience.md`](../domain/mesure-d-audience.md).

**Pourquoi.** Un journal tenu par le backend se dédoublonne, se date et se
filtre en un seul endroit, que le navigateur ne peut pas contourner. Un contrat
dans notre code suit nos règles et se teste sur les exemples de l'éditeur à
chaque livraison. Le réessai sans file couvre une coupure brève pour presque
rien : une perte plus longue se voit sans rien construire, par un trou dans les
`sequence`. Une file sur le disque survivrait à l'onglet, mais elle écrirait sur
le poste du prescripteur, ce que l'[ADR-0003](./0003-la-mesure-d-audience-se-fait-sans-bandeau-de-consentement.md)
écarte.

**Conséquences.**

- Le backend devient un point de passage de la collecte : s'il ne répond pas
  pendant le réessai, ou si l'onglet se ferme entre deux essais, l'événement est
  perdu. La perte se lit dans la couverture.
- Chaque événement fait une écriture : pas de lot, mais un débit à surveiller.
- Aucune adresse IP ni aucun en-tête du navigateur n'est écrit.
- Le choix du prescripteur de s'opposer à la mesure (ADR-0011) vaut aussi pour
  le journal.
- Un rechargement de la page ouvre une nouvelle simulation : l'app ne garde rien
  d'un rechargement à l'autre. Reprendre le même `simulation_id` demanderait un
  stockage dans le navigateur, que l'ADR-0003 écarte.
- Le stockage est derrière un port (ARCH-004) : changer de base ne touche qu'un
  adaptateur.

## Risques

| Réf | Risque / à valider | Portée |
|---|---|---|
| **R-15** | **Durée de conservation** du journal : à fixer avec l'équipe responsable des données. | conformité, plus tard |
