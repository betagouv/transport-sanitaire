# AGENTS.md - simulateur-eligibilite

> Les conventions du dépôt sont dans [`../../AGENTS.md`](../../AGENTS.md). Ici,
> ce qui est propre à cette app.

## Ce que c'est

Le simulateur d'éligibilité au transport sanitaire. Sa pile :

- React 19 + Vite + DSFR (`@codegouvfr/react-dsfr`) ;
- un questionnaire **déclaré par l'application** (`front/socle/questionnaire-engine/`).

**L'app est entre deux modèles.** Le modèle v9 et ce qui en dépendait sont retirés,
la v10 n'est pas intégrée : son avancement est dans l'issue 50 du dépôt, ses
décisions dans `docs/knowledge/adr/journal-des-decisions-v10.md`. Il n'y a ni règles
d'éligibilité, ni page de résultat métier, ni CERFA téléchargeable. Le simulateur
déroule le **modèle de démonstration** (`front/models/fake/`), qui ne décide rien
du transport. Le noyau et les
deux premières parties de la v10.0.0 attendent sur la branche
`v10-modele-10.0.0`, le temps que l'éditeur livre la v10.0.2. Le
[README](README.md) § « Entre deux modèles » dit ce qui est parti et ce qui reste.

Le front a deux dossiers. `front/socle/` porte ce qui ne dépend d'aucune version
du modèle : rattachement, parcours, moteur de questionnaire, analytics, seeds,
outils PDF, developer tools. `front/models/` porte un dossier par modèle :
`fake/`, le modèle de démonstration, et `eligibilite/`, celui de l'éditeur, qui
arrive avec la v10.0.2.

Le modèle de démonstration est pérenne (D-82). **Chaque capacité du socle y a
sa page**, pour la valider à l'écran sans dépendre du modèle de l'éditeur.

**Le socle ne sait pas qu'un modèle est « de démonstration »** (D-83). `main.tsx`
passe à `App` une seule liste, `models`, où chaque modèle porte son nom et de
quoi se charger. Le premier s'ouvre au démarrage. À plusieurs, les developer
tools proposent d'en changer (`front/socle/app/model-choice.ts`) : le choix est
donc réservé au service n° 4, comme eux.

Le socle ne connaît le modèle que par un contrat, `Model` (`front/socle/model.ts`) :
des parties de questionnaire, ce qui calcule la préconisation (des réponses aux
faits, des faits aux cibles), et deux résultats. `front/main.tsx` est le seul
fichier qui importe les deux. Il dit à `App` comment charger chaque modèle, et
`App` charge le premier pendant l'écran de rattachement : un modèle reste hors
du chunk d'entrée. Le socle n'importe rien
de `front/models/`, un modèle n'importe du socle que `front/socle/index.ts`, et
aucun modèle n'importe l'autre.
Une exception : le moteur de décision, `front/socle/decision-engine/publicodes.ts`,
qu'un modèle prend à la source. C'est le seul fichier qui importe publicodes
(D-76).
`tests/architecture.test.ts` garde ces règles.

Le parcours commence par un **écran de rattachement
obligatoire** : établissement et service, sans identifier la personne
(`front/socle/rattachement/`, référentiel Grist). Le tout est servi par
un **backend Node/Express** (`server/` : le front et `/api/*`) déployé sur
**Scalingo**. Ce n'est pas un site statique.

## Le questionnaire

Huit fichiers portent la mécanique, dans `front/socle/questionnaire-engine/` :

| Fichier | Ce qu'il porte |
|---|---|
| `question.ts` | ce qu'est une question, une page, une partie, une réponse |
| `option.ts` | ce qu'est une option d'un choix : son libellé, ce qui la propose, son aide, ce qu'elle bloque |
| `address.ts` | ce qu'est une adresse, la seule réponse en objet : ses champs, ceux qui se demandent en France ou à l'étranger, et le message de chaque champ fautif |
| `asked-questions.ts` | ce qui s'affiche, vu les réponses : libellés, bornes, options, mode d'adresse et incohérences du moment. Et les questions validées, avec ce qui s'y proposait |
| `offered-answer.ts` | ce qu'une réponse vaut pour sa question : réduite aux options qui se proposent ou aux champs d'adresse qui se demandent, suffisante ou non |
| `answer-error.ts` | ce qui ne va pas dans une saisie, et les messages à afficher : une erreur de format seule, sinon une ligne par incohérence. Une adresse a les siens, un par champ, dans `address.ts` |
| `questionnaire.ts` | l'état d'un parcours : page ouverte, brouillon, navigation |
| `page-commit.ts` | ce que deviennent les réponses quand une page est validée, et ce que ça efface |

