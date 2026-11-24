# Les règles d'architecture du simulateur

> Les 10 règles `ARCH-*`, propres à `apps/simulateur-eligibilite`. Les règles de
> code sont dans [`regles-de-code.md`](../../../../../docs/knowledge/contributing/regles-de-code.md),
> la façon d'en écrire une dans
> [`ecrire-une-regle.md`](../../../../../docs/knowledge/contributing/ecrire-une-regle.md).

**10 règles**, mêmes conventions que les `QUAL-*`. Cite l'identifiant en revue ou
en commit (« corrige ARCH-005 »). Les ADR de cette app gardent les décisions
coûteuses à défaire ; ici, les choix de forme du code.

| Id | Règle | Garde |
|---|---|---|
| ARCH-001 | `core/` ne connaît ni l'écran ni le serveur, `shared/` rien, et le rattachement reste hors du moteur | `frontieres-des-racines.test.ts`, `architecture.test.ts` |
| ARCH-002 | Un modèle a deux dossiers du même nom, et le socle ne le connaît que par deux contrats | `architecture.test.ts` |
| ARCH-003 | Hors d'un module du socle, on n'importe que son `index.ts` | `modules-du-socle.test.ts` |
| ARCH-004 | Le domaine n'importe aucun adaptateur, et seul un adaptateur importe un paquet | `clean-architecture.test.ts` |
| ARCH-005 | Un fait et une cible se lisent par leurs méthodes | `lecture-des-valeurs.test.ts` |
| ARCH-006 | Un fait se déclare une fois, dans son fichier | `catalogue-des-faits.test.ts`, `domaines.test.ts` |
| ARCH-007 | Une question se déclare par son constructeur, et se répète par `.unlessAskedBefore()` | typage, `conformite.test.ts` |
| ARCH-008 | Une garde est une condition, et R2 et R3 lisent des valeurs | typage, `lecture-des-valeurs.test.ts` (R2 et R3 seulement) |
| ARCH-009 | Le moteur donne la nature d'un problème, l'écran écrit la phrase | `conformite.test.ts` (le JSON seulement) |
| ARCH-010 | Le nom d'un événement de mesure d'audience est une entrée de `EventName` | typage |

Les tests sont dans `apps/simulateur-eligibilite/tests/`. Le rangement des
fichiers et leurs suffixes sont dans QUAL-011 et QUAL-018.

---

### ARCH-001 - `core/` ne connaît ni l'écran ni le serveur, `shared/` rien, et le rattachement reste hors du moteur

> Raison : le serveur et les scripts doivent calculer une préconisation sans
> navigateur. Un import de React, du DOM ou de `front/` dans `core/` casse ce
> calcul sous Node. Les règles publicodes se rejouent hors de l'app : elles ne
> savent pas qui prescrit.

- `core/` n'importe ni React, ni le DSFR, ni une feuille de style, ni `front/`, ni
  `server/`, et son projet TypeScript n'a pas les types du DOM.
- `front/` et `server/` ne s'importent pas entre eux.
- `shared/` ne dépend que de lui-même.
- Ni le rattachement ni la mesure d'audience n'entrent dans les règles
  publicodes. Le simulateur et les modèles n'importent pas le rattachement.

Ce qui sert à calculer (une question, un fait, une cible, une seed) va dans
`core/`. Ce qui s'affiche (un résultat, une fiche, un cerfa, une phrase) va dans
`front/`.

*Gardé par* `tests/frontieres-des-racines.test.ts` (les cinq frontières) et
`tests/architecture.test.ts › invariants métier › le simulateur ignore qui
prescrit`, `› les règles publicodes ne portent que de l'éligibilité`.

---

### ARCH-002 - Un modèle a deux dossiers du même nom, et le socle ne le connaît que par deux contrats

> Raison : un socle qui importe un modèle est lié à la version de l'éditeur du
> moment. Livrer un nouveau modèle obligerait à le toucher. Deux modèles qui
> s'importent se téléchargeraient ensemble.

