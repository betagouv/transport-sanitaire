# ADR-0036 - L'arbre des fichiers dit le chemin

> Statut : **décidé** · 2026-11-04 · Anciennement ADR-25 de `metier-et-ecran.md`

**Contexte.** Les frontières tenaient (ADR-0012 à ADR-0035), mais l'arbre ne les
montrait pas : `declarations/` mêlait les trois étapes du modèle, une partie
tenait dans un fichier de 300 lignes, `reading-in-order.ts` ou `relevance.ts`
ne disaient pas ce qu'ils font, le parcours n'avait pas d'entité et R2 était
sept fichiers plats. Les tests, à plat, ne disaient pas ce qu'ils éprouvent
(#124, #240, #292).

**Décision.** Un dossier est un module, une entité ou une capacité ; un fichier
porte une responsabilité et se nomme de ce qu'il exporte (D-257). Le modèle se
lit dans l'ordre du chemin, `questions/`, `faits/`, `cibles/`, `rules/`, et
chaque partie a la même forme : sa table des matières, un fichier par
question, ses conditions partagées (D-258). Le socle a ses entités,
`Simulation` pour le parcours ; l'écran du modèle a les siennes, `R2` et `R3`,
écrites dans l'ordre du calcul, R2 avec un dossier par cas (D-259). Les tests
se rangent comme les sources (D-260).

| Option | Pour | Contre |
|---|---|---|
| garder l'arbre, documenter le chemin | rien à déplacer | la doc vieillit ; le code ne montre pas le chemin |
| ranger par sorte de fichier (`types/`, `utils/`, `components/`) | familier | une capacité s'éparpille sur trois dossiers |
| module, puis entité ou capacité, puis un fichier par responsabilité | le nom du dossier dit ce qu'il fait ; un fichier se trouve sans chercher | des chemins d'import plus longs |

La troisième, choisie par Simon ; elle s'énonce dans `AGENTS.md`, et trois
tests la gardent : les frontières (`architecture.test.ts`), les domaines du
modèle (`domaines.test.ts`) et le miroir des tests
(`miroir-des-sources.test.ts`).

**Conséquences.** Aucun comportement ne change : une PR de neuf commits, un par
sujet, déplace et renomme. Les entités remplacent des fonctions libres :
`Simulation.of(core, réponses)` remplace `readOf`, `traceOf` et `lock` ;
`R2.of(lecture).page()` remplace quatre fonctions. `r2.ts` est `r2.tsx`, parce
qu'il porte des constantes JSX. Les chemins d'import s'allongent d'un ou deux
niveaux. Un nouveau dossier de tests sans dossier de sources du même nom fait
rougir le miroir.

## Risques

| Id | Risque | Mesure |
|---|---|---|
| R-12 | Une question et une condition de `conditions/` s'importent l'une l'autre : la question lue vaut `undefined` au chargement | le test sous Node et chaque test du modèle chargent le module ; l'erreur lit `id` sur `undefined` |

## Mises à jour

> **Mise à jour 2026-11-03, l'agrégat du parcours (#336).** L'ADR-0038 fait de
> `Simulation` l'agrégat du parcours : l'étape, le verrou, la page ouverte et
> les transitions y vivent ; l'écran ne garde que le brouillon. L'ADR-0036 est
> précisé : `Simulation.of` devient `start` et `resume`. Décision de Simon, au
> journal D-262.

> **Mise à jour 2026-11-04, l'index de chaque module (#336).** L'ADR-0039 donne à
> chaque module du socle son `index.ts`, le seul fichier qu'on en importe de
> l'extérieur. L'ADR-0036 est précisé : un module a un contrat, pas seulement un
> nom. Décision de Simon, au journal D-263.
