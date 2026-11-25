# Le journal des parcours

> Ce que le backend reçoit, garde et rend de chaque simulation. Ce qui part ou
> non, les deux canaux et le consentement sont dans
> [`mesure-d-audience.md`](mesure-d-audience.md). Les identifiants sont définis
> dans [`../CONTEXT.md`](../CONTEXT.md). La décision d'écrire ce journal côté
> serveur est dans [ADR-0042](../adr/0042-le-backend-ecrit-le-journal-des-parcours.md),
> son découpage en ports dans [ARCH-004](../contributing/regles-d-architecture.md).

## Ce que le journal reçoit

Un événement par fait affiché, validé ou demandé, du premier écran à la fin de la
simulation. Le tableau de bord de l'éditeur en recalcule ses indicateurs.

**Le contrat est celui de l'éditeur**, v10.2.2 (`analytics/` de son livrable),
sans complément. Le code le recopie dans `shared/analytics/` : les types pour le
navigateur, la validation (`zod`) pour le serveur.

| Qui | Ce qu'il fait |
|---|---|
| le navigateur | envoie chaque événement seul, en `keepalive`, vers `POST /api/journal/v1/events` |
| le serveur | refuse (400) tout champ hors liste, tout champ mal formé et toute règle croisée enfreinte (`shared/analytics/contract-rule.vo.ts`) |
| le serveur | ajoute la date de réception, l'environnement, le commit du serveur et la version de nos colonnes (`schema_version`) |
| le serveur | refuse (422) un établissement absent du référentiel, ou un service hors de son établissement : l'événement va en quarantaine, avec sa raison |
| le serveur | ignore un renvoi identique, et met à part (409) un autre contenu sous le même `event_id` |

Un contrat fermé empêche une réponse ou un texte saisi d'entrer dans le
journal. Un onglet ouvert sur un autre contrat est refusé de même. Le refus
laisse sa raison dans les traces du serveur (version, noms de champs, numéro de
règle), jamais le contenu.