Six règles à tenir en ajoutant une question :

- **Une condition d'affichage s'écrit dans `askedIf`.** Jamais dans un composant.
- **Une condition lit ce qui la précède.** Elle reçoit les réponses, les cibles
  figées, et les questions validées avant la sienne (`validated`). Sur la page
  ouverte, celles qui la précèdent comptent telles qu'elles sont à l'écran.
- **Une dépendance se déclare dans `dependsOn`.** Sans elle, la réponse survit au
  changement de celle dont elle dépend. Une adresse dont le mode change
  (`abroadIf`) survit de même : elle se relit dans le nouveau mode, sans son
  pays si elle revient en France.
- **Une incohérence se déclare dans `inconsistenciesFrom`, sur la plus tardive des
  deux questions.** Le moteur lui cache les réponses des pages suivantes : une
  règle écrite sur la première ne se déclenche jamais. Elle lit sa propre page, brouillon
  compris, et les réponses d'avant le verrou. Elle rend un message par
  incohérence, qui dit quelle question corriger. Une question incohérente n'est
  pas validée. On corrige par « Précédent » : aucun bouton, aucun saut. Une
  erreur de format s'affiche seule, avant les incohérences. Celle d'une adresse
  s'affiche sous le groupe, et une erreur de champ passe devant.
- **Une saisie ne compte qu'une fois la page validée.** Le brouillon vit dans
  `questionnaire.ts`, pas dans le champ.
- **Le verrou est un montage, pas un drapeau.** Ce qui vient après le verrou est un
  second `QuestionnaireForm`, qui reçoit `lockedAnswers` et ne repose rien
  (`front/socle/simulateur/Simulateur.tsx`).

*Gardé par* `tests/socle/simulateur/`.

## La décision

Un fait a trois états : vrai, faux, ou absent. Absent, il ne vaut jamais « non ».

| Pièce | Ce qu'elle porte |
|---|---|
| `Validated` (`question.ts`) | les questions validées : pour chacune, les options qui se proposaient, et la réponse s'il y en a une. Une question absente n'a pas été demandée |
| `preconisation.faits(answers, validated)` | le modèle y lit ce qui se proposait. Une case proposée et non cochée peut valoir « non ». Une case jamais montrée laisse le fait absent |
| `Fait` (`decision-engine/publicodes.ts`) | ce qu'on sait d'un fait : sa valeur si elle est établie, et sa provenance |
| `publicodesEngine` | n'envoie aux règles que les faits établis. Une cible peut revenir `undefined` : indéfinie, ce qui n'est pas une décision, ni `null` (sans objet) |

Le socle dit ce qui a été montré, validé, coché. Il ne conclut rien : c'est le
modèle qui applique, fait par fait, le contrat de l'éditeur.

*Gardé par* `tests/socle/decision-engine/`, `tests/socle/preconisation.test.ts` et
`tests/socle/questionnaire-engine/questions-validees.test.tsx`.

## Le socle PDF

`front/socle/cerfa/` remplit un cerfa et le télécharge. Il ne porte aucun
formulaire, et **ne sait rien du simulateur** : il reçoit des données, d'où
qu'elles viennent, et un mapping qui les lit (`CerfaForm<Input>`). Le simulateur
le branche sous le second résultat, avec les réponses, les cibles et la date de
complétion. Une autre source pourrait le brancher de même. Il n'importe rien du
reste du socle.

