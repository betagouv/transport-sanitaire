# ADR-0023 - Un fait se déclare une fois, dans son fichier du catalogue (~~dans le thème qui le pose~~, ~~faits partiels fusionnés~~)

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-12 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Chaque page de P2 donnait ses faits en objet partiel, et le modèle
les fusionnait dans un ordre fixe : le dernier écrit l'emportait. Trois
commentaires gardaient cet ordre (« après les contextes : un positif de Q2.5
l'emporte… »). La permission avait trois auteurs, le transfert et le Centre 15
quatre. Lire ce qu'un fait vaut demandait de lire toutes les pages et l'ordre
de leur fusion. Un fait qu'aucune page ne posait restait absent sans qu'on
sache si c'était voulu.

**Décision.** Le socle porte un catalogue des faits (`FaitCatalogue`). Le modèle
le construit une fois, avec la liste des faits de ses règles et une
déclaration par fait, ~~rangée dans le thème qui le pose~~ dans son fichier
(révision du 2026-10-23, plus bas). La déclaration est une chaîne de règles
(`unFait()…sinon(…)`) : la première qui conclut l'emporte, et la chaîne dit
tout ce que le fait vaut. ~~Quand une autre page en décide une partie, son
thème exporte une petite règle, qui donne un `Fait` ou rien, et la chaîne la
reprend (`retient(sejourEcarte(validated))`).~~ ~~Quand un autre fait lit la même
chose, un concept la porte et la chaîne reprend sa réponse
(`retient(Sejour.of(validated).nonSiEcarte())`).~~ Quand plusieurs faits
reprennent la même règle, elle se nomme dans `faits/communs.ts` et chacun
l'applique (`applique(UN_SEJOUR_ECARTE)`, ADR-0033).

Le catalogue refuse au chargement un fait déclaré deux fois, oublié, ou qui
n'est pas du modèle. Un fait qu'aucune réponse ne pose se déclare aussi, et sa
provenance dit pourquoi (D-102, D-109, D-117). Une déclaration peut lire
d'autres faits : chacun se calcule à sa première lecture, une fois par
lecture. Un fait qui se relit, par d'autres faits ou par une garde, s'arrête
sur une erreur qui donne le chemin.

| Option | Pour | Contre |
|---|---|---|
| garder la fusion, l'ordre documenté | rien à porter | l'ordre reste un savoir caché ; un auteur de plus le casse sans bruit |
| une déclaration par page, le catalogue vérifie les doublons | peu de code déplacé | un fait à plusieurs auteurs ne s'écrit pas |
| une déclaration par fait, des règles partagées entre thèmes | tout ce qu'un fait vaut se lit à un endroit | un thème exporte des règles pour un autre |

La troisième. ~~Le thème d'un fait est celui de la question qui le pose le plus
souvent : la permission vit dans `permission.ts`, même si Q2.1 et Q2.2.1
l'établissent aussi.~~ L'ordre des chaînes reprend celui de l'ancienne fusion,
lu à l'envers : la branche, la sortie vers la prison, la convocation, la
permission, le transfert, les contextes, la prestation.

**Conséquences.** Les règles publicodes ne changent pas. Sur les 4 688 états
du banc d'équivalence, les questions posées, les faits et les cibles sont les
mêmes. Seules changent des provenances : celles des faits qu'aucune question
ne pose, et celle de l'urgence en attente (ADR-0025).

**Révision 2026-10-23 : un fichier par fait (#218).** Un fait rangé dans le
thème de sa question restait dur à trouver. La permission vivait dans la page
de Q2.7, que Q2.1 et Q2.2.1 établissent aussi. Une page mêlait ses questions,
ses gardes, ses faits et les petites règles qu'elle prêtait aux autres.

Chaque fait a désormais son fichier, sous `core/models/eligibilite/faits/`, au
nom du fait sans `fait_`, en kebab-case : `fait_distance_plus_50` vit dans
`distance-plus-50.ts`. Les faits n'appartiennent à aucune partie, et n'ont pas
de famille. Le fichier s'ouvre sur le titre que l'éditeur donne au fait, dit
ce qui l'établit, puis le contrat qu'il suit : `CONTRAT_REPONSES_FAITS.json`,
ou `CORRECTIF_FAITS_SANS_REPONSE.md` quand ce correctif le reprend. Il
n'exporte que sa déclaration, au nom du fait en camelCase. Ce qu'il est seul à
lire reste privé, sous le marqueur d'implémentation.

- ~~Ce que plusieurs faits lisent devient un concept (ADR-0029), qui peut répondre
  par un `Fait` sans déclarer de fait du catalogue.~~ Ce que plusieurs faits
  lisent va dans `faits/communs.ts` (ADR-0033).
- ~~Une provenance partagée suit la question qu'elle cite, dans le concept qui la
  lit.~~ Une règle cite seule ce qu'elle lit (ADR-0033). Celles qui ne citent aucune question restent dans
  `declarations/faits.ts` : `PAS_ENCORE_ETABLI`, `SANS_PERMISSION`.
- Une page ne garde que ses questions et ses gardes. Une garde qui lit ce
  qu'un fait lit passe par le même concept.
- `faits/index.ts` réunit les fichiers dans le catalogue, ~~par nom~~ en liste
  (ADR-0033). `FAITS`, la liste des noms, reste dans les déclarations.

| Option | Pour | Contre |
|---|---|---|
| garder le thème de la question | rien à déplacer | un fait se cherche page par page ; une page prête ses règles aux autres |
| un dossier de faits par partie (`p1/faits/`) | la partie reste le premier rangement | un fait que deux parties établissent n'a pas de partie |
| un fichier par fait, sous `faits/`, sans famille | un fait se trouve par son nom | 60 fichiers ; ce qu'ils partagent doit devenir un concept |

La troisième, choisie par Simon. Un test d'architecture vérifie qu'à chaque
nom de `FAITS` répond un fichier, qui n'exporte que sa déclaration et s'ouvre
sur le titre de l'éditeur. Un autre vérifie qu'un fait ne lit aucune partie :
les gardes des parties lisent les faits. Sur les 4 688 états du banc
d'équivalence, les questions posées, les faits, les cibles et les provenances
sont les mêmes.

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
