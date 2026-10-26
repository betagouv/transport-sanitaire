# Livrer une version

> Ce qu'une livraison produit, et les règles de son journal, de son tag et de
> sa release. La marche à suivre est dans le skill `livrer-une-version`.

## Une livraison ne concerne qu'une app

Le workspace pnpm met en commun l'installation des dépendances, pas les
versions. Il n'y a pas de tag global : chaque app porte sa version dans son
`package.json` et suit son propre cycle.

C'est la livraison qui appelle un journal, pas la présence d'un `package.json`.
Seul le simulateur est livré aujourd'hui. `glossaire-notion` et `cli` portent un
numéro sans journal ni tag, et `data-analyzer`, en `0.0.0`, tourne sans être
livrée.

## Ce qu'une livraison produit

| Quoi | Où |
|---|---|
| le numéro | `apps/<app>/package.json` |
| ce qu'elle apporte | `apps/<app>/CHANGELOG.md`, la plus récente en haut |
| le commit | `chore(<scope>): livre la version X.Y.Z`, par une PR vers `staging` (GIT-009) |
| le tag | annoté, `<app>@X.Y.Z`, sur ce commit |
| la page publique | une release GitHub sur ce tag |

**Les cinq vont ensemble.** Le pied de page du simulateur affiche la version de
son `package.json` et renvoie vers sa release. Un numéro déployé sans release
publiée fait un lien mort en production.

*Gardé par* `tests/socle/app/footer.test.tsx`, pour le lien, et
`gh release create --verify-tag`, pour le tag.

## Ce qui part en production

`main` ne reçoit que des fusions de `staging` (GIT-009), et Scalingo déploie
depuis `main`. Une livraison suit donc cet ordre :

1. le commit de livraison rejoint `staging` par sa PR ;
2. le tag et la release se posent sur ce commit ;
3. `staging` est fusionné dans `main`.

Le tag et la release existent avant que `main` bouge : le lien du pied de page
marche dès le déploiement.

`main` doit toujours être contenu dans `staging`. Sinon, le journal et le numéro
de `staging` ignorent la dernière livraison.

## Le numéro

Semver. Un `feat` dans le périmètre appelle une mineure, des `fix` seuls un
patch. On reste en `0.x` tant que la surface publique n'est pas figée.

Le numéro est une **décision produit** : on le propose avec sa raison, on ne le
tranche pas seul.

## Le périmètre

Le périmètre d'une version, ce sont les commits de `apps/<app>/` entre le tag
précédent et le commit de livraison. **Chacun apparaît une fois et une seule
dans le journal.** Un commit fusionné dans `staging` pendant que la PR de
livraison est ouverte entre dans le périmètre : il faut l'ajouter au journal.

Le journal renvoie à chaque commit par son sha. Les commits cités doivent donc
déjà être sur `origin/staging`.

## L'entrée du journal

```markdown
## [0.5.0](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%400.5.0), 3 novembre 2026

<Une ou deux phrases : ce que la version rassemble, et depuis quel point.>

### TL;DR

- <Ce qu'un lecteur pressé doit retenir, une ligne par sujet.>

### ✨ Nouveautés

- [e55fbc7](https://github.com/betagouv/transport-sanitaire/commit/e55fbc7) : rapetisse un texte jusqu'à ce qu'il tienne dans son cadre. …
```

- Le `@` du tag s'écrit `%40` dans le lien du titre : c'est l'adresse sous
  laquelle GitHub sert une release.
- Les sections viennent dans cet ordre, selon le type du commit. Chacune garde
  toujours le même emoji :

  | Type de commit | Titre de section |
  |---|---|
  | `feat` | `### ✨ Nouveautés` |
  | `fix` | `### 🐛 Corrections` |
  | `refactor`, `perf` | `### ♻️ Sous le capot` |
  | `test` | `### ✅ Tests` |
  | `docs` | `### 📝 Documentation` |

  Une section vide ne s'écrit pas. Le TL;DR n'a pas d'emoji : il résume la
  version, il ne groupe pas des commits.
- **Une ligne par commit** : le sha court, puis un verbe à la 3ᵉ personne de
  l'indicatif présent (GIT-004).
- La ligne **ne recopie pas le sujet du commit**. Elle est écrite pour qui lit
  le produit, tirée du corps du commit, et dit ce qui change pour l'utilisateur.

## Le tag et la release

- Le **message du tag** reprend le titre `<app> <version>`, puis le TL;DR. C'est
  ce que montre `git show <tag>`, sans réseau.
- Le **corps de la release** est l'entrée du journal, sans son titre, que GitHub
  affiche déjà. Jamais `--generate-notes` : GitHub y liste les sujets de commit,
  et la version aurait deux textes concurrents.

## Ne pas réécrire l'historique d'une version publiée

Le journal renvoie aux commits par leur sha. Un `rebase`, un `amend` ou un
`filter-branch` les change tous : chaque lien du journal meurt, le tag avec.
Si l'historique doit vraiment être réécrit, on refait les liens du journal et
on replace les tags dans le même geste, avant de pousser.