| Fichier | Ce qu'il porte |
|---|---|
| `fill-cerfa.ts` | l'écriture dans un AcroForm : textes, cases et leurs états d'export, refus de tronquer |
| `text-fit.ts` | un texte tient-il dans son champ, et à quelle taille |
| `text-sizes.ts` | la configuration des tailles (D-68) : la taille visée, 9 pt, et le plancher. Une version du modèle la modifie, pas le code |
| `text-overflow.ts` | l'erreur levée quand il ne tient pas |
| `field-mapping.ts` | la forme d'un tableau de remplissage : un champ, une ligne |
| `dates.ts` | une date sur un champ peigné |
| `flatten-cerfa.ts` | l'aplatissement du PDF rempli : plus aucun champ, chaque valeur dessinée sur la page (D-84) |
| `produce-cerfa.ts` | ce qu'est un cerfa à remplir (`CerfaForm`), sa production au clic (remplir, puis aplatir) avec `pdf-lib` chargé à la demande, le nom daté du fichier, le téléchargement |
| `CerfaDownload.tsx` | le bouton qui produit et télécharge, et l'alerte si ça échoue |

Un formulaire rempli porte des données de santé nominatives. Il se génère **dans le
navigateur uniquement**, et ce dossier n'adresse jamais `/api`.

Qui fournit le cerfa dit d'où vient son gabarit : `template` est un chargeur,
appelé au clic. `templateAt(url)` charge un asset servi par l'app.

*Gardé par* `tests/socle/cerfa/`, sur des formulaires fabriqués,
`tests/socle/simulateur/telechargement-du-cerfa.test.tsx`, et
`tests/architecture.test.ts`.

## Les trois racines de runtime

Découpage **par fonctionnalité**, à l'intérieur de trois racines :

| Racine | Ce que c'est |
|---|---|
| `front/` | le navigateur, bundlé par Vite |
| `server/` | le backend, qui détient la clé Grist |
| `shared/` | le contrat front ⇄ back, chargé des deux côtés |

Hors de ces racines, `cms/` porte le script collé dans Sites Conformes. Il s'exécute
sur les pages du CMS, pas dans l'app : il n'importe rien et n'est importé par
personne, ses tests le chargent comme texte.

À lire à côté :

- [`docs/knowledge/adr/identification.md`](docs/knowledge/adr/identification.md)
- [`docs/knowledge/adr/analytics.md`](docs/knowledge/adr/analytics.md)
- le [README](README.md), pour l'arborescence commentée

## Commandes

| Commande | Ce qu'elle fait |
|---|---|
| `pnpm verifier` | **À passer avant de dire que c'est fait.** lint → typecheck → knip → tests → build (+ vérification de bundle). Exactement ce que lance la CI. |
| `pnpm dev` | Front et backend ensemble : c'est `tsp dev simulateur` |
| `pnpm dev:front` | Serveur Vite, <http://localhost:5173> (proxy `/api` → `:3000`) |
| `pnpm dev:server` | Backend Express, <http://localhost:3000> |
| `pnpm start` | Serveur de production (`node server/server.ts`) |
| `pnpm lint:fix` | Applique tous les correctifs sûrs de Biome |

`pnpm build` enchaîne trois étapes :

1. `tsc -b` sur les quatre projets : front, node, serveur, tests ;
2. Vite ;
3. `verifier-bundle` : `pdf-lib`, le modèle et le catalogue de seeds doivent
   rester hors du chunk d'entrée.

Si tu remplaces un `import()` par un import statique, c'est l'étape 3 qui te le
dit.

## Versions

`package.json` porte la version de l'app. Une livraison se marque par un tag
`simulateur-eligibilite@<version>` : le monorepo n'a pas de tag global. Ce
qu'elle apporte s'écrit dans [`CHANGELOG.md`](CHANGELOG.md), sous la forme d'un
TL;DR puis d'une ligne par commit, groupée par type.

Le pied de page du simulateur affiche deux valeurs : cette version et le commit
déployé. Voir le [README](README.md) § « Savoir
ce qui tourne ».

La marche à suivre est dans le skill `livrer-une-version`.

## Les invariants

Ils sont **exécutables**, dans
[`tests/architecture.test.ts`](tests/architecture.test.ts) :

- les frontières entre `front/`, `server/` et `shared/` ;
- le simulateur, qui ignore qui prescrit ;
- les seeds et les developer tools, greffés sur le simulateur et jamais l'inverse ;
- le socle PDF, qui ne dépend que de lui-même et n'adresse jamais `/api` ;
- les règles publicodes, qui ne portent que de l'éligibilité (sans objet tant que
  aucun modèle n'a de dossier `rules/`) ;
