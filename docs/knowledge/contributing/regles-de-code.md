# Les règles de code

> Les 20 règles `QUAL-*`. Les conventions du dépôt sont dans
> [`travailler-dans-le-depot.md`](travailler-dans-le-depot.md), les règles de commit dans
> [`regles-git.md`](regles-git.md).

**20 règles**. Chacune a son identifiant. Cite-le en revue ou en commit
(« corrige QUAL-006 ») plutôt que de reformuler la règle.

| Id | Règle | Garde |
|---|---|---|
| QUAL-001 | Un fichier s'ouvre sur son contrat | `lisibilite.test.ts` |
| QUAL-002 | Le privé descend sous le marqueur d'implémentation | `lisibilite.test.ts` |
| QUAL-003 | Un helper privé est une `function` hoistée | `lisibilite.test.ts` |
| QUAL-004 | Rien ne s'exécute au chargement du module | aucune |
| QUAL-005 | Couper aux jointures du sens, pas pour tenir le budget | `taille-du-code.test.ts` (détecte seulement) |
| QUAL-006 | Séparer les branches, pas la répétition | aucune |
| QUAL-007 | Un nom ajoute ce que le site d'appel ne dit pas | aucune |
| QUAL-008 | Répéter un littéral plutôt que fabriquer un fragment sans nom | aucune |
| QUAL-009 | Une fonction choisit, les autres font | aucune |
| QUAL-010 | Un fichier se sépare par sujet, pas par débordement | `taille-du-code.test.ts` (détecte seulement) |
| QUAL-011 | Un fichier ou un dossier porte le nom d'une feature, pas d'une catégorie | `lisibilite.test.ts`, `miroir-des-sources.test.ts` |
| QUAL-012 | N'exporter que ce qu'un autre fichier importe | `pnpm knip` |
| QUAL-013 | Ne jamais formater à la main | Biome |
| QUAL-014 | Pas de suppression pour un linter que le projet ne lance pas | aucune |
| QUAL-015 | Une suppression nomme sa règle et sa raison | Biome (`suppressions/parse`, `suppressions/unused`), garde seulement la présence d'une raison, pas son contenu |
| QUAL-016 | Dossiers et fichiers en kebab-case, sauf un composant React | `lisibilite.test.ts` |
| QUAL-017 | Un retour qui peut manquer nomme son absence | `lisibilite.test.ts` |
| QUAL-018 | Un fichier dit son rôle par son suffixe | `roles-par-suffixe.test.ts` (les dossiers qui la suivent déjà) |
| QUAL-019 | Hors de React, une notion est une classe | aucune |
| QUAL-020 | Pas de test d'absence | aucune |

Huit règles n'ont aucune garde. Une garde serait trop complexe à tenir ou trop
restrictive : elle dirait *qu'*on a coupé, jamais *si* on a coupé au bon endroit.
Elles restent à la revue, et le tableau le dit plutôt que de le laisser croire.

---

### QUAL-001 - Un fichier s'ouvre sur son contrat

> Raison : un lecteur qui ouvre un fichier cherche ce qu'il peut en appeler, pas
> comment c'est fait. Sans ordre imposé, il lit tout pour trouver l'export qui
> l'intéresse.

Dans l'ordre :

1. un en-tête de quelques lignes, qui dit *ce que ce fichier permet de faire* ;
2. les types publics ;
3. les exports, dans l'ordre où un appelant les rencontre.

Le pourquoi, l'histoire et les contraintes descendent à côté du code qu'ils
expliquent, pas dans un préambule.

**Exemples**

```ts
// ✅ OK
// Les deux lectures typées du moteur d'éligibilité.

export type Cible = "cible_cas_final" | "cible_document_depart_ville";

export function texte(moteur: Engine, cible: Cible): string { … }
```

```ts
// ❌ KO
import Engine from "publicodes"; // le fichier ouvre sur un import, sans en-tête

const SEPARATEUR = " . "; // du privé avant le contrat

export type Cible = "cible_cas_final" | "cible_document_depart_ville";
```

