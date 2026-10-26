# Écrire une décision

> Où une décision s'écrit, et sous quelle forme : une ligne du journal, ou un
> ADR dans un document d'architecture. La marche à suivre est dans le skill
> `ecrire-une-decision`.

## Le journal ou le document

| Ce qu'on écrit | Où | Sa forme |
|---|---|---|
| une décision prise pendant un chantier | le journal du chantier, dans `docs/knowledge/adr/` de l'app (`journal-des-decisions-v10.md`) | une ligne `D-<n>` |
| une décision d'architecture qui tient | un document par sujet, dans `docs/knowledge/adr/` de l'app, ou de la racine si elle traverse plusieurs apps | un `ADR-<n>` |

Le journal sert de brouillon aux documents : un ADR s'en tire quand plusieurs
lignes font une décision de structure, et il cite les `D-<n>` dont il vient.

Une décision qui n'est pas d'architecture ne va dans aucun des deux :
`AGENTS.md` § « Où écrire quoi » dit où elle va.

## Une ligne du journal

| Colonne | Ce qu'elle porte |
|---|---|
| N° | le numéro qui suit le dernier du journal, `D-194` après `D-193` |
| Date | le jour où la décision est prise, `AAAA-MM-JJ` |
| Décision | la décision en phrases courtes, puis d'où elle vient |
| Chantier | le numéro du chantier, d'après le tableau en tête du journal |

- **D'où elle vient.** Une décision est celle du relecteur, sauf mention
  contraire. Une décision prise par l'agent sur délégation le dit, et dit
  qu'elle est à valider : « Décidé par l'agent, sur délégation (#219) ; à
  valider. » Sa validation s'ajoute ensuite, datée.
- **Ce qu'elle touche.** Une décision qui en précise, en étend ou en remplace une
  autre le dit : « Précise D-57. », « Remplace D-52. »
- **Une décision renversée reste dans le tableau.** Son texte est barré, suivi
  de « Remplacé par D-<n> ».
- **Le numéro ne change plus une fois cité** dans le code ou un commit. Si deux
  branches ont pris les mêmes numéros, celle qui fusionne la seconde prend les
  suivants au journal. Le document d'architecture qui les cite dit, dans un
  encart daté, la correspondance avec les numéros des commits.

## Un document d'architecture

Un document couvre un sujet, et groupe ses ADR, numérotés. Il reste au niveau
composant C4 : ce qui parle, à quoi, et pourquoi. Le détail des fichiers et des
fonctions est dans le code et le README de l'app.

```markdown
# Architecture : <sujet>

> Statut : **décidé (phase expérimentale)** · Dernière mise à jour : AAAA-MM-JJ
>
> <Ce que couvre le document, en une ou deux phrases.>

## 1. Contexte & objectifs
## 2. Décisions (ADR)
### ADR-1 - <titre de la décision>
### ADR-2 - …
## 3. Architecture cible
## 4. <le cœur du sujet>
## 5. Découpage en incréments
## 6. Risques & validations en attente
## Vérification
```

- Chaque ADR porte trois paragraphes : **Contexte.**, **Décision.**,
  **Conséquences.**
- L'architecture cible est un diagramme Mermaid et un tableau des composants.
  Les risques sont un tableau `R-1`, `R-2`… Ce qui est fait dans le découpage
  porte ✅.
- **La date de l'en-tête bouge quand une décision bouge.** Une relecture de
  forme ne la touche pas.
- Les renvois entre documents sont relatifs : `./identification.md`.
- La section « Vérification » donne des commandes à lancer, quand le document
  décrit quelque chose qu'on peut éprouver.

## On ne réécrit pas l'histoire

Quelqu'un retombera sur une ancienne décision, dans un commit, un commentaire
ou sa mémoire. Il doit trouver pourquoi elle ne vaut plus.

**Une décision révoquée reste dans le document, barrée**, et le titre de celle
qui la remplace la cite :

```markdown
### ADR-1 - Rattachement intégré en écran de rattachement (~~app dédiée~~)
```

Un encart daté, en tête du document, dit ce qui a été renversé :

```markdown
> **Mise à jour 2026-10-23, un fichier par fait (#218).** L'ADR-12 est révisé : …
```

La même chose vaut pour un risque résolu (`~~R-9~~ … Résolu (2026-07-08)`) et
pour un composant qui disparaît : la colonne « Statut » de son tableau dit
`modifié`, `déplacé` ou `supprimé`.

## Quand le document contredit le code

Le test, le code et le README de l'app l'emportent sur `docs/knowledge/adr/`
(`AGENTS.md` § « Où écrire quoi »). Un document qui contredit le code a tort :
on le corrige.
