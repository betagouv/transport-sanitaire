# ADR-0008 - Le tableau des chantiers est une projection

> Statut : **révoqué** · 2026-11-24 · Remplacé par l'ADR-0009 · décidé le 2026-10-14 · Anciennement ADR-7 de `cli.md`

> **Mise à jour 2026-11-24, le suivi passe dans Notion.** La décision est révoquée. Un chantier est un ticket Notion tenu à la main, sans issue GitHub ni tableau. L'ADR-0009 dit pourquoi.

**Contexte.** L'état se lisait dans `tsp issue list` et `tsp issue show`, dans
un terminal, chantier par chantier. Rien ne montrait d'un coup d'œil ce qui
est en cours et ce qui ne l'est pas, et qui n'avait pas cloné le dépôt ne
voyait rien.

**Décision.** Un GitHub Project de l'organisation, privé et lié au dépôt, montre
les issues en kanban. Ses colonnes sont les états de l'ADR-0007, plus `Brouillon`.

- **`tsp` est seul à écrire une colonne**, d'après l'état qu'il déduit. Le
  tableau ne fait jamais foi. Une carte déplacée à la main reprend sa place à
  la projection suivante.
- La projection passe sur toutes les issues : une issue ouverte absente est
  ajoutée, une abandonnée est archivée, une fermée hors du tableau n'y revient
  pas.
- `issue sync` la lance, puis tient Notion. `issue new`, `issue add`, `branch`
  et l'ouverture d'une PR la lancent après leur geste.
- Deux workflows du Project complètent : une issue fermée passe en `Fait`, une
  carte faite depuis deux semaines est archivée. Celui qui ajoute les
  sous-issues d'une carte est gardé. Ceux qui fermeraient une issue depuis le
  tableau sont coupés.

**Écarté.**

| Option | Pourquoi non |
|---|---|
| Un tableau qui fait foi, où l'on déplace les cartes | l'état redeviendrait rédigé, et se périmerait comme avant l'ADR-0007 |
| Une projection par la CI | le jeton d'une GitHub Action ne peut pas écrire dans un Project d'organisation |
| Une branche qui sert plusieurs issues | une branche sert l'issue de son nom, et une PR sur plusieurs issues est un héritage, pas un cas à outiller |

**Conséquences.**

- Le tableau ne bouge qu'avec un geste `tsp`. Une issue débloquée par la
  fusion d'une autre attend la projection suivante.
- La projection part de la machine du développeur : une branche locale, non
  poussée, compte.
- Le jeton `gh` doit avoir le droit `project`. Sans lui, `issue sync` le dit et
  passe à Notion, et les autres commandes réussissent quand même.
- Une projection coûte deux appels à `gh` par carte qui bouge. La reprise de 26
  issues a pris une minute et demie.

## Risques

| Id | Risque | État |
|---|---|---|
| R-9 | Le tableau ne suit que les gestes `tsp`. Une fusion fait passer son issue en `Fait`, mais pas le chantier parent ni les issues qu'elle débloque | Assumé (ADR-0008) |
| R-10 | Le numéro du Project est écrit dans le code. Recréer le tableau demande de le changer | Assumé |

## Mises à jour

> **Mise à jour 2026-10-14, tableau des chantiers.** Le refus d'un GitHub
> Project, dans l'ADR-0007, est révoqué. Les chantiers ont un kanban, projeté par
> `tsp` depuis l'état qu'il déduit. L'ADR-0008 dit pourquoi l'état ne s'y écrit
> pas pour autant.