*Gardé par* `tests/lisibilite.test.ts › un fichier se lit comme son contrat ›
chaque fichier s'ouvre sur un en-tête`.

---

### QUAL-002 - Le privé descend sous le marqueur d'implémentation

> Raison : le lecteur doit pouvoir s'arrêter au marqueur. Au-dessus, ce qu'on
> peut appeler ; en dessous, la façon dont c'est fait.

Le marqueur est `// ---- implémentation ----`. Les constantes privées descendent
avec, dès qu'elles ne sont lues que dans des fonctions. Un type ou une constante
dont un export est bâti restent au-dessus : ils font partie du contrat.

**Exemples**

```ts
// ✅ OK
export function texte(moteur: Engine, cible: Cible): string {
  return normaliser(moteur.evaluate(cible).nodeValue);
}

// ---- implémentation ----

const VIDE = "";

function normaliser(valeur: unknown): string { … }
```

```ts
// ❌ KO
const VIDE = "";

function normaliser(valeur: unknown): string { … } // le privé mêlé au contrat

export function texte(moteur: Engine, cible: Cible): string { … }
```

*Gardé par* `tests/lisibilite.test.ts › un fichier se lit comme son contrat › un
fichier qui a du privé le range sous le marqueur d'implémentation`.

---

### QUAL-003 - Un helper privé est une `function` hoistée

> Raison : un privé sous le marqueur est appelé depuis plus haut. En `const`
> fléché, il n'existe pas encore au moment de l'appel. C'est une erreur TDZ à
> l'exécution, que le typecheck ne voit pas.

**Exemples**

```ts
// ✅ OK
function normaliser(valeur: unknown): string { … }
```

```ts
// ❌ KO
const normaliser = (valeur: unknown): string => { … };
```

*Gardé par* `tests/lisibilite.test.ts › un fichier se lit comme son contrat › les
helpers privés sont des fonctions hoistées`.

---

### QUAL-004 - Rien ne s'exécute au chargement du module

> Raison : un effet au chargement part dès qu'un fichier importe le module, dans
> un ordre que personne ne contrôle. Les tests le subissent aussi, et se mettent
> à dépendre d'un réseau ou d'un secret qu'ils n'ont pas demandé.

Une exception : un point d'entrée explicite, en tête de fichier.

**Exemples**

```ts
// ✅ OK : rien ne part tant que personne n'appelle
export function referentiel(): Referentiel {
  return depuisGrist(configuration().gristDocUrl);
}
```

```ts
// ❌ KO : part à l'import, tests compris
export const referentiel = depuisGrist(process.env.GRIST_DOC_URL);
```

*Aucune garde.* Un test refuserait des constantes légitimes : il distingue mal
un calcul sans effet d'un appel vers l'extérieur.

---

### QUAL-005 - Couper aux jointures du sens, pas pour tenir le budget

> Raison : la limite de 30 lignes détecte une fonction qui fait plusieurs choses.
> Elle ne dit pas où couper. Une coupe faite pour la limite déplace le problème
> et ajoute un saut de lecture.

Le test : **ferais-tu la même extraction si la limite n'existait pas ?** Sinon,
tu coupes au mauvais endroit.

**Exemples**

```tsx
// ✅ OK : l'extraction qu'on ferait sans limite : un nom par situation
function Bloc1Resultat({ cas }: Props) {
  if (cas === "PMT") return <PrescriptionMedicale />;
  if (cas === "DAP") return <AccordPrealable />;
  return <NonEligible />;
}
```

```tsx
// ❌ KO : coupé au point où ça débordait, sur un nom qui décrit le balisage
function Bloc1Resultat({ cas }: Props) {
  return (
    <>
      <EnTetes cas={cas} />
      <CorpsSuite cas={cas} />
    </>
  );
}
```

*Gardé par* `tests/taille-du-code.test.ts › taille du code › aucune fonction ne
dépasse 30 lignes`, en lignes réelles. Biome porte la même limite pour le retour
dans l'éditeur, mais il compte des lignes *logiques* : un bloc de texte JSX y
pèse une ligne. C'est le test qui fait foi.

---

### QUAL-006 - Séparer les branches, pas la répétition

