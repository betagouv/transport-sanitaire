# Écrire une décision

> Où une décision s'écrit, quand elle mérite un ADR, et sous quelle forme.

## Où une décision s'écrit

| La décision | Où |
|---|---|
| courante, prise en cours de chantier | le corps du message du commit qui la porte (il dit le pourquoi), et le ticket Notion du chantier. Nulle part ailleurs |
| coûteuse à défaire **et** qui surprend | un ADR, un fichier par décision, dans `docs/knowledge/adr/` de l'app, ou de la racine si elle traverse plusieurs apps |

## Quand écrire un ADR

Un ADR ne s'écrit que si la décision remplit **deux conditions à la fois** :

1. elle est **coûteuse à défaire** ;
2. elle **surprend** qui n'a pas son contexte.

| Décision | ADR ? | Pourquoi |
|---|---|---|
| « La CLI n'a pas de tests » | oui | chère à défaire, et on la prendrait pour un oubli |
| le nom d'un dossier | non | facile à changer |
| un choix qu'un lecteur du code retrouve seul | non | le code le dit déjà |

En cas de doute, le message du commit suffit. Un ADR dit un choix et sa raison. Ce
que la décision change pour le métier va dans `docs/knowledge/domain/`, le détail
de l'implémentation dans le code et ses tests.

## Un ADR

Avant d'écrire, lis les titres du dossier `adr/` : une décision en précise ou en
renverse souvent une autre.

- **Le fichier** : `<nnnn>-<phrase-qui-dit-la-décision>.md`, en minuscules, sans
  accent. Le nom dit la décision, pas son sujet. Le numéro suit le dernier du
  dossier, sur quatre chiffres ; chaque dossier `adr/` a sa propre suite. Il ne
  change plus une fois cité.
- **Le renvoi**, dans le code, un commit ou un autre document : `ADR-<nnnn>`, sans
  chemin. Entre fichiers, le lien est relatif.

```markdown
# ADR-0053 - Chaque événement porte l'établissement et le service

> Statut : **décidé** · 2026-11-16

**Contexte.** …

**Décision.** …

**Conséquences.** …
```

Trois paragraphes suffisent. Un risque encore ouvert s'ajoute en tableau `R-1`,
`R-2`… sous l'ADR qu'il concerne ; une fois résolu, il se retire, et l'historique
de Git le garde.

## On ne réécrit pas l'histoire

Qui retombe sur une ancienne décision doit trouver pourquoi elle ne vaut plus.

**Un ADR révoqué garde son fichier et son numéro.** Son statut dit le jour et
l'ADR qui le remplace :

```markdown
> Statut : **révoqué** · 2026-10-27 · Remplacé par l'ADR-0054
```

**Un ADR révisé garde son texte**, et reçoit un encart daté sous son en-tête :

```markdown
> **Mise à jour 2026-10-23, un fichier par fait.** La décision est révisée : …
```

Un ADR qui contredit le code a tort : on le corrige
([`travailler-dans-le-depot.md`](travailler-dans-le-depot.md#quand-deux-sources-se-contredisent)).
