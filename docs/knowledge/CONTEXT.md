# Le dépôt : vocabulaire

Glossaire des termes qui valent pour tout le dépôt : ses apps, son outillage et
le suivi du travail. Le vocabulaire métier d'une app est dans son propre
`docs/knowledge/CONTEXT.md`.

## Language

### Les apps

**App**:
Un dossier de `apps/`, indépendant de code des autres, avec son `package.json`
et son `verifier`.
_Avoid_: module, paquet, projet.

**Action**:
Ce qu'on peut lancer sur une app : `install`, `build`, `start`, `test`, `dev`,
`verifier`. Une app ne les porte pas toutes.
_Avoid_: commande, qui désigne ce qu'on tape, action et arguments compris.

**Feature**:
Ce qu'une app sait faire, vu par celui qui s'en sert.
_Avoid_: capacité, fonctionnalité. « Capacité » est réservé au métier du
simulateur, où il désigne ce que peut le patient.

### Les règles

**Recueil**:
Un fichier de règles numérotées de `docs/knowledge/contributing/`, sous un même
préfixe. Il y en a deux : `code` (`QUAL-*`) et `git` (`GIT-*`).
_Avoid_: module.

### Le suivi du travail

**Chantier**:
Un travail cadré, tenu dans une issue GitHub sans parente. Le corps de l'issue
porte son cadrage, ses sous-issues portent son découpage.
_Avoid_: spec, epic. La spec était un fichier de `docs/specs/`, retiré le
2026-10-13.

**Tâche**:
Un morceau livrable d'un chantier, à la taille d'une PR : une sous-issue. Une
tâche peut avoir ses propres tâches.
_Avoid_: ticket.

**État**:
Où en est un chantier ou une tâche : à faire, bloquée, en cours, fait,
abandonnée. Il ne s'écrit pas, il se déduit de l'issue, de sa branche et de sa
PR.
_Avoid_: statut, réservé au ticket Notion.

**Brouillon**:
Un chantier dont le cadrage n'est pas fini, étiqueté `brouillon`. Il n'est ni à
prendre, ni montré à l'équipe produit.

**Ticket**:
Une ligne de la base Notion `[BDD] Tasks`, lue par l'équipe produit. Un chantier
en a au plus un, une tâche n'en a jamais.
_Avoid_: tâche, carte.
