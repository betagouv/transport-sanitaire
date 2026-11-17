# Alimenter Grist depuis les noms saisis à l'écran de rattachement

> Statut : **implémenté**. Décisions validées avec le porteur le 2026-07-08, révisées
> le 2026-09-29, le 2026-11-04, le 2026-11-09 et le 2026-11-17.
>
> **Mise à jour 2026-11-17, les ids de la saisie dès la première visite (#506,
> ANA22-01).** L'entrée attend désormais que le référentiel crée la saisie, pour que
> le parcours porte ses ids dès cette visite. L'id de l'entrée « Autre » ne part
> plus, et le repli « Autre / Autre » disparaît. La collecte met en quarantaine un
> événement dont le rattachement n'est pas au référentiel.
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
> qui réalise la simulation (voir [l’ADR-0006](../adr/0006-le-rattachement-est-declaratif-et-sans-identite.md)).
> Les branches qui écrivaient un **prescripteur** dans Grist disparaissent :
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
  simulateur : le prescripteur entre sans les ids de sa saisie, et l'erreur est
  loguée.
- **Aucune personne dans Grist.** ~~Le nom et le prénom d'un prescripteur hors liste
  étaient écrits en clair dans la table `Prescripteurs`.~~ Depuis le 2026-09-29, l'app
  n'écrit plus aucune donnée de personne, et ne lit plus cette table.
- **Une attente bornée.** ~~Le front déclarait la saisie et entrait sans attendre
  la réponse.~~ Depuis le 2026-11-17 (#506), il envoie la saisie
  (`POST /api/rattachement`) et attend les ids créés, cinq secondes au plus. Le
  bouton affiche « Ouverture du simulateur… » pendant ce temps. Seules les saisies
  qui enrichissent le référentiel sont envoyées : un service choisi dans la liste
  n'apprend rien.
- **Les ids créés, dès la première visite.** ~~Matomo recevait l'id de l'entrée
  « Autre », et rien pour un établissement saisi.~~ Depuis le 2026-11-17 (#506),
  le parcours porte l'id du service créé, et celui de l'établissement créé. L'id
  de l'entrée « Autre » ne part jamais. Si le référentiel ne répond pas, un
  service saisi garde son établissement seul, et un établissement saisi part sans
  id. Aucun nom saisi ne part, ni à Matomo, ni au journal.
- **Quarantaine à la collecte.** Le journal vérifie chaque paire contre le
  référentiel, lu en cache dix minutes : un id inconnu y relit le référentiel,
  pour qu'une saisie tout juste créée passe. Un établissement inconnu, ou un
  service hors de son établissement, va dans la table `Quarantaine`, avec sa
  raison, et ne compte pas parmi les événements valides.

## Ce qui s'écrit

| Sélection | Écriture Grist |
|---|---|
| service « Autre » + `serviceLibre` | le vrai service, créé ou réutilisé sous l'établissement |
| « Autre établissement » + `etabLibre` + `serviceLibre`, établissement inconnu | l'établissement créé, son service « Autre », puis le service saisi sous lui |
| « Autre établissement » + `etabLibre` + `serviceLibre`, établissement homonyme | le service saisi, créé ou réutilisé sous l'établissement existant |
| tout autre service du référentiel, structures comprises | rien |
| ~~prescripteur hors liste~~ | ~~prescripteur créé sous le service~~ (retiré le 2026-09-29) |
| ~~prescripteur listé sous « Autre »~~ | ~~prescripteur déplacé vers le vrai service~~ (retiré le 2026-09-29) |

| La route répond | Quand |
|---|---|
| 200, `{etabId, serviceId}` | la saisie est créée ou réutilisée |
| 400 | la saisie est incomplète, trop longue, ou vient des listes |
| 502 | Grist échoue, ou l'établissement de la saisie n'est pas au référentiel |
| 503 | la source n'écrit pas : le snapshot factice, en local et en recette sans Grist |

**Prérequis Grist** : la colonne `Origine` doit exister sur `Services_Unites` et sur
`Etablissements`. Le document du journal doit avoir une table `Quarantaine`, aux
colonnes de `Collisions` plus `reason` (texte) : sans elle, la collecte d'un
événement hors référentiel répond 503.

## Vérification

```bash
# Route et enrichissement, sans Grist (double en mémoire)
pnpm --filter simulateur-eligibilite exec vitest run tests/socle/server/enrichissement.test.ts

# La source Grist contre un Grist en mémoire servi en HTTP : création, « Autre », réutilisation, Origine
pnpm --filter simulateur-eligibilite exec vitest run tests/socle/server/referentiel-grist.test.ts

# Les ids au parcours, l'attente de l'écran, la quarantaine à la collecte
pnpm --filter simulateur-eligibilite exec vitest run rattachement-du-parcours enregistrement-au-serveur rattachement-obligatoire collecte-du-rattachement referentiel-en-cache

# Contre le vrai Grist : crée de vraies lignes, à purger à la main côté admin
GRIST_ECRITURE_TEST=1 GRIST_API_KEY=… pnpm --filter simulateur-eligibilite exec vitest run grist-ecriture
```
