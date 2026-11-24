# Écrire une règle de contribution

> Comment ajouter, modifier ou retirer une règle numérotée de ce dossier. Les
> règles elles-mêmes sont dans [`regles-de-code.md`](regles-de-code.md) et
> [`regles-git.md`](regles-git.md).

Il y a **un recueil par domaine**, et non un fichier par règle.

| Recueil | Préfixe | Ce qu'il couvre |
|---|---|---|
| `regles-de-code.md` | `QUAL-` | forme d'un fichier, découpage, noms, exports, suppressions de lint |
| `regles-git.md` | `GIT-` | branche et PR vers `staging`, forme du message, métadonnée d'IA, confidentialité |
| `apps/simulateur-eligibilite/docs/knowledge/contributing/regles-d-architecture.md` | `ARCH-` | frontières, modèles, adaptateurs, lecture des faits, déclaration des questions du simulateur |

Les skills ne portent qu'un pointeur vers ce dossier, et les `AGENTS.md`
générés n'en reprennent que l'index. **N'y recopie pas les règles** : une copie
dérive.

## Le squelette d'une règle

~~~~markdown
---

### QUAL-021 - Le titre, à l'infinitif ou au présent

> Raison : ce qui casse sans la règle. Une à trois phrases courtes.

Le corps, facultatif. Ce que la règle demande exactement, quand le titre ne
suffit pas. Les exceptions vont ici.

**Exemples**

```ts
// ✅ OK : ce qui rend l'exemple juste
```

```ts
// ❌ KO : ce qui rend l'exemple faux
```

*Gardé par* `tests/lisibilite.test.ts › nom de l'assertion`.
~~~~

Le `---` se met **avant** la règle. Le titre sépare l'identifiant du nom par un
trait d'union entouré d'espaces, jamais par un tiret cadratin.

## L'identifiant

Le numéro est attribué à la suite, sur trois chiffres, et **ne se réutilise
jamais**. Si `QUAL-014` est retirée, la suivante reste `QUAL-021`.

Un numéro réemployé ferait pointer un vieux commit ou une vieille revue sur une
autre règle. C'est la même raison qui fait garder les ADR révoqués dans
`docs/knowledge/adr/`, avec le statut « révoqué », plutôt qu'effacés.

Une règle retirée disparaît du corps du recueil. Sa ligne d'index reste, barrée,
avec la date et le motif :

```markdown
| ~~QUAL-014~~ | ~~Pas de suppression pour un linter absent~~ | retirée le 2026-09-01, le linter a été ajouté |
```

## La raison

La raison dit **ce qui casse sans la règle**, pas que la règle est bonne. Si elle
se relit comme une reformulation du titre, elle ne sert à rien.

```markdown
✅ OK
> Raison : un privé sous le marqueur est appelé depuis plus haut. En `const`
> fléché, il n'existe pas encore au moment de l'appel. C'est une erreur TDZ à
> l'exécution, que le typecheck ne voit pas.
```

```markdown
❌ KO
> Raison : il est important d'utiliser des fonctions hoistées pour la lisibilité
> et la maintenabilité du code.
```

Trois phrases courtes suffisent : pas plus de quatre, aucune de plus de 25 mots.
Rien ne le vérifie encore, c'est à la relecture.

## Les deux exemples

Un exemple juste, un exemple faux, jamais plus. La glose se met en commentaire
sur la première ligne, derrière deux-points.

- **Le KO est l'erreur réellement commise**, pas une caricature. `QUAL-014` cite
  l'`eslint-disable` qui a dormi des mois dans `Parcours.tsx`.
- **Les deux exemples portent sur le même cas.** Un OK et un KO qui parlent de
  deux sujets ne se comparent pas.
- **Le bloc porte son langage** (`ts`, `tsx`, `bash`) quand c'en est. Une
  arborescence, un message de commit ou un nom de fichier vont dans un bloc nu.

Dans un bloc nu, la glose n'a pas de commentaire où vivre. Elle se colle alors au
marqueur :

```
✅ OK : coupé par sujet, chaque nom dit une feature
cerfa/field-mapping.ts
cerfa/lieux-du-trajet.ts
```

## La garde

Une règle peut avoir une garde : un test, une règle de lint. Elle n'y est pas
obligée. Toute règle finit pourtant par une ligne qui dit où elle en est.

| Cas | Ce qu'on écrit |
|---|---|
| Une garde l'applique | `*Gardé par* <chemin du test ou règle du linter> › <nom de l'assertion>` |
| Une garde n'en couvre qu'une partie | `*Gardé par* <la garde>, *seulement* <ce qu'elle vérifie>.` |
| Aucune garde | `*Aucune garde.* <pourquoi, en une phrase>` |

- **La ligne dit exactement ce que la garde vérifie, pas plus.** Une garde qui
  ne voit qu'un côté de la règle le dit (« garde seulement … »), pour ne pas
  laisser croire que le reste est tenu.
- **Une garde n'est pas obligatoire.** On n'en écrit pas quand elle serait trop
  complexe à tenir, ou trop restrictive : elle refuserait des cas légitimes. La
  règle écrit alors `*Aucune garde.*`. Ce n'est pas une dette, c'est un choix.

L'état de chaque règle se lit dans la colonne « Garde » du tableau de son recueil,
et nulle part ailleurs : le recopier créerait deux sources à tenir à jour.

Vérifie le nom de l'assertion avant de le citer :

```bash
grep -nE '^\s*(describe|it)\(' apps/simulateur-eligibilite/tests/lisibilite.test.ts
```

## Ce qu'il faut toucher en plus

| Endroit | Quoi |
|---|---|
| Le tableau d'index du recueil | une ligne : identifiant, titre, garde |
| L'en-tête du recueil (`> Les N règles`) et son chapô (`**N règles**`) | le décompte, si le nombre change |
| Les `AGENTS.md` | rien à écrire à la main : lance `pnpm agents`, qui reprend le tableau d'index du recueil |

Compare les décomptes à l'index avant de committer : rien ne les vérifie.

## Ce qui ne va pas là

Ce qui n'est pas une règle numérotée se range ailleurs :
[`travailler-dans-le-depot.md`](travailler-dans-le-depot.md#où-écrire-quoi) dit où.

**Une règle qui ne vaut que pour une app va dans le recueil de cette app**,
`apps/<app>/docs/knowledge/contributing/`, avec son propre préfixe (`ARCH-` pour
le simulateur). Les recueils de la racine valent pour le dépôt entier : une
exception logée dedans serait invisible depuis l'app qu'elle concerne. L'`AGENTS.md` de l'app, généré, en reprend l'index.
