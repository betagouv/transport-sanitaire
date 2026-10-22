# AGENTS.md - simulateur-eligibilite

> Les conventions du dépôt sont dans [`../../AGENTS.md`](../../AGENTS.md). Ici,
> ce qui est propre à cette app.

## Ce que c'est

Le simulateur d'éligibilité au transport sanitaire. Sa pile :

- React 19 + Vite + DSFR (`@codegouvfr/react-dsfr`) ;
- un questionnaire **déclaré par l'application** (`core/socle/questionnaire-engine/`),
  que `front/socle/questionnaire-engine/` affiche.

**L'app est entre deux modèles.** Le modèle v9 et ce qui en dépendait sont retirés,
la v10 n'est pas intégrée : son avancement est dans l'issue 50 du dépôt, ses
décisions dans `docs/knowledge/adr/journal-des-decisions-v10.md`. Il n'y a encore
ni page de résultat métier, ni CERFA téléchargeable. Le simulateur
s'ouvre sur le **modèle de l'éditeur** (`core/models/eligibilite/` et
`front/models/eligibilite/`, D-119). Il
s'intègre étape par étape, sur la v10.1.3 : ses règles, ses faits, ses cibles et son
oracle sont là, son questionnaire va jusqu'à P3, le complément du cerfa, qui
s'ouvre après le verrou (`p3/partie-3.ts`). R2 est posée pour les dix issues : les cinq issues sans fiche patient
(caisse, établissement, permission à la charge du patient, convocation, transport
à l'étranger), la fiche négative, et les fiches positives de la prescription
médicale de transport, du S3141 et des deux demandes d'accord préalable. Les
boutons de chaque issue sont posés (`r2/boutons-du-resultat.ts`) ; « Compléter »
ouvre P3, dont le résultat (R3) n'a pas encore de PDF (#157) : en attendant, il
récapitule les réponses de P3 (`r3/recapitulatif-du-complement.ts`).
Le [README](README.md) § « Entre deux modèles » dit ce qui est parti et ce qui reste.

Le simulateur a deux racines, et chacune a deux dossiers (ADR
[`metier-et-ecran`](docs/knowledge/adr/metier-et-ecran.md)) :

| | `socle/` : ce qui ne dépend d'aucune version du modèle | `models/` : un dossier par modèle |
|---|---|---|
| `core/`, le métier | moteur de questionnaire, moteur de décision, seeds, contrat `CoreModel` | les déclarations, les questions, les faits, les règles et les seeds |
| `front/`, l'écran | rattachement, parcours, affichage des questions, analytics, outils PDF, developer tools, contrat `Model` | les deux résultats et le cerfa |

Les modèles sont `fake/`, celui de démonstration, et `eligibilite/`, celui de
l'éditeur, en cours d'intégration. Chacun a un dossier du même nom dans
`core/models/` et dans `front/models/`. Le métier se charge sous Node, sans
Vite ni navigateur : `tests/model/metier-sous-node.test.ts` le vérifie.

Le modèle de l'éditeur se range par partie du parcours : `p1/` (le mode),
`p2/` (l'éligibilité) et `p3/` (le complément du cerfa) dans `core/`, `r2/` (le
résultat, avec un dossier par famille d'issues) et `r3/` (son résultat) dans
`front/`. Les racines des deux dossiers les assemblent. Une partie ne lit pas
celle qui la suit, et les familles de R2 ne s'importent pas entre elles :
`tests/model/eligibilite/domaines.test.ts` le garde.

Le modèle de démonstration est pérenne (D-82). **Chaque capacité du socle y a
sa page**, pour la valider à l'écran sans dépendre du modèle de l'éditeur.

**Le socle ne sait pas qu'un modèle est « de démonstration »** (D-83). `main.tsx`
passe à `App` une seule liste, `models`, où chaque modèle porte son nom et de
quoi se charger. Le premier s'ouvre au démarrage. À plusieurs, les developer
tools proposent d'en changer (`front/socle/app/model-choice.ts`) : le choix est
donc réservé au service n° 4, comme eux.

Le socle ne connaît le modèle que par deux contrats. `CoreModel`
(`core/socle/model.ts`) porte le métier : les parties d'avant le verrou
(`questionnaire`), celle d'après (`complement`), ce qui calcule la préconisation
(des réponses aux faits, des faits aux cibles) et les seeds. `Model`
(`front/socle/model.ts`) le porte sous `core`, et y ajoute les deux résultats :
`result` et `cerfa`. `front/main.tsx` est le seul fichier qui importe le socle
et les modèles. Il dit à `App` comment charger chaque modèle, et `App` charge le
premier pendant l'écran de rattachement : un modèle reste hors du chunk
d'entrée. Le socle n'importe rien des modèles. Un modèle n'importe du socle que
ses deux points d'entrée, `core/socle/index.ts` pour son métier et
`front/socle/index.ts` pour son écran. Aucun modèle n'importe l'autre.
Une exception : le moteur de décision, `core/socle/decision-engine/publicodes.ts`,
qu'un modèle prend à la source. C'est le seul fichier qui importe publicodes
(D-76).
`tests/architecture.test.ts` garde ces règles.

Le parcours commence par un **écran de rattachement
obligatoire** : établissement et service, sans identifier la personne
(`front/socle/rattachement/`, référentiel Grist). Le tout est servi par
un **backend Node/Express** (`server/` : le front et `/api/*`) déployé sur
**Scalingo**. Ce n'est pas un site statique.

## Le questionnaire

Le moteur est en deux moitiés. `core/socle/questionnaire-engine/` porte la
mécanique, sans React ni phrase de l'écran :

| Fichier | Ce qu'il porte |
|---|---|
| `question.ts` | ce qu'est une question pour le moteur (`Question` : son id, sa sorte, ses dépendances, et `askedIn`, ce qu'elle donne vu le contexte), une page, une partie, une réponse |
| `question-factory.ts` | les constructeurs nommés des questions (`questionsOf`) : la sorte vient du constructeur, les options du catalogue du modèle, d'après l'id |
| `declared-question.ts`, `declared-choices.ts`, `declared-inputs.ts` | une classe par sorte de question déclarée. Chaque réglage (`askedIf`, `hint`, `min`…) donne une copie, et `askedIn` tire la question posée de la déclaration |
| `declared-option.ts`, `declared-page.ts` | les réglages d'une option, par une lambda (`.option(valeur, (option) => …)`), et `page(id, ...questions)`, dont la condition s'ajoute à chacune de ses questions |
| `question-context.ts` | le seul objet que reçoivent les conditions et les libellés du moment : `{ answers, validated, cibles, faits }`. Les faits n'y sont calculés que si on les lit |
| `option.ts` | ce qu'est une option offerte : sa valeur, son libellé, sa description, son aide, ce qu'elle bloque |
| `address.ts` | ce qu'est une adresse, la seule réponse en objet : ses champs, ceux qui se demandent en France ou à l'étranger, et ce qui ne va pas dans chacun |
| `questionnaire.ts` | `Questionnaire`, ses pages dans l'ordre, et `Reading`, des réponses lues à travers lui : `questionnaire.readWith(answers, cibles)`. Une lecture se calcule une fois et ne change pas : pages et questions qui se posent (`askedPages`, `questionsOn`), questions validées (`validated`), complétude (`isComplete`), page où l'on rouvre (`openPage`), page suivante (`pageAfter`), réponses d'une page validée (`commit`). Et `QuestionnaireState`, ce que le parcours garde d'un écran à l'autre |
| `asked-question.ts` | `AskedQuestion`, la question telle qu'elle se pose : libellé, rappel, bornes, options, mode d'adresse et incohérences du moment. Elle ne porte aucune fonction : elle passe en JSON, et `askedQuestion` la relit |
| `asked-common.ts`, `asked-choices.ts`, `asked-inputs.ts`, `asked-address.ts` | une classe par sorte de question posée. Chacune dit ce qu'elle garde d'une réponse (`kept`), si la réponse suffit (`isAnsweredBy`) et ce qui n'y va pas (`problemsWith`) |
| `answer-problem.ts` | ce qui ne va pas dans une saisie, dit par sa nature (`{ kind: "missing" }`…). Les phrases de l'éditeur y restent telles quelles (`{ kind: "stated", text }`) |
| `reading-in-order.ts` | la lecture dans l'ordre, que `Reading` fait une fois : chaque question posée voit les validées d'avant elle, et les questions validées gardent ce qui s'y proposait |
| `given-answers.ts`, `validated-answers.ts` | les deux lectures des réponses, que le modèle reçoit (voir « La décision ») |
| `page-commit.ts` | ce que deviennent les réponses quand une page est validée, et ce que ça efface (`Reading.commit` le lit) |

`front/socle/questionnaire-engine/` l'affiche :

| Fichier | Ce qu'il porte |
|---|---|
| `questionnaire.ts` | le parcours à l'écran : il garde l'état (page ouverte, brouillon) et interroge la lecture pour le reste |
| `screen-texts.ts` | les phrases de l'écran : « (facultatif) », le message de chaque nature de problème, les libellés des champs d'une adresse |
| `QuestionnaireForm.tsx`, `QuestionField.tsx`, `Stepper.tsx` | le formulaire, le champ DSFR de chaque sorte de question, le stepper |
| `auto-advance.ts`, `questionnaire-tracking.ts` | l'avancement seul d'une page de choix uniques, et ce que le parcours envoie à l'analytics |

Neuf règles à tenir en ajoutant une question :

- **Une question se déclare par son constructeur, un réglage par ligne.**
  `question.singleChoice("Q1.1", "Concernant son déplacement, le patient :")` :
  la sorte vient du constructeur, les options du catalogue `OPTIONS` du modèle,
  d'après l'id. Une option ne se règle que pour ce qu'elle porte de plus, dans
  sa lambda : `.option("6_SEANCE", (option) => option.offeredIf(…))`. `order`
  en garde une partie, dans cet ordre, et `exclusive` met la sienne à part.
  Chaque réglage donne une copie : une déclaration ne change jamais. Le modèle lie ses constructeurs une fois, dans son
  `question.ts` : `questionsOf<Questions, Faits>({ options, faits })`. Ce qui se
  pose après le verrou lit les cibles : un second jeu, typé avec elles
  (`questionDuComplement` dans le modèle de démonstration).
- **Une condition d'affichage s'écrit dans `askedIf`.** Jamais dans un composant.
  Celle d'une page (`page(…).askedIf(…)`) s'ajoute à chacune de ses questions.
- **Une condition lit ce qui la précède.** Elle reçoit un seul objet : les
  réponses (`answers`), les questions validées avant la sienne (`validated`),
  les cibles figées et les faits de ces questions validées. Sur la page
  ouverte, celles qui la précèdent comptent telles qu'elles sont à l'écran.
- **Une garde lit le fait quand il en existe un.**
  `.askedIf(({ faits }) => faits.fait_permission.value === true)`. Elle ne
  recompose pas, réponse par réponse, ce que le fait établit déjà. Sans fait qui
  la dise, elle appelle un prédicat nommé, rangé dans le fichier de son concept
  (`mineurDeVingtAns` dans `p2/permission.ts`).
- **Un fait ne lit jamais une garde qui lit les faits.** Le calcul tournerait en
  rond : le socle l'arrête net, sur une erreur qui le dit. Dans le modèle
  d'éligibilité, les gardes lisent les faits des réponses (`FaitsDesReponses`),
  sans la complétude de P1 et de P2 : la constater pose les questions, donc lit
  leurs gardes.
- **Une dépendance se déclare dans `dependsOn`.** Sans elle, la réponse survit au
  changement de celle dont elle dépend. Une adresse dont le mode change
  (`abroadIf`) survit de même : elle se relit dans le nouveau mode, sans son
  pays si elle revient en France.
- **Une incohérence se déclare par `inconsistentIf(condition, message)`, sur la
  plus tardive des deux questions.** Le moteur lui cache les réponses des pages suivantes : une
  règle écrite sur la première ne se déclenche jamais. Elle lit sa propre page, brouillon
  compris, et les réponses d'avant le verrou. Son message dit quelle
  question corriger ; il peut citer les réponses, s'il est une fonction du
  contexte. Une question incohérente n'est
  pas validée. On corrige par « Précédent » : aucun bouton, aucun saut. Une
  erreur de format s'affiche seule, avant les incohérences. Celle d'une adresse
  s'affiche sous le groupe, et une erreur de champ passe devant.
- **Une saisie ne compte qu'une fois la page validée.** Le brouillon vit dans
  `questionnaire.ts`, pas dans le champ.
- **Le verrou est un montage, pas un drapeau.** Ce qui vient après le verrou est un
  second `QuestionnaireForm`, qui reçoit `lockedAnswers` et ne repose rien
  (`front/socle/simulateur/Simulateur.tsx`).

*Gardé par* `tests/socle/simulateur/` et
`tests/socle/questionnaire-engine/constructeurs-de-questions.test.ts`. Le
typage refuse une question écrite en objet : le moteur ne reçoit que des
questions déclarées, qui savent se poser.

## La décision

Un fait a trois états : vrai, faux, ou absent. Absent, il ne vaut jamais « non ».

Ses pièces sont dans `core/socle/`.

| Pièce | Ce qu'elle porte |
|---|---|
| `GivenAnswers` (`given-answers.ts`) | les réponses données, lues question par question : `answers.question("Q1.1").is("1_SEUL")`, `.isNot(option)`, `.checked(case)`, `.checkedBoxes()`, `.hasAnswer()`. Une question sans réponse n'est aucune option, sans être un « non » |
| `ValidatedAnswers` (`validated-answers.ts`) | les questions validées, lues de même, avec ce qui se proposait : `.isValidated()`, `.offers(option)`, `.declined(case)`, et `.faitOf(case)`, qui donne oui (cochée), non (proposée, non cochée) ou rien (jamais montrée) |
| `preconisation.faits(answers, validated)` | le modèle reçoit ces deux lectures, jamais les réponses brutes. Il applique, fait par fait, le contrat de l'éditeur |
| `Fait` (`decision-engine/fait.ts`) | ce qu'on sait d'un fait : sa valeur si elle est établie, et sa provenance. `Fait.oui`, `Fait.non` et `Fait.inconnu` le construisent |
| `faitsOf` (`decision-engine/fait-builder.ts`) | le constructeur des faits, lié au modèle dans son `fait.ts` : `fait("fait_motif_camsp")`, dont le nom est vérifié. Ses règles s'appliquent dans l'ordre, la première qui établit le fait l'emporte : `seulementSi(condition)`, `selon(réponse, { "1_OUI": "oui", "2_NON": "non" })`, qui écrit seul la provenance « Q2.1.h : « 1_OUI ». », `ouiSi` et `nonSi(condition, provenance)`. `sinon(provenance)` clôt la chaîne : le fait est inconnu si aucune règle ne l'établit, et l'entrée `{ fait_motif_camsp: … }` revient. Un fait qui enchaîne plusieurs cas, ou ajoute un texte à la réponse, reste une fonction qui donne un `Fait` |
| `publicodesEngine` | n'envoie aux règles que les faits établis. Une cible peut revenir `undefined` : indéfinie, ce qui n'est pas une décision, ni `null` (sans objet) |

Le socle dit ce qui a été montré, validé, coché. Il ne conclut rien : c'est le
modèle qui applique, fait par fait, le contrat de l'éditeur.

*Gardé par* `tests/socle/decision-engine/`, `tests/socle/preconisation.test.ts` et
`tests/socle/questionnaire-engine/questions-validees.test.tsx` et
`tests/socle/questionnaire-engine/lecture-des-reponses.test.ts`.

## Le socle PDF

`front/socle/cerfa/` remplit un cerfa et le télécharge. Il ne porte aucun
formulaire, et **ne sait rien du simulateur** : il reçoit un DTO, d'où qu'il
vienne. Il n'importe rien du reste du socle.

Chaque cerfa a son DTO, en mots clairs, et une définition qui dit où va chaque
entrée dans le gabarit (`Cerfa<Dto>`) :

| Le DTO dit | La définition garde | Exemple |
|---|---|---|
| un texte | le nom exact du champ | `motif: text("elements medicaux")` |
| un commentaire facultatif | le texte qu'il suit, dans le même champ | `commentaire: commentOn("motif")` |
| une case cochée | le champ et son état d'export | `en_ald: box("ald", "Oui")` |
| une case qui partage son champ | le champ et son état : la marque est dessinée | `longue_distance: drawnBox("km", "Oui")` |
| un texte sans champ | sa position sur la page | `remarque: at({ page: 1, x: 36, y: 104, width: 348 })` |

Un gabarit qui renomme un champ ne change que la définition, jamais le DTO.

Un texte n'est jamais coupé, et ne bloque jamais le PDF (D-85, D-94). Il
s'écrit dans son champ à 9 pt, puis à 8 pt. S'il n'y tient pas, il perd son
commentaire facultatif, et le bouton le dit avant tout téléchargement. S'il
n'y tient toujours pas, son champ reste vide : il se dessine depuis le haut du
cadre, à 8 pt, et déborde dessous, par-dessus ce qui s'y trouve. Il ne descend
sous 8 pt que pour rester sur la page, jusqu'à 6 pt.

Le modèle traduit les données du simulateur en DTO (`CerfaMapping`, dans
`front/socle/cerfa-mapping.ts`) : une fonction par entrée, qui lit les réponses,
les faits et les cibles figés au verrou, et la date de complétion. `bindCerfa`
lie une définition à son mapping et vérifie qu'ils parlent du même DTO. Le
simulateur calcule le DTO sous le second résultat et le passe au bouton.

| Fichier | Ce qu'il porte |
|---|---|
| `fill-cerfa.ts` | l'écriture dans un AcroForm : textes et leur commentaire, cases et leurs états d'export. Ce qui ne tient pas dans son cadre |
| `text-fit.ts` | un texte tient-il dans son champ, et à quelle taille |
| `overflow.ts` | où et à quelle taille se dessine un texte qui déborde de son cadre |
| `widget-page.ts` | la page qui porte le widget d'un champ |
| `text-sizes.ts` | la configuration des tailles (D-68) : la taille visée, 9 pt, la taille réduite, 8 pt, et le plancher, 6 pt. Une version du modèle la modifie, pas le code |
| `cerfa.ts` | ce qu'est un cerfa : son DTO, son gabarit, et où va chaque entrée |
| `dates.ts` | une date sur un champ peigné |
| `flatten-cerfa.ts` | l'aplatissement du PDF rempli : plus aucun champ, chaque valeur dessinée sur la page (D-84). Puis ce qu'un champ ne sait pas montrer : les marques des cases partagées, les textes sans champ, ceux qui débordent |
| `generate-cerfa.ts` | la génération : le DTO traduit dans les noms du gabarit, remplir, puis aplatir, avec `pdf-lib` chargé à la demande. Le nom daté du fichier, le téléchargement |
| `CerfaDownload.tsx` | le bouton, qui génère le PDF dès qu'il s'affiche et le télécharge au clic. L'avertissement d'un commentaire retiré, l'alerte si ça échoue |

Un formulaire rempli porte des données de santé nominatives. Il se génère **dans le
navigateur uniquement**, et ce dossier n'adresse jamais `/api`.

Qui fournit le cerfa dit d'où vient son gabarit : `template` est un chargeur,
appelé quand le bouton s'affiche. `templateAt(url)` charge un asset servi par l'app.

*Gardé par* `tests/socle/cerfa/`, sur des formulaires fabriqués,
`tests/socle/simulateur/telechargement-du-cerfa.test.tsx`, et
`tests/architecture.test.ts`.

## Les quatre racines de runtime

Découpage **par fonctionnalité**, à l'intérieur de quatre racines :

| Racine | Ce que c'est |
|---|---|
| `core/` | le métier : les moteurs et la logique des modèles. Il se charge sous Node comme dans le navigateur, sans React ni DOM |
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
| `pnpm regles` | Recalcule le `regles.json` de chaque modèle d'après son `regles.publicodes`. À lancer après toute retouche des règles : un test le compare |

`pnpm build` enchaîne trois étapes :

1. `tsc -b` sur les cinq projets : front, métier, node, serveur, tests ;
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

Ils sont **exécutables**. Les frontières entre `core/`, `front/`, `server/` et
`shared/` sont dans
[`tests/frontieres-des-racines.test.ts`](tests/frontieres-des-racines.test.ts).
Le reste est dans [`tests/architecture.test.ts`](tests/architecture.test.ts) :

- le simulateur, qui ignore qui prescrit ;
- les seeds et les developer tools, greffés sur le simulateur et jamais l'inverse ;
- le socle PDF, qui ne dépend que de lui-même et n'adresse jamais `/api` ;
- les règles publicodes, qui ne portent que de l'éligibilité ;
- publicodes, que seul le moteur de décision du socle importe ;
- les modèles de `core/models/` et de `front/models/`, que seul `tests/model/`
  importe, et qui ne s'importent pas entre eux.
- le socle, qui n'importe rien des modèles, et les deux points d'entrée par
  lesquels un modèle importe le socle.

Les limites de 30 et 300 lignes sont à part, dans
[`tests/taille-du-code.test.ts`](tests/taille-du-code.test.ts).

**Ne les recopie pas ici.** Lis le fichier. Lis surtout le message d'échec avant
de contourner une règle : il dit ce qu'elle protège.

## Pièges

**Extensions d'import.** Il en faut une (`.ts`) partout où Node peut atteindre le
fichier, et nulle part ailleurs dans `front/`.

| Emplacement | Extension |
|---|---|
| `core/`, `server/`, `shared/`, `scripts/` | `.ts` |
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
démonstration gagne une page. `tests/model/` vérifie chaque modèle, dans
`core/models/` et `front/models/` : `conformite.test.ts` y contrôle ce que le
socle suppose de n'importe quel modèle, et rejoue ses seeds.
`metier-sous-node.test.ts` les rejoue sous Node, sur le seul métier. `tests/model/eligibilite/` compare
les déclarations du modèle de l'éditeur à ses règles, et rejoue son oracle, en
faits, contre le moteur.

**Une capacité ajoutée au socle arrive avec trois choses** (D-66) : ses tests,
sur des pages écrites dans le test (`tests/socle/questionnaire-engine/afficher.tsx`),
sa page dans le modèle de démonstration, et une seed qui ouvre cette page.

Réutilise les helpers de `tests/socle/` : `modele-de-test.ts` (le modèle que les
tests injectent), `se-rattacher.ts`, `simulateur/questionnaire.tsx`,
`cerfa/test-form.ts`, `rattachement/serveur-de-test.ts`.

**Une situation de référence va dans le `seeds-catalogue.ts` de son modèle,
pas dans un fichier de test.** C'est un catalogue unique de situations nommées,
*avec leurs cibles attendues*. Celui du modèle de démonstration
([`core/models/fake/seeds-catalogue.ts`](core/models/fake/seeds-catalogue.ts))
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
état à afficher. Sans composant passé, aucune trace ne s'affiche.

Elle montre les questions validées et ce qui s'y proposait, les faits avec leur
provenance, et dit d'une cible qu'elle est indéfinie. Son lien « Exporter la
trace » fabrique un fichier JSON dans le navigateur, pour la recette.
