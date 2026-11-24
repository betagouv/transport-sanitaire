# AGENTS.md - simulateur-eligibilite

> Les conventions du dépôt sont dans [`../../AGENTS.md`](../../AGENTS.md). Ici,
> ce qui est propre à cette app.

## Ce que c'est

Le simulateur d'éligibilité au transport sanitaire : React 19, Vite, DSFR, et un
questionnaire **déclaré par l'application** (`core/socle/questionnaire-engine/`),
que `front/socle/questionnaire/` affiche. Un **backend Node/Express** (`server/` :
le front et `/api/*`) le sert, sur **Scalingo**. Ce n'est pas un site statique.
Le parcours commence par un rattachement obligatoire, sans identifier la personne
([`rattachement.md`](docs/knowledge/domain/rattachement.md)).

**L'app est entre deux modèles.** La v9 est retirée et la v10 s'intègre étape par
étape. Son avancement est dans son ticket Notion, ce qui est parti et ce qui reste
dans le [README](README.md) § « Entre deux modèles ». Le vocabulaire est dans
[`CONTEXT.md`](docs/knowledge/CONTEXT.md).

## Le socle et les modèles

`core/` et `front/` ont chacun un `socle/`, qui ne dépend d'aucune version du
modèle, et un `models/`, un dossier par modèle, du même nom des deux côtés
(ARCH-002). Les modèles sont `eligibilite/`, celui de l'éditeur, qui
s'ouvre au démarrage, et `fake/`, celui de démonstration.

- **Le socle ne connaît un modèle que par deux contrats** : `CoreModel`
  (`core/socle/model.types.ts`), le métier, et `Model` (`front/socle/model.ts`),
  qui le porte et ajoute les écrans. Un modèle n'importe du socle que
  `core/socle/index.ts` et `front/socle/index.ts`. Le socle n'importe rien d'un
  modèle, et aucun modèle n'importe l'autre.
- **`front/main.tsx` est le seul fichier qui importe le socle et les modèles.** Un
  modèle reste hors du chunk d'entrée : `App` ne charge le premier que pendant le
  rattachement.
- **Le socle est celui des transports sanitaires.** L'outillage stable (publicodes,
  DSFR, pdf-lib) et ce qui ne change pas avec le modèle (logos, mise en page,
  impression) y vivent. Le modèle ne porte que ce que l'éditeur livre : règles,
  déclarations, textes.
- **Le modèle de démonstration est pérenne.** Chaque capacité du socle y a sa page,
  pour la valider à l'écran sans dépendre de l'éditeur. Le socle ne sait pas qu'un
  modèle est « de démonstration ».

## Les quatre racines de runtime

| Racine | Ce que c'est |
|---|---|
| `core/` | le métier : les moteurs et la logique des modèles. Sous Node comme dans le navigateur, sans React ni DOM |
| `front/` | le navigateur, bundlé par Vite |
| `server/` | le backend, qui détient la clé Grist |
| `shared/` | le contrat front ⇄ back, chargé des deux côtés |

Le script `front/socle/analytics/cms.js` s'exécute sur les pages du CMS, pas dans
l'app : il n'importe rien et personne ne l'importe.

**L'arbre dit le chemin** (QUAL-011) : sous une racine, un dossier est un module,
une entité (un nom) ou une capacité (un verbe). Un fichier porte une
responsabilité et se nomme de ce qu'il exporte. `utils/`, `types/` et `helpers/`
n'existent pas ici.

**Un module du socle s'ouvre par son index** (ARCH-003) : hors du module, on
n'importe que lui. Ses tests lisent ses fichiers en direct. Seul un adaptateur
(`.adapter.ts`) importe un paquet, et seul un index importe un adaptateur
(ARCH-004).

## Commandes

