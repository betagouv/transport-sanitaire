# Alimenter Grist depuis les noms saisis à l'écran de rattachement

> Statut : **implémenté**. Décisions validées avec le porteur le 2026-07-08, révisées
> le 2026-09-29, le 2026-11-04 et le 2026-11-09.
>
> **Mise à jour 2026-11-09, service « Autre » de l'établissement saisi (#368).** Un
> établissement créé depuis la saisie reçoit aussi son service « Autre », comme ceux de
> l'admin. Le collègue qui le retrouve dans la liste sans y voir son service peut ainsi
> le saisir.
>
> **Mise à jour 2026-11-04, établissement saisi (#197, #199).** L'écran propose « Autre
> établissement » : le prescripteur dont l'établissement n'est pas listé le saisit avec
> son service. Les deux sont écrits dans Grist, aux mêmes règles que le service saisi
> sous « Autre ». Le document s'appelait « Alimenter Grist depuis le service saisi ».
>
> **Mise à jour 2026-09-29, rattachement sans identité.** L'écran de rattachement ne demande plus
> qui réalise la simulation (voir [l'ADR d'identification](../adr/identification.md),
> ADR-3). Les branches qui écrivaient un **prescripteur** dans Grist disparaissent :
> plus de création d'un prescripteur « hors liste », plus de déplacement d'un
> prescripteur listé sous « Autre » vers son vrai service. Seule reste l'écriture du
> **service** saisi sous « Autre ». Le document s'appelait
> `enrichissement-referentiel-saisies-libres.md`.
>
> **Historique.**
>
> - 2026-07-21 : la branche « non rattaché » (catégories libéral / CNAM) est supprimée.
>   Ces prescripteurs sélectionnent l'établissement « Libéral / CNAM / CPAM / Autre ».
> - 2026-07-22 : la sentinelle `SERVICE_AUTRE` et son service libre disparaissent.
>   « Autre » devient une entrée du référentiel, un service par établissement. La
>   saisie du service réel est réintroduite derrière cette entrée.

## Contexte

L'écran de rattachement capture du texte libre, plutôt qu'une sélection dans une liste du
référentiel, dans deux cas :

- le prescripteur choisit le service « Autre » d'un établissement et saisit son service
  ou son unité réels (`serviceLibre`) ;
- son établissement n'est pas listé : il choisit « Autre établissement » et saisit le
  nom de l'établissement (`etabLibre`) et celui de son service (`serviceLibre`).

Sans enrichissement, ce texte serait perdu. Le but est qu'il enrichisse le
référentiel Grist, pour que l'admin et les prescripteurs suivants en bénéficient sans
avoir à ressaisir.

## Décisions

- **Écriture directe dans le référentiel**, dans les tables `Services_Unites` et
  `Etablissements`, avec une colonne `Origine` valant `formulaire` pour marquer la
  provenance. L'admin peut ainsi filtrer et trier.
- **Visible immédiatement.** La ligne créée reçoit un `Id2` automatique, le `max(Id2)`
  de sa table plus un, pour apparaître dans la liste des prescripteurs suivants.
- **Sans doublon.** La déduplication se fait sur le `Nom` normalisé (casse et espaces) :
  pour un service, sous le même établissement ; pour un établissement, dans toute la
  table. On réutilise une ligne existante au lieu d'empiler.
- **L'établissement d'abord.** Pour un établissement saisi, on crée ou réutilise
  l'établissement, puis son service sous lui.
- **Un « Autre » par établissement créé.** Créer un établissement crée aussi son
  service « Autre », avant le service saisi, aux mêmes règles. Un établissement
  réutilisé n'en reçoit pas : il a déjà le sien.
- **Non bloquant.** Une écriture Grist qui échoue ne bloque jamais l'accès au
  simulateur. C'est une dégradation gracieuse, et l'erreur est loguée.
- **Aucune personne dans Grist.** ~~Le nom et le prénom d'un prescripteur hors liste
  étaient écrits en clair dans la table `Prescripteurs`.~~ Depuis le 2026-09-29, l'app
  n'écrit plus aucune donnée de personne, et ne lit plus cette table.
- **Sans attente.** Le front déclare la saisie (`POST /api/rattachement`) et entre
  dans le simulateur sans attendre la réponse. Seules les saisies qui enrichissent le
  référentiel sont déclarées : un service choisi dans la liste n'apprend rien.
- **Analytics.** Matomo reçoit l'id de l'entrée « Autre » du référentiel, le vrai
  service n'ayant pas encore d'id à la validation. La première visite est donc
  comptée sous « Autre », les suivantes sous le vrai service. Pour un établissement
  saisi, rien n'a d'id : l'événement part sans nom. C'est un décrochage mineur,
  assumé. Aucun nom saisi ne part à Matomo.

## Ce qui s'écrit

| Sélection | Écriture Grist |
|---|---|
| service « Autre » + `serviceLibre` | le vrai service, créé ou réutilisé sous l'établissement |
| « Autre établissement » + `etabLibre` + `serviceLibre`, établissement inconnu | l'établissement créé, son service « Autre », puis le service saisi sous lui |
| « Autre établissement » + `etabLibre` + `serviceLibre`, établissement homonyme | le service saisi, créé ou réutilisé sous l'établissement existant |
| tout autre service du référentiel, structures comprises | rien |
| ~~prescripteur hors liste~~ | ~~prescripteur créé sous le service~~ (retiré le 2026-09-29) |
| ~~prescripteur listé sous « Autre »~~ | ~~prescripteur déplacé vers le vrai service~~ (retiré le 2026-09-29) |

La route délègue toujours l'enrichissement à la source du référentiel ; c'est la
source Grist qui décide de ne rien écrire pour une sélection issue des listes. Le
snapshot factice et le client HTTP du front n'écrivent jamais.

**Prérequis Grist** : la colonne `Origine` doit exister sur `Services_Unites` et sur
`Etablissements`.

## Vérification

```bash
# Route et enrichissement, sans Grist (double en mémoire)
pnpm --filter simulateur-eligibilite exec vitest run tests/socle/server/enrichissement.test.ts

# La source Grist contre un Grist en mémoire servi en HTTP : création, « Autre », réutilisation, Origine
pnpm --filter simulateur-eligibilite exec vitest run tests/socle/server/referentiel-grist.test.ts

# Contre le vrai Grist : crée de vraies lignes, à purger à la main côté admin
GRIST_ECRITURE_TEST=1 GRIST_API_KEY=… pnpm --filter simulateur-eligibilite exec vitest run grist-ecriture
```
