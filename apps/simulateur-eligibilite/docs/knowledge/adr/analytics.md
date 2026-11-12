# Architecture : Analytics de parcours

> Statut : **décidé (release officielle)** · Dernière mise à jour : 2026-11-12
>
> Suivi analytique du parcours dans le simulateur d'éligibilité.
> Repose sur le rattachement établissement/service fourni par l'écran de rattachement :
> voir [identification.md](./identification.md).
>
> **Mise à jour 2026-11-12, journal des parcours (#380, #381).** Le simulateur collecte
> désormais chaque parcours, rattaché à son établissement et à son service, pour le
> dashboard analytics à venir. Le navigateur envoie les événements à notre backend,
> qui les écrit dans le document Grist « Simulateur-Parcours » (ADR-6). Aucun contenu
> de champ libre n'en fait partie. Le responsable du traitement a donné son accord
> à cette collecte. Cela **révise** le §1 (« aucun backend applicatif ne collecte les
> événements ») et l'invariant, et **étend** l'opt-out (ADR-5) au journal. Matomo
> reste en place pour la mesure d'audience (ADR-1). Le même jour, au cadrage de #382 :
> le journal suit la clean architecture, Grist n'en est que le premier adaptateur (ADR-7) ;
> notre contrat s'écrit d'après ANA-1015, le code du paquet ne sert qu'aux tests ; le
> navigateur envoie chaque événement seul et réessaie quelques secondes, sans file ;
> le journal ne s'exporte pas, le dashboard le lira par une API à venir.
>
> **Mise à jour 2026-10-29, indicateur de parcours ALD.** À chaque arrivée sur le
> premier résultat, un parcours ALD envoie son verdict, avec le nombre de questions
> posées de P1 à P2 (§4). Le modèle déclare ce qui compte, le socle compte et envoie
> (D-228 à D-231 du journal de la v10).
>
> **Mise à jour 2026-10-06, vidage avant la v10.** Les événements de résultat et de
> téléchargement de CERFA sont retirés avec le modèle v9 qui les définissait, et les
> noms d'action perdent leur préfixe d'outil (`prescripteur:`, `secretariat:`) : il
> n'y a plus qu'un parcours. Il reste les quatre événements de parcours (§4). Les
> séries Matomo antérieures portent les anciens noms et ne se raccordent pas aux
> nouvelles. Les événements de résultat reviendront avec la v10.
>
> **Mise à jour 2026-09-30, opt-out dans le pied de page du CMS.** L'exemption CNIL
> demande d'informer le prescripteur et de le laisser s'opposer à la mesure. L'opt-out
> vit dans le pied de page de Sites Conformes, hors de notre iframe, et le choix est
> transmis au simulateur par `postMessage` (ADR-5). Le traceur attend ce choix avant
> de mesurer, et ne suit plus les liens sortants. Le texte d'information reste à
> publier sur le CMS (R-12).
>
> **Mise à jour 2026-09-29, mesure par service, sans bandeau.** Le Nom d'événement
> porte désormais l'id Grist du service, en clair, et non plus le `prescripteurRef`
> pseudonymisé, retiré avec l'identification individuelle. Cela **révise** l'ADR-2 (découpage par service) et
> l'ADR-3 (plus de drapeau de consentement), et **lève** la réserve RGPD R-4 : la mesure
> redevient une mesure d'audience agrégée, dans l'exemption de consentement CNIL. Le
> risque R-7 devient sans objet. Deux points restent à tenir : l'anonymisation de l'IP,
> qui se règle sur l'instance Matomo et non dans le code (R-10), et les très petits
> services, où un id de service peut désigner une ou deux personnes (R-11).

## 1. Contexte & objectifs

On veut suivre le parcours de simulation :

- qui démarre le formulaire ;
- qui l'achève ;
- qui l'abandonne, et à quelle étape ;
- le nombre de résultats éligibles et non éligibles par service ;
- la part des parcours ALD qui arrivent au résultat en six pages et six questions
  au plus (#148) ;
- depuis le 2026-11-12, tout ce que les 62 blocs du dashboard analytics demandent :
  ce qui a été réellement affiché (P0, questions, R2, R3, boutons), ce qui a été
  validé ou demandé, et comment le parcours finit. Le dashboard sera livré après le
  simulateur et recalculera l'historique depuis ce journal (#380).
  ~~par prescripteur~~ (jusqu'au 2026-09-29).

Le découpage par service s'appuie sur l'id du service dans le référentiel Grist,
fourni par l'étape de rattachement et gardé en mémoire de session (cf.
[identification.md, ADR-4](./identification.md)). La mesure d'audience part
directement du navigateur vers Matomo. Le journal des parcours passe par notre
backend, qui le conserve, dans Grist pour commencer (ADR-6, ADR-7). ~~Aucun backend applicatif ne collecte les
événements.~~ (jusqu'au 2026-11-12)

**Invariant** : aucune donnée patient, aucune PII, aucun contenu de champ libre et
aucune valeur de réponse ne part, ni vers Matomo ni vers le journal. Transitent les
ids de l'établissement et du service du référentiel, des identifiants techniques
opaques (simulation, événement, exposition, révision), les codes des questions
affichées et l'état de leur validation, et les codes de résultat (issue, motifs,
mode, support, financeur). Le service libre saisi sous « Autre » n'en fait pas
partie. ~~Seuls transitent l'id d'un service du référentiel et des compteurs
d'événements.~~ (jusqu'au 2026-11-12)

## 2. Décisions (ADR)

### ADR-1 - Matomo mutualisé hébergé par beta.gouv.fr

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
(ADR-6).

### ADR-2 - Découpage par service via propriété d'événement (~~par prescripteur~~)

**Décision (révisée 2026-09-29).** L'id Grist du service est porté en propriété
d'événement Matomo : chaque `trackEvent` l'a pour Nom, avec `simulateur` en catégorie
et le type d'événement en action. Un service saisi sous « Autre » donne l'id de
l'entrée « Autre » de son établissement, une structure (libéral, Assurance Maladie,
autre) donne l'id de son service sous l'établissement fourre-tout, un établissement
saisi à l'écran ne donne aucun Nom, et le rattachement dégradé, quand le référentiel
ne répond pas, donne `autre` (voir [identification.md, ADR-4 et §4](./identification.md)). Le reporting utilise le
rapport Événements, en Catégorie puis Action puis Nom, et la segmentation
`eventName == <id du service>`. ~~Le Nom portait le `prescripteurRef`, un
`HMAC-SHA256` calculé côté backend sur l'identité d'un prescripteur nommé.~~