> Raison : extraire le fragment que deux branches partagent est la coupe la moins
> chère et la mauvaise. Le parent fait toujours ce qu'il faisait, moins quelques
> lignes.

Un branchement sur des cas métier est la jointure. Chaque branche devient une
fonction nommée d'après le cas qu'elle répond, et le parent se réduit à un
aiguillage d'une ligne.

**Exemples**

```tsx
// ✅ OK : une fonction par cas, le parent aiguille
function Bloc3CasRetenu({ cas }: Props) {
  return cas === "SMUR" ? <PriseEnChargeSmur /> : <ChargeEtablissement />;
}
```

```tsx
// ❌ KO : le partagé est extrait, le parent garde les deux cas
function Bloc3CasRetenu({ cas }: Props) {
  return (
    <section>
      <Rappel cas={cas} />
      {cas === "SMUR" ? <p>Transport d'urgence…</p> : <p>À la charge de…</p>}
    </section>
  );
}
```

*Aucune garde.* C'est du jugement, pas de la forme.

---

### QUAL-007 - Un nom ajoute ce que le site d'appel ne dit pas

> Raison : un nom qui répète l'emplacement ou le balisage n'apprend rien au
> lecteur, et lui coûte quand même le saut jusqu'à la définition.

**Exemples**

```tsx
// ✅ OK : le nom dit quelle situation est répondue
<AucunTransportPrescrit />
```

```tsx
// ❌ KO : l'emplacement, puis le balisage : un fragment, pas une intention
<PiedDePage />
<Introduction />
<EnTetes />
```

*Aucune garde.* C'est du jugement, pas de la forme.

---

### QUAL-008 - Répéter un littéral plutôt que fabriquer un fragment sans nom

> Raison : deux lignes identiques dans deux branches ne coûtent rien. Un
> composant d'une ligne sans intention coûte un saut à chaque lecteur, pour
> toujours.

On ne factorise que ce qui a un nom propre, prend des paramètres et sert des
appelants sans rapport.

**Exemples**

```tsx
// ✅ OK : le <li> commun est répété, chaque branche se lit d'un bloc
function Etapes({ cas }: Props) {
  if (cas === "PMT") {
    return <ul><li>Signer</li><li>Remettre au patient</li></ul>;
  }
  return <ul><li>Faire viser</li><li>Remettre au patient</li></ul>;
}
```

```tsx
// ❌ KO : un composant d'une ligne, sans nom propre ni paramètre
function LigneRemise() {
  return <li>Remettre au patient</li>;
}
```

*Aucune garde.* C'est du jugement, pas de la forme.

---

### QUAL-009 - Une fonction choisit, les autres font

> Raison : une fonction qui choisit *et* fait ne se relit pas. On ne voit plus
> les cas qu'elle couvre, et ajouter un cas oblige à comprendre le traitement.

**Exemples**

```ts
// ✅ OK : elle choisit, elle délègue
export function documentPour(cas: CasFinal): Document {
  return cas === "PMT" ? remplirPmt() : remplirDap();
}
```

```ts
// ❌ KO : elle choisit et remplit dans la même branche
export function documentPour(cas: CasFinal): Document {
  if (cas === "PMT") {
    const modele = charger("pmt");
    return ecrire(modele, champsPmt());
  }
  return remplirDap();
}
```

*Aucune garde.* C'est du jugement, pas de la forme.

---

### QUAL-010 - Un fichier se sépare par sujet, pas par débordement

> Raison : couper un fichier au point où il dépasse 300 lignes produit deux
> fichiers dont aucun n'a de sujet. Le second n'est nommable que par sa position.

La limite bloque : elle force à chercher les sujets du fichier. Un fichier qui
n'en a qu'un, une fois ce qui pouvait en sortir sorti, prend un plafond à lui
dans la garde, avec sa raison. Le plafond se relit en revue ; il ne remplace pas
la recherche. Un avertissement ne la forcerait pas : on ne le lit plus.

**Exemples**

