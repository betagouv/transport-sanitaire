# ADR-0039 - Un module du socle s'ouvre par son index

> Statut : **décidé** · 2026-11-04 · Anciennement ADR-28 de `metier-et-ecran.md`

**Contexte.** L'ADR-0036 fait d'un dossier un module, mais rien ne disait ce
qu'un module promet. Hors de lui, on importait chacun de ses fichiers par son
chemin : `question/question.ts` depuis soixante fichiers, `unlock.ts` depuis
l'app, `compute-the-dto.ts` depuis les tests du modèle. Ce qu'un module garde
pour lui et ce qu'il expose ne se distinguaient pas, une fuite ne se voyait
pas, et un fichier ne pouvait plus bouger sans toucher tous ses importeurs. Le
modèle, lui, avait ses deux points d'entrée (ADR-0012), et cette frontière
tenait.

**Décision.** Un module du socle est un dossier direct de `core/socle/` ou de
`front/socle/`. Son `index.ts` dit ce qu'il promet au reste du socle, et rien
d'autre. Hors du module, on n'importe que lui ; ce qui manque s'y ajoute. Ses
tests, `tests/socle/<module>/`, lisent ses fichiers en direct : ils éprouvent
l'intérieur. Une seule porte à part, avec son pourquoi dans le test :
`decision-engine/compute-the-cibles.ts`, qui importe publicodes et doit rester
hors du chunk d'entrée (D-76). Les deux points d'entrée du socle passent
eux-mêmes par les index (D-263).

| Option | Pour | Contre |
|---|---|---|
| laisser les imports profonds, documenter chaque module | rien à déplacer | la frontière n'existe que dans la doc ; une fuite ne se voit pas |
| un index par module, règle gardée par un test | la frontière se lit en un fichier ; une fuite rougit | des index à tenir ; deux index qui s'importent l'un l'autre se chargent dans un ordre à surveiller |
| un index par dossier, à tous les niveaux | tout est contrat | trop de portes pour des dossiers de deux fichiers ; l'index répète l'arbre |

La deuxième, choisie par Simon.

**Conséquences.** Douze index, un par module. Le périmètre d'une condition,
`Reading`, devient `Scope`, parce que deux `Reading` sortaient du même module.
`Container.tsx` passe dans `ui/` et `deployed-version.ts` à la racine du
socle : l'app compose les autres modules, et aucun ne doit la lire. Le test du
CERFA admet l'index du moteur de questionnaire à la place de
`conditions/condition.ts`. `tests/modules-du-socle.test.ts` garde la règle,
dans son fichier parce qu'`architecture.test.ts` est à sa limite de taille. Le
chunk d'entrée ne bouge pas. Un import profond rougit au premier test, qui dit
d'ajouter ce qui manque à l'index.

## Risques

| Id | Risque | Mesure |
|---|---|---|
| R-14 | Les index des deux moteurs de `core/socle/` s'importent l'un l'autre : une valeur lue au chargement d'un module vaudrait `undefined` | le test sous Node et les tests du socle chargent les deux ; aucune valeur n'est lue au chargement aujourd'hui, et l'erreur nommerait le symbole |

## Mises à jour

> **Mise à jour 2026-11-04, l'index de chaque module (#336).** L'ADR-0039 donne à
> chaque module du socle son `index.ts`, le seul fichier qu'on en importe de
> l'extérieur. L'ADR-0036 est précisé : un module a un contrat, pas seulement un
> nom. Décision de Simon, au journal D-263.
