# Le livrable de l'éditeur

> Dernière mise à jour : 2026-10-26

Le modèle d'éligibilité est **écrit par l'éditeur**, pas par nous. Il arrive en
paquet, version après version. Ce document dit ce qu'on en garde, ce qui fait
foi, et comment on lui répond. La marche à suivre pour intégrer une version est
dans le skill `implement-publicodes-version`.

## Le dossier d'une version

Tout ce qui concerne une version vit dans `tmp/<version>/`, à la racine du
dépôt. `tmp/` n'est pas versionné : depuis un worktree, c'est celui du checkout
principal.

| Chemin | Ce qu'il contient |
|---|---|
| `tmp/<version>/package/` | le livrable de l'éditeur, tel qu'il arrive, et rien d'autre |
| `tmp/<version>/retour-editeur/` | le retour à l'éditeur : `message.md`, et une annexe au besoin |
| `tmp/<version>/anomalies/` | un fichier par anomalie remontée |
| `tmp/<version>/` | nos autres notes : revues de PR, cahiers de test, arbitrages, audits |

Une note va dans la version du modèle sur laquelle elle a été écrite : pour une
revue ou un cahier de test, celle de `rules/VERSION` à la tête de la PR. Ce qui
ne dépend d'aucune version (rapports d'activité, cerfa vierges) reste à la
racine de `tmp/`.

On n'écrit rien dans `package/`, et on n'y lance pas les tests de l'éditeur :
un fichier de plus, et son manifeste ne tient plus. Un paquet livré en archive
s'y dépose avec son contenu extrait.

## Ce que le dépôt garde du paquet

Le dépôt ne garde que quatre pièces du paquet, **recopiées telles quelles**
(D-70, D-103) :

| Pièce du paquet | Où elle va |
|---|---|
| `transports-sanitaires.publicodes.v<version>.yaml` | `core/models/eligibilite/rules/regles.publicodes` |
| le numéro de la version | `core/models/eligibilite/rules/VERSION` |
| `integration_resultats/catalogue-resultats.json`, les textes de R2 | `core/models/eligibilite/rules/catalogue-resultats.json` |
| `formulaires/*.pdf`, les gabarits des cerfa | `front/models/eligibilite/r3/gabarits/` |

`pnpm regles` recalcule `rules/regles.json` d'après le YAML : c'est lui que le
code importe. Il écrit aussi `rules/regles.graphe.json`, le graphe de décision
des règles (D-216). Il s'arrête si une livraison emploie un mécanisme que le
graphe ne traduit pas encore.

Le reste du paquet est **retranscrit** dans le code, selon les règles du dépôt :

| Pièce du paquet | Ce qu'elle devient |
|---|---|
| le dictionnaire des cibles, les faits que les règles reçoivent | `core/models/eligibilite/declarations/` (`cibles.ts`, `faits.ts`) |
| le catalogue des questions et leurs libellés | `declarations/questions.ts` et les pages de `p1/`, `p2/`, `p3/` |
| le contrat réponses/faits (`CONTRAT_REPONSES_FAITS.json` et les contrats qui le précisent) | un fichier par fait, sous `faits/` |
| l'oracle, dans le dossier `tests/` du paquet | `tests/model/eligibilite/`, en faits et en réponses (D-79) |
| le mapping des gabarits | les cerfa de `front/models/eligibilite/r3/` |

## Ce qui fait foi

- **Les règles, les contrats et les documents du paquet** : le YAML, les
  `CONTRAT_*`, le `GUIDE_DEVELOPPEUR_v<version>.md`, les tickets de l'éditeur.
  Une règle codée cite la phrase qui la fonde.
- **Les tests livrés donnent l'oracle** : des cas et leurs attendus. Ils gardent
  leur identifiant chez nous (`D01`, `TS1012-03`) : c'est sous ce nom qu'un
  désaccord remonte.
- **Le code livré n'est pas une spec.** Un script ou un démonstrateur de
  l'éditeur peut montrer un attendu. Un écart avec lui n'est pas une anomalie
  tant qu'aucun contrat ni document ne le fonde.

## Ce qu'on ne fait jamais

- **Corriger le modèle chez nous.** Le YAML est recopié tel qu'il est livré.
  Ce qui ne va pas se constate, puis se remonte à l'éditeur.
- **Trancher à la place de l'éditeur.** Masquer une question, ajouter une
  garde, choisir un texte : ce sont ses arbitrages. On lui remonte le cas, on ne
  le code pas sans son aval.
- **Réparer un attendu sans comprendre.** Un attendu qui change dit qu'un
  comportement du modèle a bougé. On le met à jour, et le commit dit pourquoi.
- **Mettre une version dans un nom.** Un fichier de test ou du modèle vaut pour
  la version en cours. Seuls les identifiants du livrable gardent leur numéro.
  *Gardé par* `tests/recette-sans-version.test.ts`.

## En attendant une réponse de l'éditeur

On intègre quand même. Le comportement livré est gardé, et un test le constate.
Le jour où l'éditeur corrige, ce test redevient rouge et le dit.

Une anomalie remontée se revérifie à chaque version, même si le changelog n'en
parle pas.

## Répondre à l'éditeur

Un retour est **un message court et numéroté**, écrit pour être envoyé tel
quel. Le destinataire ne connaît ni notre code ni nos tests.

```markdown
<Une phrase d'ouverture : la version lue, ce qu'on en a fait.>

**Levés**
1. <Intitulé court> : <une ou deux phrases>. <lien du ticket>

**Bloquants**
2. …

**Sans urgence**
3. …

**À valider**
4. <Notre lecture, en une phrase.> Tu confirmes ?
```

- Un point dit ce qu'on a constaté, puis ce qu'on propose. Le fait et
  l'hypothèse ne s'écrivent pas sur le même ton.
- Un constat se reproduit avant de s'écrire : un cas rejoué au moteur, ou un
  test qui a changé de résultat.
- Le détail (un tableau fait par fait, des cas rejoués) va dans une annexe, et
  seulement pour les points qui en ont besoin.
- Une question produit va dans le ticket de l'éditeur qui lui correspond déjà,
  comme un point de plus. On n'ouvre pas de ticket pour elle.
