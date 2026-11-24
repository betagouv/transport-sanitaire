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
Un script du `package.json` d'une app, qu'on lance par
`pnpm --filter <app> <script>`. Une app ne les porte pas tous.
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
Un travail cadré, tenu dans un ticket Notion. Le ticket porte son cadrage et une
liste à cocher, une ligne par PR.
_Avoid_: spec, epic, issue. La spec était un fichier de `docs/specs/`, retiré le
2026-10-13. Les issues GitHub ont quitté le suivi le 2026-11-24.

**Tâche**:
Une ligne de la liste à cocher d'un chantier : un morceau livrable, à la taille
d'une PR.
_Avoid_: ticket.

**Ticket**:
Une ligne de la base Notion `[BDD] Tasks`, lue par l'équipe produit. Un chantier
en a un, tenu à la main.
_Avoid_: tâche, carte.
