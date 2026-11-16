# ADR-0051 - La couverture de la collecte, et les référentiels tirés du code

> Statut : **décidé** · 2026-11-13 · Anciennement ADR-15 de `analytics.md`

**Contexte.** Le dashboard (#440) doit distinguer un zéro d'une collecte absente,
et montrer à zéro ce qui pouvait arriver sans être arrivé : une question jamais
affichée, une version sans simulation. Le journal ne dit que ce qui est arrivé.
Le plan de marquage demande des référentiels versionnés et une couverture : le
début fiable de la collecte, ses interruptions. Une coupure (serveur arrêté,
Grist en panne) ne laisse aucune trace dans le journal.

**Décision.**

1. **Un signe de vie par heure.** Le serveur écrit dans le journal, au démarrage
   puis à chaque heure pleine, un événement `alive` qui porte `app_version` et
   `commit_sha`. Il passe par le même port que les événements des navigateurs.
   Une heure sans `alive` est une heure sans collecte. Son identifiant tient
   l'heure et la version (`alive:2026-11-13T14:0.8.0:f30aafe`) : deux serveurs
   de la même version n'écrivent qu'une ligne par heure, et une version qui
   démarre en cours d'heure a la sienne.
2. **Les versions du serveur.** `app_version` vient du `package.json`, lu au
   démarrage ; `commit_sha` de `CONTAINER_VERSION`, que Scalingo pose sur le
   conteneur, sur 7 caractères, ou `inconnu`.
3. **Aucun référentiel stocké.** Les questions, jalons, issues, motifs, modes,
   documents et champs d'une version se tirent de son code, relu à son tag
   `simulateur-eligibilite@<app_version>` ou au `commit_sha` de ses événements
   (ADR-0050). Les établissements et services sont dans le référentiel Grist, et
   chaque événement porte les deux.
4. **Les calculs viennent avec le dashboard** (#440) : les zéros, le regroupement
   des services, les versions listées, les périodes indisponibles.
5. **Une sonde qui alerte** (#461). `GET /api/journal/v1/alive` répond 200 si
   le journal porte le signe de vie de l'heure ou de l'heure d'avant, 503 sinon,
   ou si le journal ne répond pas. Le workflow planifié
   `.github/workflows/signe-de-vie.yml` l'interroge en production toutes les
   heures et échoue sur un 503 : GitHub prévient alors par courriel. Un appel à
   Grist est abandonné au bout de dix secondes, et le navigateur réessaie un
   envoi que la limite de débit a refusé (429).

**Pourquoi.** La couverture se prouve là où l'événement s'écrit : si le journal
n'écrit plus, le signe de vie manque aussi, sans rien de plus à construire. Le
code d'une version ne se perd pas : le stocker à côté ne ferait que le recopier.
Une lecture écrite avant le dashboard devinerait sa forme, et personne ne
l'appellerait d'ici là.

**Conséquences.** Le journal porte deux sortes d'entrées : les événements de
parcours et `alive`, qui n'a ni simulation ni séquence. Environ 8 800 lignes de
plus par an dans Grist (R-13). Un échec d'écriture du signe de vie se lit dans les
journaux du serveur, sans l'arrêter. Hors production, le journal jette tout,
`alive` compris : la sonde y répond donc 503, et le workflow ne regarde que la
production. Les périodes de validité des établissements et la règle de
population référencée restent à trancher (#440).

## Mises à jour

> **Mise à jour 2026-11-13, la couverture de la collecte (#384).** Chaque heure,
> le serveur écrit dans le journal un signe de vie, `alive`. Une heure sans lui
> ressortira « indisponible » au dashboard, pas « zéro ». Les référentiels ne
> sont pas stockés : ceux d'une version se tirent de son code, et leur lecture
> vient avec le dashboard (#440). Voir l'ADR-0051.