**Pourquoi.** L'instance mutualisée beta.gouv n'expose pas les custom dimensions,
le plugin ou les droits n'étant pas disponibles (R-8). Les propriétés d'événement
donnent le découpage entre éligibles et non éligibles par service, sans
configuration admin ni backend de croisement. L'établissement n'est pas transmis : il
se déduit du service via le référentiel. Le service suffit au pilotage du produit, et
ne désigne pas une personne. Il part en clair : sans personne à masquer, un
pseudonyme n'apportait plus rien (voir [identification.md, ADR-4](./identification.md)).

**Conséquences.** Le nom d'un service se lit dans Grist à partir de son id, sans
secret. Qui a accès au Matomo mutualisé peut, avec le référentiel, savoir quels
établissements utilisent l'outil. Si les custom
dimensions deviennent disponibles, on pourra les ajouter sans changer le transport
actuel. Les données collectées avant le 2026-09-29 portent encore un
`prescripteurRef` en Nom et ne se raccordent pas aux nouvelles ; leur purge relève de
la gouvernance des données, hors de ce document.

### ADR-3 - Mesure sans bandeau de consentement (~~initialisation derrière un flag de consentement~~)

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
| Information et droit d'opposition | Opt-out dans le pied de page du CMS (ADR-5) ; texte d'information à publier (R-12) |

