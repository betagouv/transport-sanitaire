# Écrire une décision

> Où une décision s'écrit, quand elle mérite un ADR, et sous quelle forme. La
> marche à suivre est dans le skill `ecrire-une-decision`.

## Où une décision s'écrit

| La décision | Où |
|---|---|
| courante, prise en cours de chantier | le corps du message du commit qui la porte (il dit le pourquoi), et le ticket Notion du chantier. Nulle part ailleurs |
| coûteuse à défaire **et** qui surprend (voir ci-dessous) | un ADR, un fichier par décision, dans `docs/knowledge/adr/` de l'app, ou de la racine si elle traverse plusieurs apps |

## Quand écrire un ADR

Un ADR ne s'écrit que si la décision remplit **deux conditions à la fois** :

1. elle est **coûteuse à défaire** ;
2. elle **surprend** qui n'a pas son contexte.

| Décision | ADR ? | Pourquoi |
|---|---|---|
| « La CLI n'a pas de tests » | oui | chère à défaire, et on la prendrait pour un oubli |
| le nom d'un dossier | non | facile à changer |
| un choix qu'un lecteur du code retrouve seul | non | le code le dit déjà |

En cas de doute, le message du commit suffit.

## Le journal des décisions de la v10 est clos

Le journal [`journal-des-decisions-v10.md`](../../../apps/simulateur-eligibilite/docs/knowledge/adr/journal-des-decisions-v10.md)
est clos depuis le 2026-11-24. Il reste dans le dépôt, en lecture.

- On n'y ajoute aucune ligne, et on ne numérote plus de décision `D-<n>`.
- Un nouvel ADR ne cite pas de `D-<n>`.
- Dans le code, on n'écrit plus de renvoi `D-<n>` : un commentaire dit la
  raison en clair, ou n'existe pas. Les renvois qui restent seront remplacés au
  fil des passages dans les fichiers.

## Un ADR

Un fichier porte une décision, et une seule. Il n'y a pas de recueil.

- **Le fichier** : `<nnnn>-<phrase-qui-dit-la-décision>.md`, en minuscules, sans
  accent. Le numéro suit le dernier du dossier, sur quatre chiffres ; chaque
  dossier `adr/` a sa propre suite.
- **Le renvoi**, dans le code ou un autre document : `ADR-<nnnn>`, sans chemin.

```markdown
# ADR-0052 - Le domaine n'importe pas un adaptateur

> Statut : **décidé** · 2026-11-16

**Contexte.** …

**Décision.** …

**Conséquences.** …
```

- Le nom du fichier dit la décision, pas son sujet.
- Les trois paragraphes suffisent. Un risque encore ouvert s'ajoute en tableau
  `R-1`, `R-2`… sous l'ADR qu'il concerne.
- Le numéro ne change plus une fois cité.
- Un renvoi vers un autre fichier est relatif :
  `./0043-le-journal-passe-par-un-port-grist-en-premier.md`.

### Ce qui n'entre pas dans un ADR

Un ADR dit un choix technique et sa raison. Ce que la décision change pour le
métier va dans `docs/knowledge/domain/`, le détail de l'implémentation dans le
code et ses tests.

## On ne réécrit pas l'histoire

Qui retombe sur une ancienne décision doit trouver pourquoi elle ne vaut plus.

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
