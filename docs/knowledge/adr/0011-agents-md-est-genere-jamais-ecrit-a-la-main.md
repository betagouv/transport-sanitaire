# ADR-0011 - `AGENTS.md` est généré, jamais écrit à la main

> Statut : **décidé** · 2026-11-24 · Remplace les quatre `AGENTS.md` écrits à la main

**Contexte.** Un `AGENTS.md` écrit à la main devient une source de plus : il
recopie ce que disent déjà les README, les règles et les ADR, puis dérive. Le
porteur veut qu'aucune connaissance n'appartienne à `AGENTS.md`, et que tout
vienne d'une source tierce, indépendante de l'IA.

**Décision.** Les quatre `AGENTS.md` (racine, `simulateur-eligibilite`,
`datahub`, `cli`) sont générés par `agent-smith`, à partir d'un
`agent-smith.toml` par dossier. Ils reprennent l'introduction du README, les
outils de `mise.toml`, les sections « Commandes » des README, les noms des
fichiers d'ADR, l'index des règles, la liste des pages de `docs/knowledge/` et
les skills. On corrige la source, puis on lance `pnpm agents`. La CI régénère
les fichiers et échoue si un `AGENTS.md` diffère.

**Pourquoi cet outil.** Il construit le fichier depuis des sources que
l'équipe tient déjà, sans modèle de langage : la sortie est déterministe et se
relit comme un diff ordinaire. Sa version est épinglée dans `mise.toml`
(`pipx:agent-smith-cli`, avec `uv`), au même endroit que Node, pnpm et `gh`.
Les scripts d'extraction sont dans `tooling/agents/`.

**Écarté.**

| Option | Pourquoi non |
|---|---|
| Un `justfile` pour les commandes | une source de plus : la section « Commandes » des README est déjà la source |
| `adr-tools` pour les décisions | les ADR ont leur format et leur numérotation (`ecrire-une-decision.md`) : une liste de fichiers suffit |

**Conséquences.**

- Une consigne qui ne s'adresse qu'à une IA n'a plus de place dans le dépôt.
- Les sections ajoutées par l'outil portent un pied de page en anglais, que sa
  configuration ne change pas.
- Monter la version de l'outil se fait sur une ligne de `mise.toml`, suivie d'un
  `pnpm agents`.