**Conséquences.** Plus de bandeau, et la couverture de la mesure est complète. La
réserve R-4 est levée, à la condition R-10 près. ~~Tant que le sujet RGPD n'est pas
tranché, la collecte individuelle sans bandeau est une réserve de conformité
explicite.~~

### ADR-4 - Référentiel figé des noms d'évènement, jamais composés

**Décision.** Le nom de chaque évènement Matomo est une valeur fixe d'un
référentiel unique (`front/socle/analytics/events.ts`, `EventName`), jamais
composé à la volée par concaténation de chaîne. Ce module n'interprète aucune
donnée métier — ni l'outil, ni le statut d'un résultat, ni le formulaire d'un
CERFA : c'est l'appelant qui choisit l'entrée à émettre, via
`trackEvenement(nom)`. Un nom qui n'est pas une valeur exacte du référentiel
ne compile pas.

**Pourquoi.** Composer un nom à l'exécution (`${outil}:${action}`,
`resultat:${statut}`) rend le vocabulaire ingrepable — aucun symbole ne
correspond au nom réellement envoyé à Matomo — et ne protège d'aucune valeur
incohérente. `cible_cas_final` et `cible_resultat_medical`, deux cibles
publicodes dont la valeur est une phrase d'affichage (jusqu'à 152 caractères
pour l'une d'elles, VSL/TPMR), aggravaient le problème : les utiliser telles
quelles comme nom d'évènement aurait rendu les rapports Matomo dépendants du
phrasé exact du modèle, livré par l'éditeur et sujet à reformulation sans
changement de sens.

**Conséquences.** `outil` (`prescripteur`/`secretariat`) et, pour un résultat,
un **slug court** font désormais partie du nom lui-même — voir §4 pour la
liste complète. Le slug est traduit depuis la phrase publicodes par
l'appelant, pas par le référentiel (`SLUG_CAS_FINAL` dans `Secretariat.tsx`,
`SLUG_RESULTAT_MEDICAL` dans `Prescripteur.tsx`) ; une phrase absente de la
table (montée de version du modèle) retombe sur le slug `indetermine` plutôt
que de faire échouer le parcours pour un souci d'analytics. Les CERFA suivent
le même principe : `formulaire` (typé `Formulaire`, réutilisé par
`DocumentCerfa.fichier`) fait partie du nom, un par document produit.

### ADR-5 - Opt-out tenu par le CMS, transmis à l'iframe par `postMessage`

**Décision (2026-09-30).** L'opt-out est un bouton du pied de page de Sites Conformes,
ajouté par un script que le CMS exécute sur toutes ses pages. Ce script garde le
choix sur le domaine du CMS et le transmet au simulateur par `postMessage` : quand
l'iframe le demande au démarrage, puis à chaque changement. Le traceur n'émet rien et
ne charge pas matomo.js tant que le choix n'est pas connu. Sur refus, il ne charge
rien ; sur un refus en cours de session, il cesse d'émettre. Sans réponse de la page
parente dans un court délai (app ouverte hors du CMS, script absent), la mesure suit
son cours. Le script du CMS est versionné dans ce dépôt et testé comme le reste.

**Pourquoi.** L'opt-out se place dans le pied de page du CMS pour l'UX : c'est là que
le prescripteur cherche ce réglage, et le simulateur n'a pas de pied de page propre
dans l'iframe. Or le navigateur isole le stockage de chaque origine, et range à part
celui d'une iframe tierce : aucun des opt-out natifs de Matomo (cookie posé par la
page du CMS, cookie tiers sur le domaine de Matomo) n'atteint notre traceur. Seul un
message entre les deux fenêtres franchit cette frontière. Le code de Sites Conformes
le permet : ses réglages « Scripts personnalisés » injectent un script sur chaque
page, sa CSP se limite à `frame-ancestors`, et son bloc iframe n'impose pas de
`sandbox` (voir [identification.md](./identification.md), R-1). Seule la page
parente est écoutée, sans vérifier son origine : le message ne porte aucune donnée
et ne fait qu'arrêter ou reprendre notre propre mesure.