```
✅ OK : coupé par sujet, chaque nom dit une feature
cerfa/field-mapping.ts    ce qu'est un tableau de remplissage
cerfa/lieux-du-trajet.ts   les adresses, aplaties sur une ligne
```

```
❌ KO : coupé là où ça débordait
cerfa/field-mapping.ts
cerfa/field-mapping-suite.ts
```

*Gardé par* `tests/taille-du-code.test.ts › taille du code › aucun fichier ne
dépasse 300 lignes`. Le test compte `texte.split("\n").length`, soit `wc -l`
plus un : un fichier à 300 au `wc -l` échoue.

---

### QUAL-011 - Un fichier ou un dossier porte le nom d'une feature, pas d'une catégorie

> Raison : si le nom a besoin d'`utils`, `helpers`, `types` ou `commun` pour
> fonctionner, il n'a pas d'intention. Son contenu appartient à ses appelants, et
> une capacité s'éparpille sur un dossier par genre de fichier.

Sous une racine, un dossier est un module, une entité (un nom) ou une capacité
(un verbe). Un fichier porte une responsabilité et se nomme de ce qu'il exporte.
Les tests se rangent comme les sources : `tests/socle/questionnaire/` éprouve
`front/socle/questionnaire/`.

**Exemples**

```
✅ OK
unlock.ts  questionnaire.ts  pagination.ts  lieux-du-trajet.ts
cerfa/  questionnaire-engine/
```

```
❌ KO
utils.ts  helpers.ts  commun.ts  acces.ts
utils/  types/  helpers/
```

*Gardé par* `tests/lisibilite.test.ts › un nom dit une intention › aucun fichier
ne porte un nom de catégorie`, `tests/miroir-des-sources.test.ts › les dossiers de
sources › aucun dossier ne porte un nom de catégorie` et
`› les dossiers de tests › chaque dossier de tests a son dossier de sources`.

---

### QUAL-012 - N'exporter que ce qu'un autre fichier importe

> Raison : un export non lu se présente comme un point d'entrée. Un lecteur le
> prend pour tel, et l'API du fichier devient plus large qu'elle n'est.

Un export qui est de la documentation et non du code appelé le déclare par un
`@public` motivé.

**Exemples**

```ts
// ✅ OK : un seul point d'entrée
const SERVICE_PRODUIT = 4;

export function estServiceProduit(idService: number): boolean {
  return idService === SERVICE_PRODUIT;
}
```

```ts
// ❌ KO : deux exports que personne n'importe
export const SERVICE_PRODUIT = 4;
export const CLE_SESSION = "identite";

export function estServiceProduit(idService: number): boolean { … }
```

*Gardé par* `pnpm knip`, dans `verifier`. C'est le défaut qu'a livré le fichier
aujourd'hui appelé `unlock.ts`.

---

### QUAL-013 - Ne jamais formater à la main

> Raison : Biome tient le format, l'ordre des imports et le lint, sur le même
> socle (`biome.base.jsonc`) pour toutes les apps. Une mise en forme manuelle est
> défaite au passage suivant, et le diff porte alors deux changements.

Un hook `PostToolUse` passe Biome sur chaque `.ts` / `.tsx` écrit, dans n'importe
quelle app. Le format n'est jamais à toi de défendre.

**Exemples**

```ts
// ✅ OK : la forme que Biome écrit
const CIBLES = {
  pmt: "cible_pmt",
  dap: "cible_dap",
};
```

```ts
// ❌ KO : alignement tenu à la main
const CIBLES = {
  pmt : "cible_pmt",
  dap : "cible_dap",
};
```

*Gardé par* Biome, dans `pnpm lint`, lui-même dans `verifier`.

---

### QUAL-014 - Pas de suppression pour un linter que le projet ne lance pas

> Raison : le projet ne lance que Biome. Une directive `eslint-disable` ne
> supprime rien, et personne ne s'en aperçoit puisque rien ne la lit.

**Exemples**

```tsx
// ✅ OK
// biome-ignore lint/correctness/useExhaustiveDependencies: le moteur est stable
```

```tsx
// ❌ KO : a dormi des mois dans Parcours.tsx sans rien supprimer
// eslint-disable-next-line react-hooks/exhaustive-deps
```

