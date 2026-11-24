# La part des trajets réalisés via les plateformes

> Ce que le calcul veut dire, et comment les sources se rapprochent. Les marts
> eux-mêmes sont décrits dans [`spec/livrables.md`](../../../spec/livrables.md), les
> limites de lecture dans
> [`spec/points-attention-metier.md`](../../../spec/points-attention-metier.md). Le
> dossier `spec/` fait autorité sur le métier. L'exécution est dans le
> [README](../../../README.md).

Le code est public, les données et les fournisseurs ne le sont pas. Cette page parle
de rôles et de formats, jamais d'un fournisseur nommé : voir la section
« Confidentialité » du README.

## Ce que l'ETL calcule

Pour chaque établissement (finess) et chaque GHT : la part des trajets réalisés via
les plateformes, rapportée au référentiel national de remboursement.

- le **numérateur** vient des plateformes ;
- le **dénominateur** vient du référentiel national ;
- le résultat est ventilé par année, par type de transport et par enveloppe
  (Article 80 ou Hors Article 80).

Une nouvelle année, une nouvelle plateforme ou un référentiel mis à jour s'ajoutent
en déclarant le fichier dans `mapping.json`, sans réécrire le code.

## Les trois rôles de source

| Rôle | Ce qu'il apporte | Ce qu'il faut savoir |
|---|---|---|
| `referentiel-national` | le dénominateur, au grain du site | ne couvre que le **hors Article 80** ; porte le finess juridique et le finess géographique |
| `plateforme` | le numérateur | certaines livrent au grain établissement avec un finess, d'autres au grain GHT avec un libellé libre et **sans finess** |
| `referentiel-ght` | le rattachement d'un finess juridique à son GHT | open data public : ne regroupe que des hôpitaux publics |

Le référentiel GHT ne couvre qu'une minorité des finess des plateformes. `mart_ght`
ne couvre donc que ce sous-ensemble public : voir le point 2 de
[`points-attention-metier.md`](../../../spec/points-attention-metier.md).

## Le dénominateur dépend de l'enveloppe

Le remboursement national ne couvre pas l'Article 80. Aucune source indépendante ne
donne le total des trajets Article 80.

| Enveloppe | Dénominateur | Ce que la part dit |
|---|---|---|
| Hors Article 80 | le référentiel national, un univers complet et indépendant des plateformes | un vrai ratio, qui peut rester sous 100 % |
| Article 80 | la somme des trajets des plateformes, seule mesure disponible | 100 % par construction : seul compte le volume de chaque plateforme |

C'est pourquoi l'Article 80 a son propre mart, qui donne des volumes et la part de
chaque plateforme, et non un ratio.

## La nomenclature véhicule est grossière, exprès

Les sources ne nomment pas les véhicules de la même façon, et l'une ne livre que de
l'« assis » qu'on ne peut pas répartir entre taxi et VSL. Le seul niveau commun à
toutes est donc le suivant, qui garantit la comparabilité entre numérateur et
dénominateur. Chaque adaptateur porte son propre passage vers ce niveau.

| Canonique | Ce que c'est |
|---|---|
| `Ambulance` | l'ambulance |
| `Assis` | VSL, taxi et transport assis professionnalisé |
| `Autre` | les autres modes |
| `Total` | une ligne sans détail véhicule, pour l'Article 80 que certaines sources ne ventilent pas |

Le détail taxi contre VSL pourra venir plus tard si le besoin se confirme.

## Rapprocher les sources (`reconcile`)

Deux systèmes indépendants rangent parfois le même trajet sous des finess différents.
Les règles de rapprochement sont les suivantes.

- **Le référentiel fait autorité.** Le finess juridique d'un trajet est celui que le
  référentiel associe à son site géographique, pas celui que la source déclare. Si
  le site est inconnu, on retombe sur le juridique déclaré, puis sur le libellé.
- **Le finess prime sur le libellé.** Un libellé libre ne sert que quand aucun
  finess n'a été trouvé, par deux mappings manuels versionnés dans `ref/` : un
  libellé qui désigne un établissement reçoit son finess juridique (le GHT suit),
  un libellé qui désigne un GHT reçoit son GHT. La table relue par le porteur fait
  foi, pas le rapprochement flou qui l'a pré-remplie.
- **Le GHT d'un finess** vient de l'open data. Une table manuelle de finess le
  complète pour les entités hors référentiel, et prime sur lui. Un établissement
  structurellement hors GHT y est rattaché au GHT de son territoire. Un cas sans
  territoire commun reste hors GHT, plutôt que d'être rattaché à tort.
- **`part > 1` est exposé, jamais corrigé.** L'alignement des finess répare les cas
  les plus gros, mais deux systèmes indépendants ne s'emboîtent jamais parfaitement.
  La colonne `alerte_qualite` le signale.
- **Une entité a un seul nom**, celui de son site au plus gros volume. Le
  `finess_juridique` fait foi, le nom n'est qu'un confort.

## Pourquoi cette forme

- **Générique, piloté par la donnée.** Le code ne connaît que des rôles et des
  formats. Toute la connaissance d'une source est dans son adaptateur, et les
  étapes suivantes ne raisonnent que sur les rôles. Ajouter une source, c'est une
  ligne de mapping, et un adaptateur si le format est nouveau.
- **Pas d'outil de transformation ni de schéma versionné.** Une suite de scripts,
  une par étape, donne un résultat plus vite. La reproductibilité vient de git, qui
  fige le code et les référentiels publics, et de `mapping.json`, qui reste local.
- **`build/` se régénère**, donc ne se versionne pas. Chaque étape se relance seule
  à partir des artefacts de la précédente.
- **L'enveloppe est une dimension d'analyse**, pas un filtre : voir plus haut.
