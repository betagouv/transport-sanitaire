---
name: revue-d-une-issue
description: Faire la revue d'une issue et de sa PR, fonctionnelle puis technique. Elle donne le contexte, un tl;dr, les écarts à l'issue et aux maquettes, ce que les tests couvrent, un cahier de tests à cocher, un verdict, et lance l'app en local pour tester. À charger dès qu'on demande de revoir, relire ou recetter une issue, une PR ou une branche.
---

# Revue d'une issue

La revue aide le relecteur à décider : fusionner, faire corriger, ou poser une
question. Elle est **fonctionnelle d'abord, technique ensuite**. Elle suit la
section « Communication » d'[AGENTS.md](../../../AGENTS.md) : mots simples,
phrases courtes, un exemple pour chaque point délicat.

## Ce qu'elle produit

| Quoi | Où |
|---|---|
| La revue complète | `tmp/<version>/revue-<n>.md` (non suivi), sur le gabarit plus bas |
| L'app à la tête de la PR | worktree `.claude/worktrees/revue-<n>`, ouverte dans le navigateur intégré |
| Un résumé de quelques lignes | dans la conversation, avec le lien vers le fichier |
| Le verdict en commentaire de PR | seulement si le relecteur le demande |

`<version>` est celle du modèle à la tête de la PR :
`git show <tête>:apps/simulateur-eligibilite/core/models/eligibilite/rules/VERSION`.
Le rangement de `tmp/` est dans
[`livrable-de-l-editeur.md`](../../../apps/simulateur-eligibilite/docs/knowledge/domain/livrable-de-l-editeur.md)
§ « Le dossier d'une version ».

Le type de la PR (`feat`, `fix`, `docs`…) vient de son titre. Les points clés
fonctionnels et le cahier de tests ne se font que pour un `feat`.

## 1. Rassembler

```
git fetch origin
tsp issue show <n>
gh pr list --search "<n>" --state open
gh pr view <pr> --json title,body,baseRefName,headRefName,headRefOid,mergeable,statusCheckRollup
git diff --stat origin/<base>...origin/<head>
```

- Lire l'issue parente : elle donne le contexte (chantier, étape, ce qui vient
  avant et après).
- Lire le corps de la PR : « ce qui n'est pas fait », « comment valider », la
  pile (« empilée sur … »).
- **Relire la tête de la PR (`origin/<head>`), jamais la branche locale.** Elle
  peut être en retard ou partie d'une autre base. Ex. pour #132, la branche
  locale portait 14 commits d'une ancienne pile ; la PR, un seul.
- Repérer la maquette de chaque page que la PR touche : celle que l'issue
  cite, sinon celle du livrable. Une page a souvent une maquette, même quand
  l'issue ne parle que des textes. Ex. pour R2 du simulateur, les gabarits et
  les aperçus de `integration_resultats/`.

## 2. Lancer l'app

Le faire tôt : les vérifications à l'écran de l'étape 3 en ont besoin.

```
git worktree add --detach .claude/worktrees/revue-<n> origin/<head>
cd .claude/worktrees/revue-<n> && pnpm install --frozen-lockfile
cp apps/<app>/.env .claude/worktrees/revue-<n>/apps/<app>/.env   # si l'app en a un
```

Ajouter une entrée `revue-<n>` à `.claude/launch.json`, sur le modèle des
autres, puis `preview_start`. Le chemin d'accès aux outils de l'app (ex. pour
le simulateur : service n° 4, puis « Modèle de l'éditeur ») est dans son
`apps/<app>/AGENTS.md`. Le dire en tête du cahier.

Les apps des worktrees s'arrêtent à l'annonce de la fusion (hook local).

## 3. Revue fonctionnelle

1. **Points clés** (`feat`) : ce qui change pour l'utilisateur, en 3 à 6
   puces. Ex. « Dix seeds, une par issue de R2, ouvrent le résultat ».
2. **Écarts à l'issue** : chaque critère d'acceptation, fait, pas fait ou écart
   assumé, avec sa raison. Ajouter ce que la PR dit ne pas faire.
3. **Maquettes** : ouvrir chaque page de la PR et sa maquette côte à côte,
   dans le navigateur intégré, sur ordinateur puis sur mobile, et à
   l'impression s'il y en a une. Comparer les blocs, les cadres, les couleurs,
   les colonnes, les illustrations, la place des boutons, et les comportements
   (bloc caché s'il est vide, bloc dépliable, carte retenue). On attend les
   comportements, pas une copie du HTML ou du CSS : ils vivent dans des
   composants génériques du socle. Ex. pour #176 : dans l'aperçu, « Pourquoi
   ce résultat ? » est un panneau gris à filet bleu ; dans la PR, un titre et
   un paragraphe nus. Un écart que le journal ne décide pas est un bloquant.
   Sans maquette, le dire.
4. **Couverture** : un tableau de ce que les tests automatiques couvrent déjà
   (`grep -n "describe(\|it(" <fichiers de test du diff>`). Puis vérifier à
   l'écran ce qui se vérifie vite (ex. les seeds « Conforme », chacune ouvre le
   bon résultat) et le dire. Enfin, dire ce qui n'est pas couvert.
5. **Cahier de tests** (`feat`) : seulement ce que ni les tests ni l'agent
   n'ont vu (aspect, textes, enchaînement à l'écran). D'abord le chemin
   nominal, puis les comportements singuliers. Dix minutes au plus.

Format du cahier : un parcours par titre, avec sa durée, une case par
vérification.

```
### 2. Une seed, de bout en bout, 2 min

- [ ] **« Précédent » jusqu'à la page de la permission** → les dates de la seed sont dans les champs.
```

## 4. Revue technique

1. **Points clés d'implémentation** : les fichiers et fonctions qui portent le
   changement, les choix faits, avec des liens `fichier:ligne`.
2. **Conformité** : relire le diff contre les règles du dépôt (`tsp rules`),
   l'`AGENTS.md` de l'app, et les décisions que la PR cite (journal, ADR).
3. **Vérification** : la CI dit si `verifier` passe. Ne pas relancer la suite
   quand elle est verte.

## 5. Verdict

Trois listes, chaque point avec son `fichier:ligne` ou son étape du cahier :

- **Bloquants** : à corriger avant la fusion ;
- **À corriger** : peut suivre dans une autre PR ;
- **Remarques** : questions, idées, rien d'obligatoire.

Rédigé pour pouvoir être collé en commentaire de PR. Le poster
(`gh pr comment`) seulement sur demande du relecteur.

## Gabarit de `tmp/<version>/revue-<n>.md`

```markdown
# Revue de #<n> : <titre court>

Issue : <url> · PR : <url> (base `<base>`, empilée sur #<m>, CI verte)

## Contexte

<deux ou trois phrases : le chantier, l'étape, ce qui vient avant et après>

## TL;DR

- <trois puces au plus>

## Fonctionnel

### Points clés
### Écarts à l'issue

| Critère | État | Note |
|---|---|---|

### Maquettes

| Page | Maquette | Écart |
|---|---|---|

### Couverture

| Sujet | Couvert par | Fichier |
|---|---|---|

Vérifié à l'écran par l'agent : …
Pas couvert : …

### Cahier de tests

App : http://localhost:<port> · Pour entrer : …

## Technique

### Points clés d'implémentation
### Conformité aux règles

## Verdict

- **Bloquants** : …
- **À corriger** : …
- **Remarques** : …
```