*Aucune garde.* Biome ne voit pas les directives d'un autre linter.

---

### QUAL-015 - Une suppression nomme sa règle et sa raison

> Raison : une suppression sans raison se recopie. Posée à distance de la ligne
> fautive, elle ne supprime rien et survit à la disparition du défaut.

La forme est `// biome-ignore <règle>: <raison>`, sur la ligne **immédiatement**
avant la ligne fautive, la raison en toutes lettres.

**Exemples**

```tsx
// ✅ OK
// biome-ignore lint/suspicious/noArrayIndexKey: pas d'autre identifiant stable
key={index}
```

```tsx
// ❌ KO : pas de raison, et une ligne d'écart avec la fautive
// biome-ignore lint/suspicious/noArrayIndexKey
style={{ fontWeight: 700 }}
key={index}
```

*Gardé par* Biome, *seulement* pour la forme. `suppressions/parse` refuse une
suppression sans raison (ou à raison vide). `suppressions/unused` signale une
suppression qui ne supprime rien, dont celle posée loin de la ligne fautive. Biome
ne lit pas la raison : « x » passe.

---

### QUAL-016 - Dossiers et fichiers en kebab-case, sauf un composant React

> Raison : deux façons d'écrire un nom obligent à vérifier laquelle à chaque
> import, et un renommage de casse seule se perd sur un disque qui l'ignore.

Un dossier ou un fichier s'écrit en minuscules, ses mots séparés par des tirets.
Une seule exception : le `.tsx` qui exporte un composant React porte le nom de
ce qu'il exporte, en PascalCase. Un fichier de test ou un point d'entrée n'est
pas un composant.

**Exemples**

```
✅ OK
developer-tools/  answer-error.ts  footer.test.tsx  main.tsx
Footer.tsx        le composant `Footer`
```

```
❌ KO
developerTools/   Footer.test.tsx   Main.tsx   answerError.ts
footer.tsx        alors qu'il exporte le composant `Footer`
```

*Gardé par* `tests/lisibilite.test.ts › un nom s'écrit d'une seule façon`, dans
`apps/simulateur-eligibilite`.

---

### QUAL-017 - Un retour qui peut manquer nomme son absence

> Raison : `| undefined` ne dit pas pourquoi la valeur manque. Le lecteur doit
> ouvrir la fonction pour savoir si c'est une réponse absente, un texte qui ne
> tient pas ou un cas que les règles ne prouvent pas.

Le type de retour nomme l'absence par un alias `= undefined`, avec une phrase qui
dit ce qui manque. Le même sens prend le même nom, déclaré une fois et importé :
`Unanswered` pour une réponse pas encore donnée, `NoError` pour une réponse
juste, `AucunTexte` pour un cas sans texte au catalogue. Un sens propre à un
fichier y reste, privé.

**Exemples**

```ts
// ✅ OK
/** Le texte ne tient dans son cadre à aucune taille. */
type DoesNotFit = undefined;

function sizeInField(field: PDFTextField, text: string): number | DoesNotFit {
```

```ts
// ❌ KO : rien ne dit ce que veut dire l'absence
function sizeInField(field: PDFTextField, text: string): number | undefined {
```

*Gardé par* `tests/lisibilite.test.ts › aucun retour ne finit par un \`undefined\`
sans nom`, dans `apps/simulateur-eligibilite`.

---

### QUAL-018 - Un fichier dit son rôle par son suffixe

> Raison : sans suffixe, il faut ouvrir un fichier pour savoir s'il porte une
> notion, un calcul ou un accès à l'extérieur. Et un fichier sans rôle finit par
> en mélanger plusieurs.

Cette règle ne vaut que pour `apps/simulateur-eligibilite`, hors composants React.