**Conséquences.** La page vue part avec un décalage d'au plus une seconde, le temps de
la réponse. Le suivi automatique des liens sortants est retiré : il aurait continué
après un refus en cours de session, `optUserOut` reposant sur un cookie que le
traceur n'écrit pas. Le bouton est inséré dans la liste du pied de page DSFR : si
Sites Conformes change cette structure, il disparaît sans erreur, et la recette doit
le vérifier après chaque montée de version du CMS. Le script vit dans les réglages du
CMS, hors de tout déploiement : sa mise à jour se fait à la main, depuis le fichier du
dépôt. Le refus est mémorisé dans le stockage du CMS, ce que l'exemption autorise pour
retenir une opposition.

Depuis le 2026-11-12, le même choix vaut pour le journal des parcours (ADR-6) : sur
refus, le navigateur n'envoie rien au backend, et cesse d'envoyer sur un refus en
cours de session.

### ADR-6 - Journal des parcours écrit par le backend (~~dans Grist~~)

**Contexte.** Le dashboard analytics sera livré après le simulateur. Il devra
recalculer ses 62 blocs depuis des événements unitaires, conservés, dédoublonnés et
reliés entre eux : une simulation de P0 à sa fin, un bouton affiché à son clic, un
document à son résultat. Matomo ne sait pas le porter (ADR-1). Le plan de marquage
v10.1.7 et le contrat `analytics/` du paquet de l'éditeur décrivent ces événements.
Le responsable du traitement a donné son accord à cette collecte.

**Décision.** Le navigateur envoie chaque événement à une route de collecte
versionnée de notre backend Express. Le backend :

- valide l'événement contre une liste fermée de champs : notre contrat, écrit
  d'après ANA-1015 (`REFERENTIEL/03` du paquet de l'éditeur) pour le socle, et un
  contrat versionné à part pour nos compléments (`service_id`, exposition des boutons
  documentaires, mesures typographiques). ~~Le contrat du paquet pour le socle.~~ ;
- y ajoute ce que le navigateur ne peut pas prouver : la date de réception, la
  version du schéma, l'environnement ;
- le conserve dans le journal (ADR-7) : un renvoi identique du même `event_id` est
  ignoré, le même `event_id` avec un autre contenu est mis à part comme collision ;
  ~~l'écrit dans le document Grist « Simulateur-Parcours », en ajout ou mise à jour sur
  l'`event_id`~~ ;
- n'accuse réception qu'une fois l'écriture faite.

Chaque événement porte l'id de l'établissement et celui du service du rattachement.
Le contrat v0.1 du plan de marquage (16 événements, `p0_viewed`, `cta_exposed`…)
n'est pas suivi : il est historique.

Le contrat vit dans `shared/analytics/`, en TypeScript : le navigateur n'en prend que
les types, le backend valide avec. ANA-1015 le dit lui-même : les fichiers
`analytics/` du paquet sont ses dérivés. Le validateur et le réducteur
(`contrat-analytics.mjs`) n'entrent pas dans le code : ses exemples doivent passer
notre validateur, et son réducteur sert d'oracle dans les tests. Si le texte et le
code du paquet divergent, le texte fait foi.

Le navigateur envoie chaque événement seul, dans un `fetch` en `keepalive`, qui
survit à la fermeture de l'onglet. Sur une erreur réseau ou une réponse 5xx, il
réessaie après 0,5, 1, 2 puis 4 secondes, et abandonne. Un refus du contrat (4xx)
n'est pas réessayé. Il n'y a ni file ni stockage dans le navigateur.

Le journal ne s'exporte pas. Le dashboard le lira par une API du backend, construite
avec lui.