| Commande | Ce qu'elle fait |
|---|---|
| `pnpm verifier` | lint, typecheck, knip, tests, build. La CI en passe les étapes une à une : voir « Vérifier » dans l'[AGENTS.md](../../AGENTS.md) de la racine |
| `pnpm test:navigateur` | les parcours en navigateur réel, hors du `verifier` : voir [Tests](#tests) |
| `pnpm dev` | front et backend ensemble |
| `pnpm regles` | recalcule le `regles.json` et le `regles.graphe.json` de chaque modèle d'après son `regles.publicodes`. À lancer après toute retouche des règles : un test les compare |

`pnpm build` finit par `verifier-bundle` : `pdf-lib`, `modern-screenshot`, le
modèle et le catalogue de seeds doivent rester hors du chunk d'entrée. Remplacer
un `import()` par un import statique fait échouer cette étape.

## Versions

Une livraison se marque par un tag `simulateur-eligibilite@<version>` : le monorepo
n'a pas de tag global. Les règles sont dans
[`livraisons.md`](../../docs/knowledge/contributing/livraisons.md), la marche à
suivre dans le skill `livrer-une-version`.

## Le questionnaire et la décision

Ce que le code et ses tests ne disent pas :

- **Une garde est une condition, jamais un `if` dans un composant.** Elle lit ce
  qui la précède. Ce qui se déclare (constructeurs, `appliesWhen`, `mattersWhile`,
  `dependsOn`, `inconsistentWhen`, `unlessAskedBefore`) est dans ARCH-007,
  ARCH-008 et ADR-0041.
- **Une garde lit le fait quand il en existe un** (`given.fait("fait_permission")`).
  Elle ne recompose pas, réponse par réponse, ce que le fait établit déjà.
- **Une déclaration lit une question par son objet**, et l'importe. Une condition
  qui lit une question vit après elle : dans son fichier, ou dans un `conditions/`
  que la question n'importe pas. Sinon les deux modules s'importent l'un l'autre
  et le chargement casse.
- **Mieux vaut une condition écrite deux fois qu'une abstraction entre les pages
  et les faits.** Une donnée de l'éditeur se partage là où elle se déclare (les
  réponses possibles, dans leur question). Une règle que plusieurs faits reprennent
  mot pour mot se nomme dans `faits/communs.ts`.
- **Un fait absent n'est jamais « non »**, une cible inconnue non plus. On lit
  `isOui()`, `isNon()`, `isInconnu()`, jamais `.value === true`.
- **Le socle dit ce qui a été montré, validé, coché. Il ne conclut rien** : le
  modèle reçoit les réponses par `GivenAnswers` et `ValidatedAnswers`, jamais
  brutes, et applique le contrat de l'éditeur fait par fait.
- **R2 et R3 lisent des valeurs**, pas les réponses (ARCH-008).
- **Le verrou est une étape, pas un drapeau** (ADR-0038). Une saisie ne compte
  qu'une fois la page validée.

## Le PDF

- **Un formulaire rempli porte des données de santé nominatives.** Il se génère
  dans le navigateur uniquement, et `front/socle/cerfa/` n'adresse jamais `/api`.
- **Un texte n'est jamais coupé en silence.** Il rapetisse jusqu'à tenir, sauf le
  texte strict (voir `CONTEXT.md`), que la génération signale et que
  l'écran fait réécrire.
- **La feuille en PDF est une image** du navigateur : son texte ne se sélectionne
  pas. `modern-screenshot` fige la hauteur de chaque élément qu'il copie : une
  marge basse qui traversait son parent y resterait, et la photo ne tomberait plus
  sur les coupes. `photograph-a-page.ts` rend leur hauteur libre à ces parents.
  Le navigateur de test ne met pas en page : la photo et ses coupes se vérifient
  dans Chrome.

## Les invariants

Ils sont **exécutables**. Les frontières entre `core/`, `front/`, `server/` et
`shared/` sont dans
[`tests/frontieres-des-racines.test.ts`](tests/frontieres-des-racines.test.ts), le
reste dans [`tests/architecture.test.ts`](tests/architecture.test.ts) : le socle
et les modèles, publicodes et `modern-screenshot` qui n'ont qu'un importeur, le
socle PDF, les règles qui ne portent que de l'éligibilité, les seeds et les
developer tools greffés sur le simulateur. La clean architecture est dans
[`tests/clean-architecture.test.ts`](tests/clean-architecture.test.ts), les
modules du socle dans
[`tests/modules-du-socle.test.ts`](tests/modules-du-socle.test.ts), les limites de
30 et 300 lignes dans [`tests/taille-du-code.test.ts`](tests/taille-du-code.test.ts).