| Suffixe | Ce que le fichier porte |
|---|---|
| `.entity.ts` | une notion qui a une identité et qui change |
| `.vo.ts` | une notion qui ne vaut que par sa valeur, et ne change pas |
| `.service.ts` | un calcul du métier qui n'appartient à aucune notion seule |
| `.usecase.ts` | un geste de l'application, par sa méthode `execute` |
| `.port.ts` | ce que le métier demande à l'extérieur |
| `.adapter.ts` | ce qui répond à un port |
| `.error.ts` | une erreur du métier |
| `.factory.ts` | ce qui fabrique une notion |
| `.types.ts` | des types, et rien d'autre |
| `.constants.ts` | des listes fermées et les types qui en dérivent, sans paquet |
| `.schema.ts` | une validation zod |
| `.controller.ts` | une entrée HTTP : elle valide la requête et appelle un use case |
| `.hook.ts` | l'adaptateur de l'écran : du React, et un appel de use case par événement |
| `.client.ts` | un client HTTP préconfiguré : adresse, authentification, JSON, erreurs |

Un `index.ts` s'en passe : il ne fait que réexporter. Un fichier qui assemble les
classes d'une racine (`container.ts`, `server.ts`, `app.ts`, `main.tsx`) s'en
passe aussi. Une fabrique porte le nom de ce qu'elle fabrique et vit dans son
dossier, à côté de son produit : une `.entity`, une `.vo` ou des `.types` du même
nom. Un `.constants.ts` est du domaine : une entité, un objet-valeur ou un
service peut l'importer. Un `.schema.ts` n'en est pas : un contrôleur l'importe.
Un hook ne porte aucune règle (QUAL-019).

Un fichier qui n'a aucun rôle de la table (un utilitaire d'écran, une table de
valeurs qui n'est pas une liste fermée, la déclaration d'un modèle) reste sans
suffixe. Le suffixe `.adapter` suppose un port : sans port à satisfaire, le fichier n'est pas un adaptateur, sauf l'adaptateur de démarrage, que seul un assembleur lit, une fois (`server/configuration.adapter.ts`).

**Exemples**

```
✅ OK : chaque fichier dit ce qu'il porte, la fabrique est à côté de sa notion
question/declared/question.vo.ts
question/declared/question.factory.ts
question/question.types.ts
```

```
❌ KO : rien ne dit que le premier fabrique, ni que le second mêle types et fonctions
question/declared/factory.ts
question/question.ts
```

*Gardé par* `tests/roles-par-suffixe.test.ts › un fichier dit son rôle par son
suffixe`, dans `apps/simulateur-eligibilite`. La garde couvre `core/socle/`,
`server/journal/`, `server/grist/`, `server/postgres/`, `front/socle/analytics/`
et `front/socle/server-api/` : un dossier la rejoint quand il suit la règle. Que
le hook ne porte aucune règle est du jugement.

---

### QUAL-019 - Hors de React, une notion est une classe

> Raison : une notion faite d'un type et de fonctions éparses n'a pas d'endroit
> à elle. Ce qu'on peut lui demander se cherche dans tout le dossier, et chaque
> appelant refait ses vérifications.

Cette règle ne vaut que pour `apps/simulateur-eligibilite`. Une notion du métier
est une classe qui porte ses données et ce qu'on lui demande. Un composant ou un
hook React reste une fonction, et un hook ne porte aucune règle : il appelle une
classe.

**Exemples**

```ts
// ✅ OK : l'id d'une question se demande à sa classe
QuestionId.of(question).value;
```

```ts
// ❌ KO : une fonction seule, dans un fichier de types
idOf(question);
```

*Aucune garde.* C'est du jugement, pas de la forme.

---

### QUAL-020 - Pas de test d'absence

> Raison : un test garde un comportement de l'app, pas le souvenir d'un code
> supprimé. Un test d'absence ne prévient aucun bug et reste à maintenir.

Quand on supprime une fonctionnalité, on supprime ses tests sans les remplacer.
Restent légitimes un vrai comportement de repli et un invariant de
confidentialité.

**Exemples**

```ts
// ✅ OK : le repli du routeur pour une route inconnue est un comportement
expect((await get("/inconnue")).status).toBe(404);
```

```ts
// ❌ KO : la route a été retirée, le test garde son souvenir
expect((await get("/api/ancienne-route")).status).toBe(404);
```

*Aucune garde.* C'est du jugement, pas de la forme.
