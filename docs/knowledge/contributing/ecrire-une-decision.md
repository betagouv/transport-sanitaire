# Écrire une décision

> Où une décision s'écrit, et sous quelle forme : une ligne du journal, ou un
> ADR dans son fichier. La marche à suivre est dans le skill
> `ecrire-une-decision`.

## Le journal ou le document

| Ce qu'on écrit | Où | Sa forme |
|---|---|---|
| une décision prise pendant un chantier | le journal du chantier, dans `docs/knowledge/adr/` de l'app (`journal-des-decisions-v10.md`) | une ligne `D-<n>` |
| une décision d'architecture qui tient | un fichier par décision, dans `docs/knowledge/adr/` de l'app, ou de la racine si elle traverse plusieurs apps | un `ADR-<nnnn>` |

Le journal sert de brouillon aux ADR : un ADR s'en tire quand plusieurs
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
  suivants au journal. L'ADR qui les cite dit, dans un encart daté, la
  correspondance avec les numéros des commits.

## Un ADR

Un fichier porte une décision, et une seule. Il n'y a pas de recueil.

| Ce qu'on fixe | Sa forme | Exemple |
|---|---|---|
| le nom du fichier | `<nnnn>-<phrase-qui-dit-la-décision>.md`, en minuscules, sans accent | `0052-le-domaine-n-importe-pas-un-adaptateur.md` |
| le numéro | celui qui suit le dernier du dossier, sur quatre chiffres. Chaque dossier `adr/` a sa propre suite | `0053` après `0052` |
| le titre | `# ADR-<nnnn> - <la décision>` | `# ADR-0052 - Le domaine n'importe pas un adaptateur` |
| l'en-tête | le statut et le jour de la décision | `> Statut : **décidé** · 2026-11-16` |
| un renvoi, dans le code ou un autre document | `ADR-<nnnn>`, sans chemin | « (ADR-0052) » |

```markdown
# ADR-0052 - Le domaine n'importe pas un adaptateur

> Statut : **décidé** · 2026-11-16

**Contexte.** …

**Décision.** …

**Conséquences.** …
```

- Le nom du fichier dit la décision, pas son sujet : « le-domaine-n-importe-pas-un-adaptateur »,
  pas « sens-des-dependances ».
- Les trois paragraphes suffisent. Un risque encore ouvert s'ajoute en tableau
  `R-1`, `R-2`… sous l'ADR qu'il concerne.
- Le numéro ne change plus une fois cité. Un ADR né d'un ancien recueil garde la
  trace de son ancien numéro dans son en-tête : « Anciennement ADR-7 de
  `analytics.md` ».
- Un renvoi vers un autre fichier est relatif :
  `./0043-le-journal-passe-par-un-port-grist-en-premier.md`.

### Ce qui n'entre pas dans un ADR

Un ADR dit un choix technique et sa raison. Le reste a sa place ailleurs :

| Ce qu'on a à écrire | Où |
|---|---|
| ce que la décision change pour le métier : ce qui est suivi, ce qui est interdit, ce que voit le prescripteur | `docs/knowledge/domain/` |
| le détail de l'implémentation : fichiers, fonctions, formats | le code, que ses tests documentent |
| le découpage et l'avancement d'un chantier | ses issues |
| une commande à lancer pour vérifier | un test |

## On ne réécrit pas l'histoire

Quelqu'un retombera sur une ancienne décision, dans un commit, un commentaire
ou sa mémoire. Il doit trouver pourquoi elle ne vaut plus.

**Un ADR révoqué garde son fichier et son numéro.** Son statut passe à
`**révoqué**`, avec le jour et l'ADR qui le remplace :

```markdown
> Statut : **révoqué** · 2026-10-27 · Remplacé par l'ADR-0033
```

**Un ADR révisé garde son texte**, et reçoit un encart daté sous son en-tête,
qui dit ce qui a changé :

```markdown
> **Mise à jour 2026-10-23, un fichier par fait (#218).** La décision est révisée : …
```

Un risque résolu se retire de son tableau : l'historique de Git le garde.

## Quand un ADR contredit le code

Le test, le code et le README de l'app l'emportent sur `docs/knowledge/adr/`
(`AGENTS.md` § « Où écrire quoi »). Un ADR qui contredit le code a tort :
on le corrige.