**Pourquoi.** Un journal tenu par le backend se dédoublonne, se date et se filtre en
un seul endroit, que le navigateur ne peut pas contourner. Un contrat à nous suit nos
règles de code et se teste sur les exemples de l'éditeur à chaque livraison. Le
réessai sans file couvre une coupure brève pour presque rien : une perte plus longue
est un cas à la marge, et elle se voit sans rien construire, par un trou dans les
`sequence` d'une simulation. Une file sur le disque survivrait à l'onglet, mais elle
écrirait sur le poste du prescripteur, ce que l'ADR-3 écarte. ~~**Pourquoi Grist.**
L'équipe y tient déjà le référentiel, le backend sait déjà y écrire (le rattachement
« Autre »), et l'app n'a aucune base de données à exploiter. Le journal se lit et
s'exporte sans outil de plus.~~ (voir ADR-7)

**Conséquences.**

- Le backend devient un point de passage de la collecte : s'il ne répond pas
  pendant les quelques secondes du réessai, l'événement est perdu. La perte se lit
  dans la couverture, par les trous de `sequence`. ~~Le navigateur garde un nombre
  borné d'événements à renvoyer.~~
- Si l'onglet se ferme entre deux essais, l'événement est perdu aussi : `keepalive`
  ne protège que la requête en cours.
- Chaque événement fait une écriture : pas de lot à constituer, mais un débit à
  surveiller (R-13).
- Aucune adresse IP ni aucun en-tête du navigateur n'est écrit dans le journal.
- Un rechargement de la page crée une nouvelle simulation : l'app ne garde rien
  d'un rechargement à l'autre. La reprise viendra avec #392 (R-14).

### ADR-7 - Le journal en clean architecture, Grist en premier adaptateur

**Contexte.** Grist sert à démarrer : l'équipe y tient déjà le référentiel, le
backend sait déjà y écrire, et l'app n'a pas de base de données. Mais il n'est pas
fait pour stocker des événements en masse, et il ne tiendra probablement pas dans
la durée.

**Décision.** Le journal suit la clean architecture, côté serveur
(`server/journal/`) comme côté écran (`front/socle/analytics/`). Chaque fichier dit
son rôle par son suffixe, et chaque rôle s'écrit en classe ou en interface :

| Suffixe | Rôle | Serveur | Écran |
|---|---|---|---|
| `.entity.ts` | une notion du journal et ses règles, sans dépendance | `JournalEntry` : l'événement daté à sa réception, qui sait s'il en répète un autre | `Journey` : la simulation, qui numérote et date ses événements |
| `.usecase.ts` | une action, qui ne parle qu'aux entités et aux ports | `CollectAnEvent` : garde un nouvel événement, ignore un renvoi, met une collision à part | `StartASimulation` : ouvre un parcours et le signale sur P0 |
| `.port.ts` | l'interface qu'un use case attend de l'extérieur | `Journal` : retrouver, ajouter, mettre à part | `Journal` : garder un événement |
| `.adapter.ts` | une classe qui implémente un port, ou une entrée qui appelle un use case | `GristJournal`, `MemoryJournal`, `journalRoutes` | `ServerJournal` : envoi, réessais, opt-out |

Les adaptateurs parlent HTTP par deux clients préconfigurés (`.client.ts`), qui
portent l'adresse, l'authentification, le JSON et les erreurs :
`server/grist/grist-api.client.ts` (`GristApiClient`, serveur → Grist) et
`front/socle/server-api/server-api.client.ts` (`ServerApiClient`, écran → serveur).
Le référentiel et le rattachement passent aussi par eux. L'adaptateur Grist, seul à
connaître le document « Simulateur-Parcours », range chaque événement en colonnes
communes (`event_id`, `simulation_id`, `sequence`, type, dates, environnement,
version du schéma, `is_test`) et le reste en JSON dans une colonne `payload`, et les
collisions dans une table à part. L'adaptateur se choisit au démarrage, dans
`server/server.ts`. Les fichiers qui assemblent (`server.ts`, `app.ts`,
`journey-in-session.ts`, `main.tsx`, les `index.ts`) n'ont pas de suffixe.