Le serveur n'accuse réception (204) qu'une fois l'événement écrit. Sur une erreur
réseau, un 5xx ou un 429, le navigateur réessaie après 0,5, 1, 2 puis 4 secondes,
puis abandonne. Il n'a ni file ni stockage : une file sur le disque écrirait sur
le poste du prescripteur. Une perte se lit dans les trous de `sequence`. Sur
refus de la mesure, rien n'est envoyé (voir
[le consentement](mesure-d-audience.md#le-consentement)). Aucune adresse IP ni
en-tête du navigateur n'est écrit.

## L'enveloppe de chaque événement

Le parcours numérote et date chaque événement.

| Champ | Ce qu'il dit |
|---|---|
| `event_id` | `<simulation_id>:<sequence>` |
| `simulation_id` | l'identifiant de la simulation |
| `sequence` | le rang dans la simulation, à partir de 1, sans trou |
| `occurred_at` | la date côté navigateur |
| `version` | la version du contrat, `10.2.2` |
| `model_version` | la version des règles du modèle, lue dans `rules/VERSION` |
| `app_version` | la version de l'app, lue dans `package.json` au build |
| `activity_origin` | `user` pour un geste ou un affichage que le prescripteur voit, `background` pour ce que l'app fait seule |
| `establishment_id`, `service_id` | le rattachement, quand il en a |
| `is_test` | toujours faux : une simulation ouverte sur une seed n'envoie rien |

Le tableau de bord range les simulations par `model_version`. Le commit n'est
pas dans l'événement, que le contrat ferme : le serveur écrit en colonne celui de
la version qui reçoit, qui peut différer de celui d'un onglet resté sur un ancien
build. `activity_origin` est `background` pour `button_exposed`,
`feedback_exposed`, `document_typography_measured`,
`document_generation_failed` et `document_download_succeeded`.

**Le rattachement.** Les ids du référentiel partent sur chaque événement, jamais
un nom. Un service ne part qu'avec son établissement. Une saisie libre attend que
le référentiel la crée, et part avec les ids créés. Si le référentiel ne répond
pas, le parcours part sans rattachement. Voir
[`rattachement.md`](rattachement.md).

## Le questionnaire

| Événement | Quand | Champs propres |
|---|---|---|
| `simulation_started` | l'ouverture, sur P0 | `screen` |
| `intent_selected` | le premier choix validé en P0, une fois | `intent` : `eligibilite_seule` ou `eligibilite_et_prescription` |
| `phase_entered` | le premier affichage d'une page de P1, P2 ou P3 | `screen` ; en P3, la `revision` du R2 qui l'ouvre |
| `phase_boundary_displayed` | l'affichage de la première ou de la dernière page d'une phase | `screen`, `boundary` (`first`, `last`), `page_id` |
| `question_exposed` | une question apparaît dans un affichage de page | `question_id`, `page_id`, `exposure_id` |
| `question_interacted` | la saisie change de question | idem |
| `question_validated` | la page est validée, pour chaque question affichée | idem |
| `phase_completed` | la première validation qui quitte la phase | `screen` |

- Un **affichage de page** naît quand le simulateur ouvre une page (un bouton, un
  lien de correction, le bouton Retour), jamais d'un simple rendu. Il n'est pas
  envoyé : il fait l'exposition, `<simulation>:v<n>:<question>`. Une
  sous-question qu'un brouillon révèle est exposée dans le même affichage.
- `page_id` est l'id de la page du modèle, sans traduction (`P2/trajet`). Q2.2.1
  en a deux : `P2/contextes-situations` et `P2/contextes-soins`.
- Les **limites de phase** se lisent d'après les réponses validées. Une limite
  part une fois par page : si une réponse ouvre une page de plus, la dernière
  page change et dit sa limite à son tour.
- `phase_entered` et `phase_completed` partent une fois par simulation et par
  phase. Une correction qu'une alerte ouvre reste dans la même simulation, et
  une validation qu'elle fait tomber ne se dit pas.

## Le premier résultat

| Événement | Quand | Champs propres |
|---|---|---|
| `result_displayed` | le contenu du R2 est chargé, une fois par révision | `revision`, `can_complete`, `issue`, `support`, `transport_composition`, `mode`, `reason_codes` |
| `result_invalidated` | une page de P1 ou de P2 change les réponses validées | `screen` (la phase), `revision` |

- La **révision** (`r1`, `r2`…) est numérotée par la simulation. Un R2 réaffiché
  sans modification garde la sienne. Une révision tombée ne revient pas, même si
  les réponses redeviennent celles d'avant. Revalider sans rien changer, ou
  reculer, ne fait rien tomber. Le complément ne touche pas au R2.
- Le modèle déclare ce que le R2 donne au journal (`Model.resultCodes`). Le socle
  l'évalue et l'envoie sans connaître les cibles, et sans poser de question de
  plus.
- `issue` et `support` sont toujours là. Quand les règles ne les donnent pas, ou
  que le modèle ne déclare pas ses codes, le R2 ne part pas et n'ouvre aucune
  révision : ni bouton, ni avis, ni document ne s'y rattache.
- `reason_codes` vaut `[cible_reason_code]`.
- `transport_composition` vaut `terrestrial_only`, `regular_line_only`, `mixed`,
  `unknown` ou `not_applicable`. Elle vient des codes du modèle, jamais du texte
  affiché. `mode` n'accompagne que `terrestrial_only` et `mixed` (l'un des cinq
  modes terrestres). Sans support (`AUCUN`), la composition vaut
  `not_applicable`.
- Le motif que le R2 affiche et le financeur ne partent pas.

## Le document R3