- publicodes, que seul le moteur de décision du socle importe ;
- les modèles de `front/models/`, que seul `tests/model/` importe, et qui ne
  s'importent pas entre eux.

Les limites de 30 et 300 lignes sont à part, dans
[`tests/taille-du-code.test.ts`](tests/taille-du-code.test.ts).

**Ne les recopie pas ici.** Lis le fichier. Lis surtout le message d'échec avant
de contourner une règle : il dit ce qu'elle protège.

## Pièges

**Extensions d'import.** Il en faut une (`.ts`) partout où Node peut atteindre le
fichier, et nulle part ailleurs dans `front/`.

| Emplacement | Extension |
|---|---|
| `server/`, `shared/`, `scripts/` | `.ts` |
| ce qu'un script tire dans `front/` | `.ts` |
| le reste de `front/` | aucune |

Node ne résout pas les extensions, Vite si. Ce n'est pas une affaire de dossier
mais d'accessibilité, et `tests/lisibilite.test.ts` la calcule.

**DSFR pour toute l'interface.** Emprunte la forme des props au composant appelé
(`ComponentProps<typeof Checkbox>`) plutôt que de la recopier. Une recopie dérive
d'une version à l'autre.

## Tests

**Sans mock.**

- Les tests d'interface passent Testing Library sur le vrai `<App />`.
- Les tests serveur font de vraies requêtes HTTP sur une app Express montée sur
  un référentiel injecté.
- Les tests du socle PDF remplissent un vrai PDF, fabriqué par `pdf-lib`.

Les tests ont deux dossiers. `tests/socle/` éprouve le socle sur un modèle qu'on
lui injecte : le factice, écrit pour eux dans `tests/socle/fixtures/modele-factice/`.
Il est petit et figé, pour que ces tests ne changent pas quand le modèle de
démonstration gagne une page. `tests/model/` vérifie chaque modèle de
`front/models/` : `conformite.test.ts` y contrôle ce que le socle suppose de
n'importe quel modèle, et rejoue ses seeds.

**Une capacité ajoutée au socle arrive avec trois choses** (D-66) : ses tests,
sur des pages écrites dans le test (`tests/socle/questionnaire-engine/afficher.tsx`),
sa page dans le modèle de démonstration, et une seed qui ouvre cette page.

Réutilise les helpers de `tests/socle/` : `modele-de-test.ts` (le modèle que les
tests injectent), `se-rattacher.ts`, `simulateur/questionnaire.tsx`,
`cerfa/test-form.ts`, `rattachement/serveur-de-test.ts`.

**Une situation de référence va dans le `seeds-catalogue.ts` de son modèle,
pas dans un fichier de test.** C'est un catalogue unique de situations nommées,
*avec leurs cibles attendues*. Celui du modèle de démonstration
([`front/models/fake/seeds-catalogue.ts`](front/models/fake/seeds-catalogue.ts))
ouvre les pages à montrer. Les tests de l'écran des seeds écrivent leurs propres seeds, sur le parcours
factice.

## Les developer tools

L'écran des seeds (`front/socle/seeds/`) et les **traces de debug** sont les deux
developer tools. Ils partagent :

- la même garde d'accès **sur tous les environnements** (service n° 4 du
  référentiel, `front/socle/developer-tools/unlock.ts`) ;
- le même moment : ils sont atteints **après** le rattachement.

Pas de conditionnement sur `import.meta.env.DEV`.

Le simulateur ne connaît pas l'écran des seeds. C'est `App.tsx` qui lui passe du contenu
déjà composé (`developerToolsPanel`).

La trace de debug vit aussi dans `front/socle/developer-tools/` (`DebugTrace.tsx`). Elle
lit l'état vivant du parcours, qu'`App` n'a pas sous la main : `App` passe donc au
simulateur le composant lui-même (`DebugTrace`), et chaque écran lui donne son
état à afficher. Sans composant passé, aucune trace n'est rendue.

Elle montre les questions validées et ce qui s'y proposait, les faits avec leur
provenance, et dit d'une cible qu'elle est indéfinie. Son lien « Exporter la
trace » fabrique un fichier JSON dans le navigateur, pour la recette.