**Pourquoi.** Changer de stockage ne doit toucher qu'un adaptateur. Si l'adaptateur
décidait seul qu'un renvoi est un doublon, la règle partirait avec lui. Le suffixe
dit au lecteur, avant d'ouvrir le fichier, de quel côté de la frontière il est.
Colonnes communes plus JSON : le journal sert au rejeu, pas à la lecture à l'œil, et
la table ne bouge pas quand le contrat gagne un champ.

**Conséquences.** Les use cases se testent entièrement sur l'adaptateur en mémoire.
L'adaptateur Grist n'a que des tests d'aller-retour. Une nouvelle variable de
configuration donne l'adresse du document « Simulateur-Parcours ». Le test
d'architecture vérifie que les entités, use cases et ports n'importent qu'entre eux
et depuis `shared/`, et que seul `grist-journal.adapter.ts` importe `server/grist/`.
Le rattachement n'est pas encore découpé ainsi : il le sera sur ce modèle.

## 3. Architecture cible

```mermaid
flowchart TB
    subgraph cms["Page Sites Conformes"]
        optout["Opt-out du pied de page<br/>(script du CMS, choix gardé sur son domaine)"]
        subgraph simu["App simulateur (dans l'iframe CMS)"]
            parcours["Parcours de simulation<br/>(formulaire + résultat)"]
            traceur["Traceur d'analytics, cookieless<br/>(id du service en Nom d'événement)"]
            emetteur["Émetteur du journal<br/>(simulation, affichages, validations, clics)"]
            parcours -->|"événements de parcours"| traceur
            parcours -->|"faits affichés et validés"| emetteur
        end
    end
    traceur -->|"postMessage : demande du choix"| optout
    optout -->|"postMessage : suivi ou refus"| traceur
    optout -->|"postMessage : suivi ou refus"| emetteur
    matomo[("Matomo<br/>(mutualisé beta.gouv, IP anonymisée par l'instance)")]
    backend["Backend Express<br/>(route de collecte versionnée)"]
    journal[("Grist « Simulateur-Parcours »<br/>(journal des parcours)")]

    rattachement["rattachement établissement/service<br/>(en mémoire de session)"] --> traceur
    rattachement --> emetteur
    traceur -->|"événements (Nom = id du service)"| matomo
    emetteur -->|"événements validés par le contrat"| backend
    backend -->|"port du journal, adaptateur Grist"| journal
```

| Composant | Rôle | Statut |
|---|---|---|
| Traceur Matomo | mesure d'audience | inchangé |
| Émetteur du journal | crée la simulation, émet les faits réellement affichés, validés ou demandés | ajouté (2026-11-12) |
| Route de collecte | valide, date la réception, dédoublonne, écrit par le port du journal | ajouté (2026-11-12) |
| Grist « Simulateur-Parcours » | conserve le journal, premier adaptateur du port (ADR-7) | ajouté (2026-11-12) |

~~Un composant de gestion du consentement autorisait l'initialisation du traceur.~~
Retiré le 2026-09-29 (ADR-3).

Depuis la fusion, tout le parcours, rattachement et simulation, tourne dans
l'iframe du CMS. C'est un contexte tiers, où les cookies sont bloqués. Le traceur
est donc cookieless (`_paq.push(["disableCookies"])`) : les événements partent sans
cookie, ce qui convient à une mesure d'audience sans bandeau. L'API JavaScript de
Matomo n'a pas de commande pour anonymiser l'IP : c'est un réglage de l'instance.

## 4. Spécification des événements

Événements `trackEvent` émis par le traceur, en catégorie `simulateur`, portant l'id
Grist du service en Nom, ou `autre` pour un rattachement dégradé. ~~Ce nom était absent
si le parcours avait démarré sans rattachement pseudonymisé (API indisponible).~~ Le nom d'action est une valeur fixe du référentiel
`EventName` (`front/socle/analytics/events.ts`, ADR-4) — jamais composé à
l'exécution.

**Parcours** (~~un jeu par outil, `prescripteur:…` / `secretariat:…`~~, un seul
jeu depuis le 2026-10-06) :

