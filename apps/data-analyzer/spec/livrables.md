# Livrables (marts)

> Ce que produit l'ETL et comment le lire. Le fonctionnement du pipeline est dans le
> [README de l'app](../README.md).

Chaque mart est le même calcul à un grain différent, sur des trajets réconciliés,
c'est-à-dire dont les finess sont alignés sur le référentiel, qui fait autorité, puis
rattachés au GHT. Voir [Pipeline](../README.md#pipeline--artefacts) et le
[point 1](points-attention-metier.md#1-divergence-dattribution-entre-sources-et-cellules-part--1).

| Livrable | Grain | À savoir / limite |
|---|---|---|
| `mart_geographique.csv` | finess **géographique** | Le plus fin, mais **beaucoup de `part` NULL** : le référentiel n'a pas toujours de valeur sur *le même site* que la plateforme (dénominateur absent). Exclut les sources sans finess géographique. |
| `mart_juridique.csv` | finess **juridique** (autorité référentiel) | Livrable établissement principal. Résidu de `part>1` (divergence réelle entre les deux systèmes, cf. point 1). |
| `mart_ght.csv` | **GHT** | **Le plus fiable** : les désaccords d'attribution intra-GHT se réconcilient (quasi 0 `part>1`). Couvre les établissements **publics en GHT** (cf. point 2) **et** la part d'une source hiérarchique restée au grain GHT (cf. point 6). |
| `mart_hors_ght.csv` | finess **juridique**, hors GHT | Complément de `mart_ght` : les établissements **sans GHT** (~91 % : cliniques privées, imagerie…). |
| `mart_article80.csv` | juridique **et** GHT | **Volumes + part par plateforme** (pas de ratio national, cf. point 3). Colonne `grain` = `juridique`/`ght`. |
| `mart_ght_2024.csv` | **GHT** × véhicule, année 2024 | **Rollup du mart GHT** : pour chaque GHT (136, dont 56 avec des trajets plateforme), une ligne par véhicule et une ligne « Tous transports ». Vue de synthèse « taux réel de recours aux plateformes par GHT ». |
| `mart_juridique_2024.csv` | **finess juridique** × véhicule, année 2024 | **Rollup du mart juridique** : les mêmes quatre lignes pour chaque établissement connu (8 527, dont 446 avec des trajets plateforme). Le même chiffre que ci-dessus, au grain où il s'interprète (cf. [point 9](points-attention-metier.md#9-un-rollup-annuel-ne-répond-quà-la-question-qui-lui-est-posée)). C'est ce mart que consomme la vue Grist « part plateforme par établissement ». |
| `mart_ght_2025.csv`, `mart_juridique_2025.csv` | les deux mêmes grains, année 2025 | **Les mêmes rollups pour 2025**, aux mêmes colonnes. ⚠️ Une plateforme n'a pas livré 2025 : son numérateur manque, et un ratio 2025 ne se compare pas tel quel à celui de 2024 (cf. [point 9](points-attention-metier.md#9-un-rollup-annuel-ne-répond-quà-la-question-qui-lui-est-posée)). |
| `mart_juridique_plateforme.csv`, `mart_ght_plateforme.csv` | juridique ou GHT, **une ligne par plateforme** | **Le détail par plateforme** de `mart_juridique` et de `mart_ght` : là où ceux-ci écrivent « A + B » et somment, ceux-là rendent à chaque plateforme son volume et sa part. ⚠️ Le dénominateur est répété sur chaque ligne : il ne se somme pas. |
| `mart_juridique_plateforme_<année>.csv`, `mart_ght_plateforme_<année>.csv` | les mêmes × véhicule, une année | **Le détail par plateforme des rollups annuels**, pour 2024 et 2025, avec la même ligne « Tous transports ». |
| `mart_taux_plateforme.csv` | **plateforme** × année (2024, 2025) × véhicule | **Le taux de plateformisation de chaque plateforme**, pour les comparer : deux taux et la distribution du ratio chez ses établissements. Hors article 80, au grain établissement. |
| `mart_synthese.csv` | année × grain (établissement, GHT) × **classe de taille** | **La couverture en un coup d'œil** : combien d'entités existent, combien ont des trajets remboursés, combien ont des trajets plateforme, et ce qu'elles pèsent. Dérivé des rollups annuels. |

Les marts de ratio — `geographique`, `juridique`, `ght` et `hors_ght` — portent les
colonnes `… annee, vehicule, plateforme, nb_plateforme, nb_reference, part, alerte_qualite`,
où :

- `part = nb_plateforme / nb_reference`, hors Article 80, et reste vide, donc NULL, s'il
  n'y a pas de dénominateur ;
- `alerte_qualite = "part>1"` quand le numérateur dépasse le dénominateur. C'est un signal
  assumé, qu'on ne corrige pas.

Ils portent en plus une colonne **`plateforme`**, qui nomme d'où vient le numérateur de la
cellule. Elle est vide quand la cellule n'a que du référentiel. Quand plusieurs plateformes
déclarent des trajets sur la même cellule, les noms sont triés et joints par ` + `, par
exemple `Plateforme A + Plateforme B` : réduire à une seule mentirait sur l'origine du
chiffre. Les noms eux-mêmes viennent de `mapping.json`, cf.
[Configuration des entrées](../README.md#configuration-des-entrées--mappingjson).

Les **rollups annuels** sont le même calcul à deux grains, `ght_<année>` et
`juridique_<année>`, et sortent pour chaque année du référentiel national, 2024 et 2025.
Ils réduisent le mart de ratio correspondant à leur seule année et portent
`… annee, vehicule, plateforme, nb_plateforme, nb_cnam, ratio, alerte_qualite`, où
`nb_cnam` est le référentiel national, `ratio = nb_plateforme / nb_cnam` et
`alerte_qualite = "ratio>1"` selon la même règle que `part>1`.

**Chaque entité y a quatre lignes**, toujours les mêmes : `Ambulance`, `Assis`, `Autre`,
et `Tous transports` qui somme les trois. ⚠️ Sommer une colonne sur toute la table compte
donc chaque trajet deux fois : pour une vue par entité, filtrer sur
`vehicule = "Tous transports"` ; pour comparer les véhicules, l'exclure. Le mart du taux
par plateforme et le détail annuel par plateforme suivent la même règle.

**Ils listent toute entité connue**, qu'elle ait ou non des trajets plateforme, qu'elle ait
ou non des remboursements. Sont connues les entités de la dimension, établissements du
référentiel ou GHT, et celles que le mart de ratio porte sur une autre année. Quatre cas
se lisent dans la colonne `ratio`, ici sur la ligne « Tous transports » :

| Cas | `ratio` | En 2024, au grain établissement |
|---|---|---|
| trajets plateforme et trajets remboursés | calculé | 442 |
| trajets remboursés, aucun trajet plateforme | `0` | 6 632 |
| trajets plateforme, aucun trajet remboursé | vide | 4 |
| ni l'un ni l'autre dans l'année | vide | 1 449 |

Un `0` veut dire « aucun trajet chez les plateformes qui ont livré leurs données », pas
« aucune plateforme ». Pour retrouver la seule liste des entités couvertes, filtrer sur
`nb_plateforme > 0`.

Les **marts par plateforme** reprennent les colonnes du mart qu'ils détaillent, à ceci
près que `plateforme` y porte toujours une seule plateforme et `nb_plateforme` ses seuls
trajets. Ce qu'il faut savoir pour les lire :

- seules les cellules où une plateforme déclare des trajets y figurent, le fait « aucune
  plateforme » se lit dans le mart détaillé ;
- les `nb_plateforme` d'une cellule se somment et redonnent celui du mart détaillé, les
  parts aussi ;
- `nb_reference`, ou `nb_cnam` en forme annuelle, est le remboursement de toute la
  cellule, répété sur chaque ligne plateforme : le sommer le compterait plusieurs fois ;
- `alerte_qualite` signale une plateforme qui dépasse seule le dénominateur. Un
  dépassement dû au cumul de plusieurs plateformes ne se lit que dans le mart détaillé.

En 2024, 28 établissements et 10 GHT ont des trajets chez plusieurs plateformes.

`mart_taux_plateforme` porte, pour chaque plateforme et chaque année, une ligne par
véhicule où elle déclare des trajets et une ligne « Tous transports ». Sur une ligne
véhicule, numérateur et dénominateurs sont ceux de ce seul véhicule :

| Colonne | Ce qu'elle dit |
|---|---|
| `nb_etablissements` | établissements où la plateforme déclare des trajets |
| `nb_plateforme` | ses trajets rattachés à un établissement |
| `nb_plateforme_sans_finess` | ses trajets sans finess juridique, **hors du numérateur** |
| `nb_cnam_etablissements` | remboursement de ces seuls établissements |
| `taux_etablissements` | `nb_plateforme / nb_cnam_etablissements` : le recours là où elle est présente |
| `nb_cnam_national` | tout le remboursement de l'année |
| `taux_national` | `nb_plateforme / nb_cnam_national` : ce que pèse la plateforme |
| `ratio_q1`, `ratio_mediane`, `ratio_q3` | distribution du ratio établissement par établissement |

Les deux taux sont justes et ne répondent pas à la même question, comme les deux agrégats
du [point 9](points-attention-metier.md#9-un-rollup-annuel-ne-répond-quà-la-question-qui-lui-est-posée).
Trois précautions avant de comparer deux plateformes :

- une plateforme dont `nb_plateforme_sans_finess` est élevé est sous-estimée sur ses deux
  taux, ces trajets n'étant rattachables à aucun établissement ;
- un établissement partagé entre deux plateformes compte dans le dénominateur de chacune,
  donc les `nb_cnam_etablissements` ne se somment pas d'une plateforme à l'autre ;
- la médiane sous le taux agrégé dit que le taux est porté par quelques gros
  établissements.

`mart_synthese` compte les entités des rollups annuels, sur leur ligne « Tous transports ».
Chaque année et chaque grain y ont une ligne par classe de taille et une ligne
« Toutes tailles » :

| Colonne | Ce qu'elle dit |
|---|---|
| `nb_entites` | toutes les entités connues |
| `nb_avec_remboursement` | celles qui ont au moins un trajet remboursé dans l'année |
| `nb_avec_plateforme` | celles qui ont au moins un trajet plateforme dans l'année |
| `part_entites_couvertes` | `nb_avec_plateforme / nb_entites` |
| `nb_cnam`, `nb_cnam_couvert` | le remboursement de la ligne, et celui des seules entités couvertes |
| `part_cnam_couvert` | leur rapport : la part du remboursement que les entités couvertes représentent |
| `nb_plateforme` | les trajets plateforme de la ligne |
| `ratio`, `ratio_couvert` | `nb_plateforme` rapporté à `nb_cnam`, puis à `nb_cnam_couvert` |

Les deux dénominateurs du nombre d'entités sont donnés côte à côte : le taux de couverture
se calcule sur `nb_entites` ou sur `nb_avec_remboursement` selon la question. Sur la ligne
« Toutes tailles » du grain établissement, `ratio` et `ratio_couvert` sont les deux
agrégats du [point 9](points-attention-metier.md#9-un-rollup-annuel-ne-répond-quà-la-question-qui-lui-est-posée),
2,61 % et 7,99 % en 2024.

La classe de taille d'une entité vient de son nombre de trajets remboursés dans l'année :
moins de 1 000, 1 000 à 9 999, 10 000 à 49 999, 50 000 et plus. Une entité peut donc
changer de classe d'une année à l'autre. Celles qui n'ont aucun remboursement dans l'année
sont à part, dans « Sans remboursement ». La classe la plus haute réunit 312 établissements
en 2024, soit 4 % de ceux qui ont un remboursement et 70 % de son volume.

`mart_article80` porte à la place `nb` et `part_plateforme = source / Σ plateformes`, et sa
colonne `plateforme` porte une seule plateforme par ligne, puisque c'est son grain. La
nomenclature véhicule canonique est `vehicule ∈ {Ambulance, Assis, Autre, Total}`.

## Les livrables d'une cible

Un document destiné à un tiers reçoit les mêmes marts, restreints à ses plateformes :
c'est une **cible**, cf. [Publier pour une cible](../README.md#publier-pour-une-cible).
Deux différences de lecture avec le périmètre complet :

- les rollups et la synthèse n'y listent que les entités où ces plateformes déclarent des
  trajets. `nb_entites` n'y est donc plus le nombre d'établissements connus, et un taux de
  couverture en nombre n'y a pas de sens ;
- un établissement que la cible partage avec une plateforme hors cible y sort avec les
  seuls trajets de la cible : son ratio y est plus bas que dans le périmètre complet.
