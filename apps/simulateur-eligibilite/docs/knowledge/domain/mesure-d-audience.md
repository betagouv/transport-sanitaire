# La mesure d'audience et le journal des parcours

> Ce qu'on veut savoir du parcours de simulation, ce qui part, et ce qui ne
> part jamais. Les décisions techniques sont dans [`../adr/`](../adr/) :
> ADR-0002, ADR-0003, ADR-0010, ADR-0011, ADR-0042 et ADR-0043. Ce que le journal
> reçoit est dans [`journal-des-parcours.md`](journal-des-parcours.md).

## Ce qu'on veut suivre

- qui démarre le formulaire, qui l'achève, qui l'abandonne et à quelle étape ;
- le nombre de résultats éligibles et non éligibles par service ;
- la part des parcours ALD qui arrivent au résultat en six pages et six
  questions au plus (#148) ;
- tout ce que les 62 blocs du dashboard analytics demandent : ce qui a été
  réellement affiché (P0, questions, R2, R3, boutons), ce qui a été validé ou
  demandé, et comment le parcours finit. Le dashboard sera livré après le
  simulateur et recalculera l'historique depuis le journal (#380).

Le découpage se fait par service, d'après l'id du service dans le référentiel,
que donne [le rattachement](rattachement.md). Il ne se fait pas par
prescripteur.

Le Matomo est celui que beta.gouv.fr héberge pour ses produits : aucun stockage
ni reporting à construire. Il n'expose pas les custom dimensions, d'où l'id du
service porté en nom d'événement. Il ne garde pas la suite des gestes d'une
simulation : le journal passe par notre backend. L'adresse IP y est anonymisée
par l'instance, un réglage qui n'est pas entre nos mains.

Deux canaux portent ces mesures :

| Canal | Ce qu'il porte | Où il va |
|---|---|---|
| la mesure d'audience | quatre événements de parcours, et le verdict ALD | Matomo, directement depuis le navigateur |
| le journal des parcours | chaque fait affiché, validé ou demandé d'une simulation | notre backend, qui le conserve |

## Ce qui ne part jamais

Aucune donnée patient, aucune donnée nominative, aucun contenu de champ libre
et aucune valeur de réponse ne part, ni vers Matomo ni vers le journal.

Ce qui part :

- les ids de l'établissement et du service du référentiel ;
- des identifiants techniques opaques : simulation, événement, exposition,
  révision ;
- les codes des questions affichées et l'état de leur validation ;
- les codes de résultat : issue, code de raison, mode, support.

Le service saisi sous « Autre » et l'établissement saisi à l'écran n'en font
pas partie.

## Les événements de la mesure d'audience

Chaque événement part en catégorie `simulateur`. Son nom est l'id du service,
absent quand le parcours n'a pas de service (#506). Son action est une valeur fixe, jamais
composée (ADR-0010).

| Action | Valeur | Moment du parcours |
|---|---|---|
| `simulation_start` | aucune | ouverture du simulateur, début du formulaire |
| `simulation_step` | le rang de l'étape | passage à la page suivante |
| `simulation_complete` | aucune | affichage de la page de résultat |
| `simulation_abandon` | la dernière étape | départ sans avoir atteint le résultat |

Le complément posé après le verrou du résultat n'émet rien.

### Le parcours ALD

Un seul de ces événements part à chaque arrivée sur le premier résultat, juste
après `simulation_complete`, si le parcours est un parcours ALD (#148, D-228 à
D-231). Sa valeur est le nombre de questions posées de P1 à P2 ; un groupe de
cases compte pour une question.

| Action | Verdict |
|---|---|
| `parcours_ald_dans_la_cible` | au plus six pages et six questions |
| `parcours_ald_trop_de_pages` | plus de six pages |
| `parcours_ald_trop_de_questions` | six pages au plus, plus de six questions |
| `parcours_ald_caisse` | issue caisse, sans conclusion sur le droit |

Le verdict part à chaque passage par le résultat : le taux compte des passages,
pas des simulations (D-230). Le modèle déclare le parcours compté, l'issue
caisse, les parties et la limite ; le socle compte et envoie.

Rien d'autre ne part (D-255) : la raison d'un dépassement est le nom du verdict,
la durée se lit entre `simulation_start` et `simulation_complete`, et les types
de soins, qui sont des réponses, ne partent pas.

### Lire les chiffres

Dans Matomo, le rapport Événements (Catégorie, Action, Nom) et la segmentation
`eventName == <id du service>` donnent les parcours par service et le taux
d'abandon par étape. Les séries d'avant le 2026-10-06 portent d'anciens noms
d'action et ne se raccordent pas aux nouvelles.

## Le consentement

- La mesure est agrégée par service, sans cookie et sans réponse détaillée. Elle
  entre dans l'exemption de consentement de la CNIL et se passe de bandeau
  (ADR-0003).
- Deux réserves : l'adresse IP doit être anonymisée par l'instance Matomo (réglage de l'instance), et un
  très petit service peut désigner une ou deux personnes (R-10 et R-11 de
  l'ADR-0003).
- Le prescripteur peut s'opposer à la mesure depuis le pied de page du CMS. Son
  refus vaut aussi pour le journal (ADR-0011). Il reste à l'en informer dans la
  politique de confidentialité (R-12 de l'ADR-0003).
- Le responsable du traitement a donné son accord à la collecte du journal, le
  2026-11-12.