| Action | Valeur | Moment du parcours |
|---|---|---|
| `simulation_start` | — | ouverture du simulateur, début du formulaire |
| `simulation_step` | `stepIndex` | passage à la page suivante |
| `simulation_complete` | — | affichage de la page de résultat |
| `simulation_abandon` | `lastStep` | départ (onglet quitté) sans avoir atteint le résultat |

Le complément posé après le verrou du résultat n'émet rien.

**Parcours ALD** (#148, D-228 à D-231 du journal de la v10). Un seul de ces
événements part à chaque arrivée sur le premier résultat, juste après
`simulation_complete`, si le parcours est un parcours ALD. Sa valeur est le nombre
de questions posées de P1 à P2 ; un groupe de cases compte une question.

| Action | Valeur | Verdict |
|---|---|---|
| `parcours_ald_dans_la_cible` | questions | au plus six pages et six questions |
| `parcours_ald_trop_de_pages` | questions | plus de six pages |
| `parcours_ald_trop_de_questions` | questions | six pages au plus, plus de six questions |
| `parcours_ald_caisse` | questions | issue caisse, sans conclusion sur le droit |

Le verdict part à chaque passage par le résultat : le taux compte des passages, pas
des simulations (D-230). Le modèle déclare le parcours compté, l'issue caisse, les
parties et la limite (`aldIndicator`) ; le socle compte et envoie.

Rien d'autre ne part (D-255) : la raison d'un dépassement est le nom du verdict,
la durée se lit entre `simulation_start` et `simulation_complete`, et les types
de soins, qui sont des réponses, ne partent pas.

~~**Résultat** (`secretariat:resultat:<slug>`), un slug par valeur de
`cible_cas_final`.~~ Retiré le 2026-10-06 avec le modèle v9.

~~**Résultat** (`prescripteur:resultat:<slug>`), un slug par valeur de
`cible_resultat_medical`.~~ Retiré le 2026-10-06 avec le modèle v9.

~~**CERFA** (`secretariat:cerfa_telecharge:<formulaire>`), un par document.~~
Retiré le 2026-10-06 avec le téléchargement des trois CERFA.

- **Interdits** : les réponses détaillées du formulaire, toute PII, toute donnée
  patient.
- **Reporting** : le rapport Événements (Catégorie, Action, Nom) et la segmentation
  `eventName == <id du service>` donnent les éligibles et non éligibles par service,
  ainsi que le taux d'abandon par étape.

## 5. RGPD & consentement

- **Depuis le 2026-09-29** : la mesure est agrégée par service, cookieless, sans
  réponse détaillée. Elle entre dans l'exemption de consentement CNIL et se passe de
  bandeau (ADR-3), sous deux réserves : l'IP doit être anonymisée par l'instance
  Matomo (R-10), et les très petits services restent un cas limite (R-11).
- **Depuis le 2026-09-30** : le prescripteur peut s'opposer à la mesure depuis le pied
  de page du CMS (ADR-5). Reste à l'en informer dans la politique de confidentialité
  (R-12).
- ~~Le suivi par prescripteur est quasi nominatif, donc hors de l'exemption de
  consentement CNIL. En conformité stricte, il demande un bandeau.~~
- ~~Choix du porteur en phase expérimentale : démarrer sans bandeau, avec suivi
  individuel, et instruire le sujet en parallèle.~~
- ~~Repli conforme si le bandeau devient nécessaire : une mesure d'audience anonyme
  et agrégée, sans `prescripteurRef`.~~ C'est ce repli, par service, qui est devenu la
  règle.

## 6. Découpage en incréments (analytics)

1. **Matomo funnel.** ✅ **Fait** (`front/socle/analytics/`, site 275,
   `https://stats.beta.gouv.fr/`). Le traceur est instrumenté dans le simulateur,
   avec le référentiel d'événements de l'ADR-4. Il est amorcé au boot en cookieless
   (`disableCookies`), et lit le service en session à l'émission de chaque
   événement, ce service étant renseigné après le rattachement. Il est gardé par
   un gating dev/prod : actif en build de prod, ou en local avec
   `VITE_MATOMO_ENABLED=true`, et sans effet sinon. Reste à configurer les Funnels
   côté Matomo si nécessaire.
2. **Mesure par service, sans bandeau.** ✅ **Fait (2026-09-29)**. Le Nom d'événement
   porte l'id Grist du service, en clair, le drapeau de consentement est retiré. *Reste : vérifier
   l'anonymisation de l'IP sur l'instance (R-10).*
3. **Opt-out dans le pied de page du CMS.** ✅ **Fait côté simulateur (2026-09-30)** :
   le traceur attend le choix du CMS (ADR-5), et le script du CMS est versionné et
   testé. *Reste : coller le script dans Sites Conformes avec l'origine réelle du
   simulateur, publier le texte d'information (R-12).*

4. **Journal des parcours.** À faire (#380) : la route de collecte et l'écriture dans
   Grist (#382), puis la simulation, les questions, R2, R3, les boutons, la
   typographie et la fin de parcours, chacun dans sa tâche.

Prérequis : l'écran de rattachement fournit le service (cf.
[identification.md](./identification.md), incréments 1–2 et 6).

## 7. Risques & validations en attente

| Réf | Risque / à valider | Portée |
|---|---|---|
| ~~**R-4**~~ | ~~**RGPD** : le suivi par prescripteur sans bandeau n'est pas conforme CNIL en l'état.~~ **Levé (2026-09-29)** : le suivi porte sur le service, dans l'exemption (ADR-3), sous réserve de R-10. | résolu |
| ~~**R-7**~~ | ~~Couverture partielle du KPI par prescripteur si un bandeau devient nécessaire.~~ **Sans objet (2026-09-29)** : plus de bandeau, plus de KPI par prescripteur. | résolu |
| **R-8** | Instance mutualisée beta.gouv : les custom dimensions sont indisponibles, ce que l'ADR-2 contourne en passant par une propriété d'événement. Restent à confirmer la disponibilité des Funnels et les quotas. | partiellement tranché |
| **R-10** | **Anonymisation de l'IP** : l'exemption CNIL l'exige, et elle se règle sur l'instance Matomo (Administration → Confidentialité), pas dans le code. À confirmer auprès des admins de stats.beta.gouv.fr pour le site 275. | conformité, **à vérifier avant la release** |
| **R-11** | **Très petits services** : dans un service d'une ou deux personnes, l'id du service désigne de fait des individus. Réserve mineure, acceptée sans traitement dans le code. | conformité |
| **R-12** | **Information des prescripteurs** : l'exemption exige de dire ce qui est mesuré et comment s'y opposer. Le texte, dans la politique de confidentialité du CMS, doit décrire la mesure par service et renvoyer à l'opt-out du pied de page. | conformité, **à publier avant la release** |
| **R-13** | **Volume du journal dans Grist** : une simulation donne des dizaines d'événements. Les limites de taille d'un document et le débit de l'API Grist sont à mesurer avant la communication de l'app, et un archivage à prévoir s'ils approchent. | exploitation |
| **R-14** | **Reprise après rechargement** : garder le même `simulation_id` après un rechargement demande un stockage dans le navigateur, que l'ADR-3 écarte. D'ici #392 (priorité basse), un rechargement crée une nouvelle simulation et l'ancienne reste sans fin. | décidé, plus tard |
| **R-15** | **Durée de conservation** du journal : à fixer avec l'équipe responsable des données. | conformité, plus tard |
| **R-16** | **Droits de la clé d'API** sur « Simulateur-Parcours » : lecture, écriture et création de table vérifiées le 2026-11-12 avec la clé de staging. La clé de production reste à vérifier avant la livraison. | exploitation, **à vérifier avant la release** |

## 8. Vérification

```bash
pnpm --filter simulateur-eligibilite exec vitest run tests/socle/analytics
```
