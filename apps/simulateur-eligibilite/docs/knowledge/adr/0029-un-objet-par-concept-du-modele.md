# ~~ADR-0029 - Un objet par concept du modèle, là où un savoir s'écrit deux fois~~

> Statut : **révoqué** · 2026-10-23 · Anciennement ADR-18 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

> Renversé le 2026-10-28 (#247, D-208 à D-210) : une lecture de réponse
> s'écrit là où elle sert. La table de D-98 se partage en donnée,
> `RETIREE_SI_Q21` dans `declarations/questions.ts` ; la page des contextes et
> les faits écrivent chacun leur condition. `trajetsMensuelsAuPlus` vit dans
> `p3/sens-du-trajet.ts`, le seul fichier qui le lit. Le texte ci-dessous
> garde la décision d'alors.

**Contexte.** Une partie du savoir du modèle vivait dans des fonctions libres.
Quand un savoir servait à plusieurs endroits, chacun le réécrivait : le mineur
de Q2.7 et la permission répétée de Q2.8.5 dans P2, P3 et R2 ; « déjà
hospitalisé » coché ou écarté en Q2.2.1 dans cinq fichiers ; l'aide du patient
de Q1.1 dans une fonction et dans la table de deux faits.

**Décision.** Un concept du modèle est une classe figée, dans
`core/models/eligibilite/concepts/`, un fichier par concept, nommé en français.
Il lit ses réponses une fois, à la construction, et répond par des méthodes
qui disent la règle. Il ne pose aucun fait : la déclaration d'un fait
l'interroge, et reste unique (ADR-0023). Précision du 2026-10-23 : un concept
~~peut répondre par un `Fait`, ou laisser la main (`PassesOn`), quand plusieurs
faits reprennent la même règle (`Sejour.nonSiEcarte()`). Il ne déclare pas de
fait du catalogue pour autant : chaque déclaration choisit ce qu'elle reprend.~~
Précision du 2026-10-27 : un concept ne donne plus de `Fait`. Les faits lisent
leurs réponses par des conditions, et ce qu'ils partagent vit dans
`faits/communs.ts` (ADR-0033). Un concept que seuls les faits lisaient disparaît.

Un concept se construit sur `AnswersReader`, ce que les réponses données et
les questions validées ont en commun. Une garde ou une cohérence lit les
premières, un fait et R2 les secondes, et tous lisent le même objet. Une
lecture qui n'a de sens que sur des questions validées (une case proposée puis
écartée) se déclare par un paramètre `this` typé, comme sur `Cible` : la
compiler sur des réponses données échoue.

| Concept | Ce qu'il porte | Ce qui le lit |
|---|---|---|
| ~~`Permission`~~ | ~~Q2.7 et Q2.8 : le mineur, l'adulte à sa charge, les cinq contrôles de dates et leurs seuils, la répétition, les trajets d'un mois~~ | retiré (#247) : les trajets d'un mois restent dans `p3/sens-du-trajet.ts` |
| ~~`Sejour`~~ | ~~Q2.2.1, Q2.1 et Q2.1.g : « déjà hospitalisé » à proposer, coché ou écarté, l'entrée qui ouvre le séjour, le séjour réel~~ | retiré (#245) : les faits le lisent par `UN_SEJOUR_ECARTE` |
| ~~`AideDuPatient`~~ | ~~Q1.1 : seul, avec un proche, avec un professionnel, ou sans professionnel~~ | retiré (#247) : P1 lit Q1.1 sur place |
| ~~`CriteresDuTransport`, `CasParticuliers`, `Soin`~~ | ~~Q1.2, Q1.3 et le soin de Q2.1 (#218)~~ | retirés (#245) : seuls les faits les lisaient |
| ~~`ContextesDuTrajet`~~ | ~~Q2.2.1.b : les situations de l'autre cadre à proposer~~ | retiré (#247) : la page et les faits lisent `RETIREE_SI_Q21` |
| ~~`RetourPenitentiaire`, `DepartDeLEntree`~~ | ~~l'option 10 et sa sortie vers la prison, le départ de Q2.13 (#218)~~ | retirés (#245) : `UNE_SORTIE_VERS_LA_PRISON`, `UNE_ENTREE_SIMPLE` |
| ~~`ExceptionsDeLArticle80`, `DistanceDuTrajet`, `Urgence`~~ | ~~Q2.6, Q2.3.1, et Q2.3.4 ou Q2.12 (#218)~~ | retirés (#245) : chaque fait lit sa réponse |

| Option | Pour | Contre |
|---|---|---|
| des prédicats nommés, dans le fichier du thème | rien à construire | chaque thème relit les réponses ; un même savoir s'y écrit à sa façon |
| un objet par question | une règle par réponse | une enveloppe de plus sur `GivenAnswer`, sans règle à porter |
| un objet par concept, là où un savoir s'écrit deux fois | une règle, un endroit, un test | une classe par concept |

La troisième. Le critère est le doublon : une réponse lue à un seul endroit
reste lue là. Depuis la révision de l'ADR-0023, deux faits sont deux fichiers :
une lecture qu'ils partagent est un doublon, et devient un concept. Q2.3.2, une
case seule que lit un seul fait, reste lue dans son fichier.

**Conséquences.**

- Les deux faits de Q1.1 passent de la table de `selon` à `ouiSi` et `nonSi`,
  avec la même provenance ~~(`citant`)~~. Le banc d'équivalence le vérifie.
- Ce qui ne se lit qu'une fois reste à sa place : les options adultes de Q2.7,
  qui lisent Q1.3, et le rappel des permissions de P3, qui affiche les dates
  telles qu'elles sont saisies.
- La garde de `Q2.2.1.hasAnswer()` reste chez le fait qui l'attend, la
  permission et la prestation : c'est un moment du parcours, pas une règle du
  séjour.
- Un test du modèle garde la frontière : un concept ne lit ni P1, ni P2, ni
  P3, ni R2, ni R3. Toutes les parties le lisent.
- Chaque concept se teste seul, sur des réponses. Les cas des dates de la
  permission sont passés tels quels sur le concept.

## Mises à jour

> **Mise à jour 2026-10-23, un fichier par fait (#218).** L'ADR-0023 est révisé :
> une déclaration ne vit plus dans le thème de la question qui pose son fait,
> mais dans son propre fichier, sous `faits/`. Une page ne garde que ses
> questions et ses gardes. L'ADR-0029 est précisé : un concept peut répondre par
> un `Fait`, que la déclaration reprend, sans déclarer de fait du catalogue.
> Décision de Simon, au journal D-165.

> **Mise à jour 2026-10-27, les faits en valeurs (#245).** Un fait est une
> valeur nommée, faite de règles sur des conditions (ADR-0033). L'ADR-0023 et
> l'ADR-0024 perdent `retient`, l'ADR-0029 les concepts que seuls les faits
> lisaient. Décisions de Simon, au journal D-202 à D-207.

> **Mise à jour 2026-10-28, la fin des concepts (#247).** L'ADR-0029 et l'ADR-0031
> sont renversés : `concepts/` disparaît, avec `AnswersReader` et
> `numeroDeLOption`. Une lecture de réponse s'écrit là où elle sert, même deux
> fois. Une donnée de l'éditeur se partage en donnée, dans `declarations/`
> (`RETIREE_SI_Q21`). Aucun fichier n'est commun aux pages et aux faits.
> Décisions de Simon, au journal D-208 à D-210.