| Événement | Quand | Champs propres |
|---|---|---|
| `document_displayed` | le PDF est prêt et affiché, une fois par version | `revision`, `document_revision`, `document_id`, `support`, `transport_composition`, `mode` |
| `document_invalidated` | une page de P3 change les réponses, un document étant affiché | `screen` (`P3`), `revision`, `document_revision` attendue |
| `document_generation_failed` | chaque tentative ratée, la première et chaque nouvel essai | `revision`, `support`, sans cause |
| `document_typography_measured` | avec `document_displayed` | voir la taille imprimée |
| `document_print_requested`, `document_download_requested` | l'app lance vraiment l'impression ou le téléchargement | `revision`, `document_revision`, `document_id` |
| `document_download_succeeded` | le PDF est remis au navigateur | idem |

- La **révision du document** (`dr1`, `dr2`…) naît sous une révision du R2, au
  premier document affiché. Elle ne change que si le complément change les
  réponses.
- La **version** (`d1`, `d2`…) change dès que le PDF change. Son empreinte :
  le contenu (nom du fichier daté, données du cerfa), la taille imprimée des
  champs et la révision du document. Le même document réaffiché au retour sur R3
  garde sa version et ne repart pas. Un même document imprimé autrement ouvre une
  version, pas une révision.
- Un document garde la composition de son propre R2. Sans révision du R2 ou
  sans support de cerfa, aucune version ne s'ouvre et rien ne part.

## Les boutons

Cinq boutons : « Imprimer » et « Télécharger » sur la fiche patient de R2, les
mêmes sur le document R3, et « Donner mon avis ».

| Événement | Champs propres |
|---|---|
| `button_exposed`, `button_clicked` | `button_id` (`patient_sheet_print`, `patient_sheet_download`, `document_print`, `document_download`), `screen` (`R2` ou `R3`), `exposure_id`, `revision`, `artifact_id` |
| `feedback_exposed`, `feedback_clicked` | `exposure_id`, `screen`, `revision` ; en R3, `document_id` |

- `artifact_id` est la version de la fiche en R2 (`f1`, `f2`…, une par révision
  qui en montre une), le document en R3, où il vaut `document_id` et porte
  `document_revision`.
- Un bouton est **exposé** tant qu'il est posé et utilisable à la même place.
  `exposure_id` (`<simulation>:b<n>`) ne change qu'après une vraie disparition
  (écran quitté, document en édition, en aperçu ou régénéré), pour une autre
  version de l'objet ou une autre révision. Un remontage technique garde la
  sienne. Un bouton grisé n'est ni exposé ni cliqué, et la position dans la
  fenêtre ne compte pas : c'est un bouton offert, pas vu.
- Un clic envoie `button_clicked` sous l'exposition du bouton, avec
  `activity_origin = user` : un clic par exposition. Sur R3, l'impression ou le
  téléchargement qu'il lance part ensuite (`document_print_requested`,
  `document_download_requested`), y compris quand le clic a relancé une
  génération ratée. Ce clic-là n'a pas de version : il n'envoie rien d'autre.
- `document_download_succeeded` dit que le fichier est remis au navigateur, pas
  enregistré : le code ne voit pas plus loin.

## La taille imprimée

`document_typography_measured` part une fois par version du document, avec
`revision`, `document_revision`, `document_id` et `support`, et se relie aux
impressions par `document_id`. `expected_field_ids` nomme les champs remplis,
`field_measurements` la taille (`field_id`, `font_size_pt`) de ceux qui ont pu se
mesurer.

- Un champ se nomme par l'identifiant de la liste fermée de l'éditeur,
  `<support>.<champ>` (`shared/analytics/typographic-fields.constants.ts`). Les deux
  parties d'une adresse de départ ou d'arrivée sont un seul champ,
  `*_adresse_native`. Les cases n'en sont pas.
- `font_size_pt` est la taille où le texte s'imprime après le calcul qui le fait
  tenir, pas la taille de départ. Un texte porté par plusieurs volets garde sa
  plus petite taille, celle que le lecteur subit.
