---
name: livrer-une-version
description: Livrer une version d'une app : numéro, entrée de CHANGELOG, montée du package.json par une PR vers staging, tag `<app>@<version>`, release GitHub, puis fusion de staging dans main. À charger dès qu'il s'agit de livrer, publier, étiqueter ou « sortir une version ».
---

# Livrer une version

Ce skill ne porte que la marche à suivre. Les règles sont ailleurs :

| Ce qu'il faut savoir | Où |
|---|---|
| ce qu'une livraison produit, l'ordre de mise en production, le numéro, le format du journal, du tag et de la release | [`docs/knowledge/contributing/livraisons.md`](../../../docs/knowledge/contributing/livraisons.md) |
| la branche, la PR vers `staging`, le message de commit | [`docs/knowledge/contributing/regles-git.md`](../../../docs/knowledge/contributing/regles-git.md) (GIT-003 à GIT-009) |
| le déploiement sur Scalingo | `apps/simulateur-eligibilite/README.md` § « Déployer » |

Les exemples livrent `simulateur-eligibilite@0.5.0`, après la `0.4.0`.

## 1. Vérifier le point de départ

```bash
git fetch origin --tags
git merge-base --is-ancestor origin/main origin/staging && echo ok
```

Si la commande n'affiche pas `ok`, `main` porte un commit que `staging` n'a pas,
souvent la livraison précédente. Rapatrie-le d'abord, par une branche et sa PR :

```bash
tsp branch chore/rapatrie-main
git merge origin/main
tsp pr
```

## 2. Lister le périmètre

```bash
git log --oneline simulateur-eligibilite@0.4.0..origin/staging -- apps/simulateur-eligibilite
```

Lis le corps de chaque commit : c'est de lui que vient la ligne du journal.

## 3. Proposer le numéro

Propose-le au relecteur, avec sa raison, et attends sa réponse.

## 4. Écrire la livraison

```bash
tsp branch chore/livre-simulateur-0.5.0
cd apps/simulateur-eligibilite
pnpm version 0.5.0 --no-git-tag-version
```

`--no-git-tag-version` empêche pnpm de commiter et de poser le tag lui-même :
le tag vient plus tard, sur le commit de `staging`.

Écris ensuite l'entrée en haut de `CHANGELOG.md`, puis compte. Les deux nombres
doivent être égaux :

```bash
git log --oneline simulateur-eligibilite@0.4.0..origin/staging -- apps/simulateur-eligibilite | wc -l
awk '/^## \[/{n++} n==1' CHANGELOG.md | grep -c '^- \[[0-9a-f]\{7\}\]'
```

Le `pnpm-lock.yaml` ne doit pas bouger : il ne porte pas le numéro des apps. S'il
bouge, regarde pourquoi avant de commiter.

```bash
tsp verifier simulateur
git commit -am "chore(simulateur): livre la version 0.5.0"   # corps : GIT-005, GIT-006
tsp pr
```

Si `staging` reçoit un commit de l'app pendant que la PR est ouverte, ajoute-le
au journal et refais le compte.

## 5. Poser le tag et la release

Une fois la PR fusionnée, le tag se pose sur le commit qu'elle a laissé sur
`staging` :

```bash
git fetch origin
SHA=$(git log origin/staging -1 --format=%H --grep='livre la version 0.5.0')
git tag -a simulateur-eligibilite@0.5.0 "$SHA" -m "<titre, puis le TL;DR>"
git push origin simulateur-eligibilite@0.5.0
```

Le corps de la release est l'entrée du journal, sans son titre :

```bash
git show "$SHA:apps/simulateur-eligibilite/CHANGELOG.md" |
  awk '/^## \[/{n++} n==1' | tail -n +2 |
  gh release create simulateur-eligibilite@0.5.0 \
    --title "simulateur-eligibilite 0.5.0" --verify-tag --notes-file -
gh release view simulateur-eligibilite@0.5.0 --web
```

`--verify-tag` refuse la release si le tag n'est pas sur le distant.
`gh` est épinglé dans `mise.toml`. `gh auth status` dit si tu es connecté.

## 6. Mettre en production

`staging` rejoint `main` en avance rapide :

```bash
git push origin origin/staging:refs/heads/main
```

Git refuse ce push si `main` porte un commit que `staging` n'a pas : retour à
l'étape 1.

Scalingo déploie ensuite depuis `main`. Une fois le déploiement passé, ouvre le
simulateur en production : le pied de page annonce `0.5.0` et le sha déployé,
et le lien de la version ouvre la release.