Les règles `ARCH-*` qu'ils gardent sont dans
[`regles-d-architecture.md`](docs/knowledge/contributing/regles-d-architecture.md).

**Ne les recopie pas ici.** Lis le fichier. Lis surtout le message d'échec avant
de contourner une règle : il dit ce qu'elle protège.

## Pièges

**Extensions d'import.** Il en faut une (`.ts`) partout où Node peut atteindre le
fichier, et nulle part ailleurs dans `front/`. Node ne résout pas les extensions,
Vite si. `tests/lisibilite.test.ts` calcule ce qui est accessible.

| Emplacement | Extension |
|---|---|
| `core/`, `server/`, `shared/`, `tooling/` | `.ts` |
| ce qu'un script tire dans `front/` | `.ts` |
| le reste de `front/` | aucune |

**Les maquettes de l'éditeur font foi pour l'aspect et le comportement**, pas
seulement pour les textes. On en tire des composants génériques du socle, on ne
recopie pas leur HTML ni leur CSS. Une revue compare chaque page à sa maquette,
à l'écran.

**DSFR pour toute l'interface.** Emprunte la forme des props au composant appelé
(`ComponentProps<typeof Checkbox>`) plutôt que de la recopier : une recopie dérive
d'une version à l'autre.

## Tests

**Sans mock.**

- Les tests d'interface passent Testing Library sur le vrai `<App />`.
- Les tests serveur font de vraies requêtes HTTP sur une app Express montée sur
  un référentiel injecté.
- Les tests du socle PDF remplissent un vrai PDF, fabriqué par `pdf-lib`.

`tests/socle/` éprouve le socle sur un modèle qu'on lui injecte : le factice, dans
`tests/socle/fixtures/modele-factice/`. Il est petit et figé, pour que ces tests ne
changent pas quand le modèle de démonstration gagne une page. `tests/model/`
vérifie chaque modèle : `conformite.test.ts` contrôle ce que le socle suppose de
n'importe quel modèle et rejoue ses seeds, `tests/model/eligibilite/` rejoue
l'oracle de l'éditeur, en faits, contre le moteur.

**Quelques parcours tournent dans un vrai navigateur**, dans `navigateur/` :
Chromium et WebKit, le simulateur construit en iframe dans une page d'une autre
origine qui charge le script du CMS. Ils vérifient ce que happy-dom ne peut pas
dire : l'iframe, les messages avec la page, le PDF, l'accessibilité vue par axe.
Ils restent peu nombreux : la logique s'éprouve dans `tests/`. Après
`pnpm exec playwright install chromium webkit` la première fois, `pnpm
test:navigateur` les lance. La CI les passe dans son job `navigateur`.

**Une capacité ajoutée au socle arrive avec trois choses** : ses tests, sur des
pages écrites dans le test (`tests/socle/questionnaire/afficher.tsx`), sa page
dans le modèle de démonstration, et une seed qui ouvre cette page.

**Une situation de référence va dans le `seeds-catalogue.ts` de son modèle, pas
dans un fichier de test.** C'est un catalogue unique de situations nommées, *avec
leurs cibles attendues*. Les réponses d'une seed se donnent par identifiant de
question (`"Q1.2"`). Complètes, elles ouvrent un résultat et `expected` annonce les
seules cibles qui la caractérisent. Incomplètes, elles s'arrêtent sur la première
question sans réponse et n'annoncent rien. Sur un écart, ne corrige pas l'attendu
pour qu'il passe : lis la règle et le contrat
([`livrable-de-l-editeur.md`](docs/knowledge/domain/livrable-de-l-editeur.md)).

## Les developer tools

L'écran des seeds et les **traces de debug** s'ouvrent **en local seulement**,
sous le serveur de dev et sous les tests, quel que soit le service. Jamais sur un
build de production, donc jamais en staging ni en production. La garde lit
`import.meta.env.DEV` à un seul endroit, `developerToolsUnlocked`
(`front/socle/developer-tools/unlock.ts`).

**Une exception : la trace de debug pour « Assurance Maladie »** s'ouvre sur tous
les environnements, choisie au rattachement. Les seeds et le choix du modèle
restent fermés.
