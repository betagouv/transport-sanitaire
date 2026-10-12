# Questions à l'éditeur

Les tickets vivent dans Notion, `[BDD] Tasks`. Ce fichier garde la trace de ce
qui est ouvert et de ce qui reste à ouvrir. Les décisions sont dans
[PLAN.md](PLAN.md).

## Ticket ouvert

| Sujet | Ticket | Chantier |
|---|---|---|
| Réponses vers faits. La v10.0.1 lève 38 faits sur 63. Restent 22 faits sans réponse désignée, 3 faits de portée juridique, et quatre réponses qui ne donnent aucun fait. Le détail, fait par fait, est dans le ticket. | « v10 : le lien entre les réponses et les faits n'est pas fourni », priorité haute | 10 |

L'éditeur a répondu le 12 octobre (D-77, D-78) :

- un fait inconnu n'est pas transmis au moteur ;
- les variables manquantes ne suffisent pas à filtrer les options de Q2.2.1 ;
- nous ne tranchons aucun des 25 faits, même par hypothèse ;
- la v10.0.2 corrige le contrat, déplace les 3 décisions dans le moteur et
  ajoute des tests avec des faits inconnus ;
- le branchement des décisions est bloqué jusque-là.

La v10.0.2, reçue le 12 octobre, y répond. Le contrôle fait par fait se
fera à l'intégration du modèle (chantier 10).

## En cours chez l'éditeur, sans ticket

- **Le texte de la fiche R2.** Le catalogue de la v10.0.1 le dit toujours « à
  définir ». Il bloque l'étape 4 tant qu'il n'est pas livré.

## Levés par la v10.0.1

| Sujet | Ce que l'éditeur a retenu |
|---|---|
| Lecture seule | Un registre de 47 repères : invisible, rappel en texte, ou donnée fixée près d'un champ. |
| PDF des cerfa | Le package porte des gabarits remplissables. |
| Retour différent de l'aller | Supprimé. Une seconde simulation, comme nous le suggérions (D-80). |
| Équipement bariatrique | `fait_bariatrique`. Plus de blocage. |
| Adresse hors de France | Tranché en P2 par Q2.2.5. Pays obligatoire en P3, code postal libre. |
| Adresse incompatible avec la distance | Contrôle retiré. |
| Format postal local hors de France | Abandonné : code postal libre. |
| Référence du mapping | `mapping_documents.json` fait foi. Le Google Sheet est un index de suivi. |
| Recherche d'acte en Q2.1 (D-65) | Confirmée : la sélection, sans code demandé au prescripteur. |
| Un oracle écrit en réponses | Abandonné : nous écrivons les réponses d'après le contrat (D-79). |

## Levés par la v10.0.2

Lus pour le socle seulement. Le YAML, le contrat réponses/faits et l'oracle
restent à contrôler avec le modèle.

| Sujet | Ce que l'éditeur a retenu |
|---|---|
| PDF des cerfa : dessiner ou remplir | Remplir les champs, puis aplatir les trois sorties (D-84). Le soulignement du type de lieu est abandonné. |
| Texte trop long | Jamais de blocage ni de reformulation (D-85). |
| Fait inconnu | Absent de ce que reçoit le moteur, jamais « non » par défaut (D-86). |
| Les 3 faits de portée juridique | Calculés par le moteur, ainsi que la DAP d'un CAMSP. Il reste 59 faits. |
| Les faits sans réponse désignée | 21 reçoivent leur réponse positive, négative et absente (`CORRECTIF_FAITS_SANS_REPONSE.md`). |
| Variables manquantes | Un outil de diagnostic. Elles ne choisissent pas les questions. |
| Permission d'un adulte liée aux soins (Q2.7, réponse 3) | À la charge de l'établissement. |
| `fait_intention_entree` | Q0.1 ne donne aucun fait au moteur. |

## À ouvrir, sur le socle

| Sujet | Le problème | Chantier |
|---|---|---|
| « Urgence : autres (précisez) » de la PMT | Le gabarit n'a pas de champ, et le livrable ne donne pas la position où écrire. Nous la relevons nous-mêmes. | 09 |
| Case du centre de référence, sur la DAP (`malrare`) | Le mapping la dit sans état d'export valide. Nous la dessinons, comme les cases groupées. | 09 |
| Texte sous 8 pt | Aucune taille minimale n'est donnée. La lisibilité se juge à la recette papier. | 09 |

## À valider, pas encore tranché

| Sujet | Le problème | Chantier |
|---|---|---|
| Rejeter un texte libre « contradictoire » | Q3.4 et Q3.5, inchangées dans la v10.0.1 et la v10.0.2. On ne détecte pas une contradiction dans du texte libre. Nous ne l'implémentons pas. | 09 |
| Libellé de Q1.4 | Le catalogue ne donne pas la phrase. La nôtre attend sa relecture. | 10 |

## Écartés, sauf avis contraire

- Le « contexte fiable ». Tranché par Simon (D-74) : le rattachement n'en est
  pas un, les rubriques d'identité du cerfa restent vides.
- « Issue » ou « éligibilité », « mode » ou « transport préconisé ». Pas
  important.
- Le type de lieu sur le cerfa (souligner ou non le libellé préimprimé). Les
  trois gabarits ont un champ par type de lieu.
- Le format du catalogue (Markdown, tableaux HTML) et les nomenclatures NGAP
  et LPP livrées en PDF. Gênants, mais on avance sans.
- La mise hors production des résultats positifs avant la recette N2 à N5 :
  une décision d'équipe, pas une correction du livrable.
- Le vocabulaire divergent : il a son support, la liste publiée pour l'équipe.