- Un modèle a `core/models/<nom>/` (le métier) et `front/models/<nom>/` (l'écran),
  sous le même nom.
- Le socle ne le connaît que par `CoreModel` (`core/socle/model.types.ts`) et
  `Model` (`front/socle/model.ts`). Il n'importe rien d'un modèle.
- Un modèle n'importe du socle que `core/socle/index.ts` et `front/socle/index.ts`.
- Aucun modèle n'importe l'autre, d'un côté comme de l'autre.
- Le socle dit ce qui a été montré, validé, coché. Il ne conclut rien : le modèle
  reçoit les réponses par `GivenAnswers` et `ValidatedAnswers`, jamais brutes, et
  applique le contrat de l'éditeur fait par fait.

*Gardé par* `tests/architecture.test.ts › le socle et le modèle` et
`› les modèles entre eux`.

---

### ARCH-003 - Hors d'un module du socle, on n'importe que son `index.ts`

> Raison : l'index dit ce que le module promet. Un import plus profond lie
> l'importeur à un détail, qui ne peut plus bouger sans le casser, et personne ne
> voit la fuite.

Un module est un dossier direct de `core/socle/` ou de `front/socle/`. Ce qui
manque à son contrat s'ajoute à l'index. Les tests d'un module
(`tests/socle/<module>/`) lisent ses fichiers en direct.

*Gardé par* `tests/modules-du-socle.test.ts › les modules du socle`.

---

### ARCH-004 - Le domaine n'importe aucun adaptateur, et seul un adaptateur importe un paquet

> Raison : changer de bibliothèque ne doit toucher que ses adaptateurs, et le
> domaine doit se tester sans elle. Un use case qui importe l'adaptateur Grist
> lie la règle à son stockage.

- Le domaine (entité, objet valeur, service, use case, erreur, port) n'importe
  aucun `.adapter.ts`. Il déclare ce qu'il attend dans un port et reçoit
  l'adaptateur en paramètre.
- Seul un adaptateur importe un paquet. Dans `core/`, tout fichier qui n'est pas
  un adaptateur. Dans `front/`, `server/` et `shared/`, le domaine seulement :
  un fichier au suffixe `.entity`, `.vo`, `.service`, `.usecase`, `.port`,
  `.error`, `.factory` ou `.types`. Un import `type` compte, et `node:*` aussi.
- Sont exemptés : le composant `.tsx` (il importe React et le DSFR), le `.hook.ts`
  (l'adaptateur de l'écran), le `.controller.ts` (il importe Express et zod à la
  porte du serveur) et le `.client.ts` (l'accès à l'extérieur). Un fichier sans
  suffixe hors de `core/` n'est pas jugé : il n'a pas encore de rôle.
- Un `index.ts` peut exporter un adaptateur, et un `container.ts` assemble ceux de
  sa racine.
- Une seule porte : un modèle charge l'adaptateur publicodes sans index, pour
  rester hors du chunk d'entrée.
- Le domaine du journal et celui de la mesure d'audience sont plus stricts : ils
  n'importent qu'entre eux et `shared/`.

```
✅ OK : le moteur déclare DecisionEngine dans un port, publicodes n'est importé
que par les deux adaptateurs qui l'implémentent
```

*Gardé par* `tests/clean-architecture.test.ts › le sens des dépendances`, sur les
quatre racines pour les adaptateurs, sur `core/` et le domaine des trois autres
pour les paquets, et `› le journal des parcours`.

---

### ARCH-005 - Un fait et une cible se lisent par leurs méthodes

> Raison : un fait absent n'est jamais « non », ni une cible inconnue. Comparer
> `.value` à `true` ou à `null` mêle l'inconnu, le sans objet et le faux, et la
> règle conclut à tort sans que rien ne le signale.

- Un fait se lit par `isOui()`, `isNon()` ou `isInconnu()`.
- Une cible se lit par `isOui()`, `isNon()`, `is(constante)`, `isInconnue()` ou
  `isSansObjet()`. Le compilateur suit sa sorte : `isOui()` sur une cible à
  constantes ne compile pas.
- Jamais en comparant sa `.value`. Elle reste lisible pour s'afficher et passer en
  JSON.
- Seuls le moteur de décision et les lectures des conditions
  (`given-readings.vo.ts`), qui définissent fait et cible, comparent leur valeur.

```ts
// ✅ OK
if (support.is("AUCUN")) return "not_applicable";
```

```ts
// ❌ KO : l'inconnu passe pour une absence
if (support.value == null) return "unknown";
```

*Gardé par* `tests/lecture-des-valeurs.test.ts › un fait et une cible se lisent
par leurs méthodes`. Que l'inconnu ne soit pas un « non » est éprouvé dans
`tests/socle/decision-engine/fait.test.ts` et `cible.test.ts`.

---

### ARCH-006 - Un fait se déclare une fois, dans son fichier

> Raison : un fait à plusieurs auteurs se lit page par page, dans un ordre de
> fusion qu'un auteur de plus casse sans bruit. Un fichier par fait dit tout ce
> qu'il vaut, et ce qu'il lit se sait sans l'exécuter.

- Un fait est un fichier de `faits/`, au nom du fait sans `fait_`, en kebab-case.
  Il n'exporte que sa déclaration.
- Ce que plusieurs faits reprennent mot pour mot va dans `faits/communs.ts`.
  Une donnée de l'éditeur se partage là où elle se déclare : les réponses
  possibles, dans leur question.
- Un fait ne lit aucune partie du questionnaire : ce sont les gardes des parties
  qui lisent les faits.
- Le catalogue refuse au chargement un fait déclaré deux fois ou oublié.

*Gardé par* `tests/model/eligibilite/faits/catalogue-des-faits.test.ts`,
`tests/model/eligibilite/domaines.test.ts › un fait ne lit aucune partie` et
`tests/socle/decision-engine/catalogue-des-faits.test.ts`.

---

### ARCH-007 - Une question se déclare par son constructeur, et se répète par `.unlessAskedBefore()`

> Raison : une question redite en objet littéral recopie sa sorte et ses
> options, et le typage ne refuse plus un réglage d'une autre sorte. Un alias de
> stockage sépare l'id de la clé et fait deux réponses pour une question.

- Une question se déclare par le constructeur de sa sorte (`question.singleChoice`,
  `question.number`…). Chaque réglage donne une copie : une déclaration ne change
  jamais.
- Une question à choix porte ses réponses possibles, qui disent le type de sa
  réponse. Chaque réglage d'une réponse possible se fait dans une lambda :
  `.possibleAnswer(valeur, (possibleAnswer) => possibleAnswer.description(…))`.
  `order(…)` choisit lesquelles s'affichent et dans quel ordre.
- La condition d'une page s'ajoute à ses questions : `page(…).appliesWhen(…)`.
- Une question à plusieurs pages garde un seul id. Sa première page la porte, les
  suivantes par `.unlessAskedBefore()`. Jamais un alias.
- Une constante lue par une déclaration la précède dans le fichier : déclarée plus
  bas, elle casse le chargement du module.

*Gardé par* le typage (une sorte n'a que ses réglages) et
`tests/model/conformite.test.ts › son questionnaire › ne répète un identifiant
que pour une place suivante`.

---

### ARCH-008 - Une garde est une condition, et R2 et R3 lisent des valeurs

> Raison : le graphe des règles doit savoir, sans exécuter, ce que lit chaque
> garde, chaque fait et chaque rubrique. Une fonction du contexte lit ce qu'elle
> veut, et deux lectures d'une réponse (validée ou saisie) se confondent.

- Une garde est une condition (`given…`, `appliesWhen`, `mattersWhile`,
  `offeredWhen`, `inconsistentWhen`), jamais un `if` d'écran ni une fonction du
  contexte. Il n'y a qu'une lecture d'une réponse, `given.question(id).answer()` :
  le socle choisit la validée ou la saisie selon l'endroit.
- Une garde lit le fait quand il en existe un (`given.fait("fait_permission")`).
  Elle ne recompose pas, réponse par réponse, ce que le fait établit déjà.
- Mieux vaut une condition écrite deux fois qu'une abstraction entre les pages et
  les faits.
- R2, R3, ses cerfa et les faits lisent des valeurs (`given…`), pas les réponses
  brutes (`GivenAnswers`, `ValidatedAnswers`).
- Une déclaration lit une question par son objet, et l'importe. Une condition qui
  lit une question vit après elle : dans son fichier, ou dans un
  `conditions/` que la question n'importe pas. Sinon les deux modules s'importent
  et la question lue vaut `undefined` au chargement.

*Gardé par* le typage, et `tests/lecture-des-valeurs.test.ts › R2 et R3 lisent
des valeurs` pour R2 et R3. Les faits et les conditions n'ont pas d'autre garde
que le typage.

---

### ARCH-009 - Le moteur donne la nature d'un problème, l'écran écrit la phrase

> Raison : une API ne veut pas les phrases de l'écran, et un autre écran voudrait
> les siennes. Le moteur qui écrit « Indiquez un code postal » les fige.

- Le moteur dit la nature d'un problème (réponse manquante, nombre hors bornes,
  adresse mal formée). L'écran en écrit la phrase, en un seul endroit du front.
  Une nature nouvelle oblige l'écran à lui donner sa phrase : le typage le réclame.
- Les phrases que l'éditeur livre (un blocage, une incohérence) restent dans le
  moteur, telles quelles.
- Une question posée ne porte que des données, et passe en JSON : le serveur peut
  la donner. Ses méthodes, sur le prototype, jugent une réponse.

*Gardé par* `tests/model/conformite.test.ts › ses seeds › posent des questions
qui passent en JSON, et s'y relisent à l'identique`. La phrase de l'écran est du
jugement : *aucune garde*.

---

### ARCH-010 - Le nom d'un événement de mesure d'audience est une entrée de `EventName`

> Raison : un nom composé à l'exécution (`` `${outil}:${action}` ``) rend le
> vocabulaire ingrepable : aucun symbole ne correspond au nom réellement envoyé.
> Une cible dont la valeur est une phrase d'affichage ferait dépendre les
> rapports du phrasé du modèle.

`EventName` (`front/socle/analytics/audience-event.entity.ts`) liste les noms.
L'appelant choisit l'entrée, le module n'interprète aucune donnée métier.

```ts
// ✅ OK
AudienceEvent.of(EventName.simulationStart, rattachement);
```

```ts
// ❌ KO : le nom se compose, le typage le refuse
AudienceEvent.of(`resultat:${statut}`, rattachement);
```

*Gardé par* le typage : `AudienceEventName` n'accepte que les valeurs de
`EventName`.
