---
name: revue-d-une-pr
description: Faire la revue d'une PR et de son ticket Notion, fonctionnelle puis technique. Elle donne le contexte, un tl;dr, les écarts au ticket, ce que les tests couvrent, un cahier de tests à cocher, un verdict, et lance l'app en local pour tester. À charger dès qu'on demande de revoir, relire ou recetter une PR ou une branche.
---

# Revue d'une PR

La revue aide le relecteur à décider : fusionner, faire corriger, ou poser une
question. Elle est **fonctionnelle d'abord, technique ensuite**. Elle suit la
section « Communication » d'[AGENTS.md](../../../AGENTS.md).

Les règles qu'elle contrôle sont dans `docs/knowledge/contributing/`, dans
l'`AGENTS.md` de l'app, et dans les décisions que la PR cite. Pour l'aspect des
pages : [`apps/simulateur-eligibilite/AGENTS.md`](../../../apps/simulateur-eligibilite/AGENTS.md)
§ « Pièges ».

## Ce qu'elle produit

| Quoi | Où |
|---|---|
| La revue complète | `tmp/<version>/revue-<n>.md` (non suivi), sur le gabarit plus bas |
| L'app à la tête de la PR | worktree `.claude/worktrees/revue-<n>`, ouverte dans le navigateur intégré |
| Un résumé de quelques lignes | dans la conversation, avec le lien vers le fichier |
| Le verdict en commentaire de PR | seulement si le relecteur le demande |

`<version>` est celle du modèle à la tête de la PR (`rules/VERSION`). Le
rangement de `tmp/` est dans
[`livrable-de-l-editeur.md`](../../../apps/simulateur-eligibilite/docs/knowledge/domain/livrable-de-l-editeur.md)
§ « Le dossier d'une version ».

Le type de la PR vient de son titre. Les points clés fonctionnels et le cahier
de tests ne se font que pour un `feat`.

## 1. Rassembler

```
git fetch origin
gh pr view <pr> --json title,body,baseRefName,headRefName,headRefOid,mergeable,statusCheckRollup
git diff --stat origin/<base>...origin/<head>
```

- Lire le corps de la PR : le lien du ticket Notion, « ce qui n'est pas fait »,
  « comment valider », la pile (« empilée sur … »).
- Lire le ticket Notion s'il y en a un : le contexte, ce qui vient avant et
  après, la ligne de la liste à cocher que la PR clôt.
- **Relire la tête de la PR (`origin/<head>`), jamais la branche locale.**
- Repérer la maquette de chaque page touchée : celle que le ticket cite, sinon
  celle du livrable.

## 2. Lancer l'app

Le faire tôt : l'étape 3 en a besoin.

```
git worktree add --detach .claude/worktrees/revue-<n> origin/<head>
cd .claude/worktrees/revue-<n> && pnpm install --frozen-lockfile
cp apps/<app>/.env .claude/worktrees/revue-<n>/apps/<app>/.env   # si l'app en a un
```

Ajouter une entrée `revue-<n>` à `.claude/launch.json`, puis `preview_start`.
Le chemin d'accès aux outils de l'app est dans son `apps/<app>/AGENTS.md` : le
dire en tête du cahier.

## 3. Revue fonctionnelle

1. **Points clés** (`feat`) : ce qui change pour l'utilisateur, en 3 à 6 puces.
2. **Écarts au ticket** : chaque point attendu, fait, pas fait ou écart assumé,
   avec sa raison. Ajouter ce que la PR dit ne pas faire.
3. **Maquettes** : chaque page de la PR face à sa maquette, dans le navigateur
   intégré, sur ordinateur puis sur mobile. Un écart qu'aucune décision
   n'acte est un bloquant. Sans maquette, le dire.
4. **Couverture** : un tableau de ce que les tests couvrent déjà
   (`grep -n "describe(\|it(" <tests du diff>`). Puis vérifier à l'écran ce qui
   se vérifie vite, et dire ce qui n'est pas couvert.
5. **Cahier de tests** (`feat`) : seulement ce que ni les tests ni l'agent n'ont
   vu (aspect, textes, enchaînement). Le chemin nominal d'abord, dix minutes au
   plus. Un parcours par titre, avec sa durée, une case par vérification :

```
### 2. Une seed, de bout en bout, 2 min

- [ ] **« Précédent » jusqu'à la page de la permission** → les dates de la seed sont dans les champs.
```

## 4. Revue technique

1. **Points clés d'implémentation** : les fichiers et fonctions qui portent le
   changement, avec des liens `fichier:ligne`.
2. **Conformité** : le diff contre les règles et les décisions citées plus haut.
3. **Vérification** : la CI dit si `verifier` passe. Ne rien relancer en local.

## 5. Verdict

Trois listes, chaque point avec son `fichier:ligne` ou son étape du cahier :

- **Bloquants** : à corriger avant la fusion ;
- **À corriger** : peut suivre dans une autre PR ;
- **Remarques** : rien d'obligatoire.

Le poster (`gh pr comment`) seulement sur demande du relecteur.

## Gabarit de `tmp/<version>/revue-<n>.md`

```markdown
# Revue de #<n> : <titre court>

PR : <url> (base `<base>`, CI verte) · Ticket : <url Notion, ou « aucun »>

## Contexte
## TL;DR
## Fonctionnel

### Points clés
### Écarts au ticket
### Maquettes
### Couverture

Vérifié à l'écran : … · Pas couvert : …

### Cahier de tests

App : http://localhost:<port> · Pour entrer : …

## Technique

### Points clés d'implémentation
### Conformité

## Verdict
```