- Le serveur refuse un champ hors liste, d'un autre support, en double, ou
  mesuré sans être attendu. Un `document_id` n'a qu'une mesure : la même, rejouée
  sous un autre `event_id`, est ignorée, une autre est mise à part.
- Aucun texte ni longueur de texte ne part.

## La fin d'une simulation et le rechargement

| Événement | Quand | Champs propres |
|---|---|---|
| `simulation_closed` | « Faire une nouvelle simulation » | `closure_reason = new_simulation` |

La fermeture part sous le numéro qui suit le dernier événement, et plus rien ne
part ensuite sous cette simulation. La suivante repart à 1. Le contrat connaît
aussi `inactivity` et `explicit_end`, que l'app n'envoie pas encore.

**Un rechargement de la page du CMS ouvre une nouvelle simulation** et laisse
l'ancienne sans fin. Le contrat n'a pas de champ pour le dire. Reprendre la
simulation après un rechargement demanderait de garder dans le navigateur des
jours de travail, des textes médicaux et l'adresse du patient : ce stockage est
écarté tant qu'une mesure ne le justifie pas.

## La couverture

Le journal ne dit que ce qui est arrivé : une coupure n'y laisse aucune trace.

- **Un signe de vie par heure.** Le serveur écrit `alive` au démarrage puis à
  chaque heure pleine, avec `app_version` et `commit_sha`, sans simulation ni
  `sequence`. Son identifiant tient l'heure et la version : deux serveurs de la
  même version n'écrivent qu'une ligne par heure. Une heure sans `alive` est une
  heure sans collecte, pas sans usage.
- **Une sonde.** `GET /api/journal/v1/alive` répond 200 si le journal porte le
  signe de vie de l'heure ou de l'heure d'avant, 503 sinon. Le workflow
  `.github/workflows/signe-de-vie.yml` l'interroge en production chaque heure et
  échoue sur un 503 : GitHub prévient par courriel. Hors production, le journal
  jette tout, `alive` compris : la sonde y répond 503.
- **Aucun référentiel stocké.** Les questions, issues, modes, documents et champs
  d'une version se tirent de son code, au tag `simulateur-eligibilite@<app_version>`
  ou au commit de ses événements : le stocker ne ferait que le recopier. Les
  établissements et services sont dans le référentiel Grist.

## Le stockage et la lecture

Le journal s'écrit dans la base PostgreSQL de l'addon Scalingo
(`SCALINGO_POSTGRESQL_URL`). Sans elle, le serveur prend un journal qui accepte
les événements sans en garder aucun : la mémoire ne grossit pas avec le trafic.

| Table | Contenu |
|---|---|
| `journal_events` | les événements et les signes de vie ; `event_id` est unique, ce qui écarte un renvoi simultané |
| `journal_collisions` | un événement qui reprend un `event_id` avec un autre contenu |
| `journal_quarantine` | un événement hors du référentiel, avec sa `reason` |

Chaque ligne a des colonnes communes pour filtrer (identifiants, `type`, dates,
`environment`, `commit_sha`, `schema_version`, `is_test`, établissement et
service) et l'événement entier en `jsonb` dans `payload` : la table ne bouge pas
quand le contrat gagne un champ. Elle se crée à la première requête.

**La lecture** sert le tableau de bord : `GET /api/journal/v1/events`, avec
`after` (un curseur) et `limit` (100 par défaut, 1 000 au plus). Elle exige
`Authorization: Bearer <jeton>`, le jeton partagé `JOURNAL_READ_TOKEN`, car le
journal porte l'établissement et le service de chaque parcours. Sans jeton
configuré, la route n'est pas montée. Les entrées viennent dans l'ordre
d'arrivée, par curseur et non par numéro de page : le journal grossit pendant
qu'on le lit. La réponse donne `entries` et `next`, nul en fin de journal.
