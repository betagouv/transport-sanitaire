# 09: Capacités du socle pour la v10

**What to build:** ce que la v10 demande au socle et qu'il ne sait pas encore
faire. Chaque capacité est générique, testée sur le factice, et n'ajoute rien
au contrat `Model`.

**Blocked by:** 06 (le parcours).

**Status:** le modèle de démonstration (D-82) est en place. Les capacités 1 à
11 sont codées, avec leur page et leur seed, puis le groupe de la décision :
le fait à trois états (20) et sa provenance (21). La v10.0.2, reçue le
12 octobre, ne retient plus rien, ajoute deux capacités (22 et 23) et rend la
liste filtrable (14) inutile pour l'instant. Restent 9 capacités à coder sur
les 23 de l'inventaire.

## Décisions prises

- **D-60** L'adresse est un type de question du socle. Sa réponse est un
  objet, et le type `Answer` s'élargit.
- **D-61** Un texte trop long ne bloque jamais le PDF. Le socle applique les
  règles de l'éditeur tant qu'elles suffisent. Si le texte ne tient toujours
  pas, il est écrit en entier et déborde du cadre, comme sur un formulaire
  papier. L'éditeur l'a accepté à l'oral (rapporté le 12 octobre), puis
  écrit dans la v10.0.2 (D-85).
- **D-62** Les gabarits sont ceux de Notion, « 05. LIVRABLES » :
  `PMT_cerfa_11574-07`, `DAP_cerfa_11575-08` et celui des moins de 20 ans.
  Les PDF du dossier `formulaires/` du livrable ne servent pas.
- ~~**D-63** Avant de déborder, le socle applique les seules règles
  automatiques : réduire le corps jusqu'au plancher (9 pt visés, 8 pt au
  minimum), puis retirer le commentaire facultatif en prévenant le
  prescripteur.~~ Remplacé par D-85 : 8 pt n'est plus un plancher.
- **D-64** Le simulateur n'existe que dans le navigateur.
- **D-65** La recherche d'acte de Q2.1 porte sur la sélection de l'éditeur :
  16 profils, 3 suggestions, leurs synonymes, et « je ne trouve pas ». Pas
  sur les index CCAM et NABM entiers.
  C'est conforme au livrable : `QUALIFICATION_PRESTATIONS.md` désigne la
  sélection comme le dictionnaire des intitulés courants, et le contrat des
  saisies veut « l'identifiant stable du libellé usuel », « jamais un code
  brut ».
- **D-66** Chaque capacité a ses tests sur des pages écrites dans le test, et
  une page de démonstration dans le factice.
- ~~**D-67** Un texte qui déborde continue sous son cadre, quitte à recouvrir
  ce qui s'y trouve.~~ Remplacé par D-85 : rien n'est recouvert.
- **D-68** La taille visée et la taille plancher du texte viennent d'un
  fichier de configuration du socle, qu'une nouvelle version du modèle peut
  modifier. Le contrat `Model` ne change pas.

- **D-82** Le factice de l'app est le modèle de démonstration, de façon
  pérenne. Il vit dans `front/models/fake/`, le modèle de l'éditeur dans
  `front/models/eligibilite/`. Il est embarqué partout, chargé à la demande,
  et s'ouvre par un bouton des developer tools, sans recharger la page. La
  page de démonstration de D-66 ne disparaît donc plus à l'arrivée du modèle
  v10. Une capacité arrive avec ses tests, sa page de démonstration, et une
  seed qui ouvre cette page.
- **D-83** Le socle ne nomme pas le modèle de démonstration. `App` reçoit une
  seule liste de modèles, chacun sous le nom que `main.tsx` lui donne, et les
  developer tools proposent d'en changer quand il y en a plusieurs.

- **D-77** Un fait inconnu n'est pas transmis au moteur (éditeur).
- **D-80** Un seul sens par simulation (éditeur). Le socle n'a pas à porter
  de segment.

Décisions de l'éditeur, dans la v10.0.2 :

- **D-84** Les trois PDF de sortie se remplissent par leurs champs, puis
  s'aplatissent : il n'y reste aucun champ. Le libellé du type de lieu n'est
  plus souligné. Ce qu'un champ ne sait pas montrer se dessine sur le PDF
  aplati, et rien n'est écrit deux fois.
- **D-85** Un texte trop long ne bloque jamais le PDF, et n'est jamais
  reformulé. Dans l'ordre : réduire le corps de 9 à 8 pt, retirer le seul
  commentaire facultatif en prévenant le prescripteur, puis descendre sous
  8 pt. Le texte reste entier, sur la même page, sans recouvrir une autre
  cellule. Il peut sortir de son cadre. Confirme D-61, remplace D-63 et D-67.
- **D-86** Un fait a trois états : « oui », « non » établi, ou absent. Une
  option non cochée ne vaut « non » que si elle a été proposée et sa page
  validée. Une option masquée reste absente, sauf incompatibilité prouvée.
  Une cible peut donc rester indéfinie : ce n'est pas une décision, et elle
  ne s'affiche pas comme telle. Précise D-77.
- **D-87** La trace garde la provenance de chaque fait : la réponse qui le
  donne, la version du référentiel, ou la raison qui le rend sans objet.

Décision du 13 octobre :

- **D-88** Le socle relève les questions validées : pour chacune, les options
  qui se proposaient, et la réponse ou son absence. Le modèle les reçoit pour
  calculer ses faits (`preconisation.faits(answers, validated)`), et les
  conditions d'une question les reçoivent en troisième argument. C'est une
  vue exhaustive : le modèle ne devine pas ce qui a été montré. Le socle ne
  conclut rien. Dire « non » d'une case proposée et non cochée reste au
  modèle, fait par fait, d'après le contrat de l'éditeur. Tranche le point 13.

## Ce que la v10.0.1 change à l'inventaire

| Sujet | Avant | Maintenant |
|---|---|---|
| Lecture seule | en attente de l'éditeur | tranchée : jamais de contrôle désactivé. Un rappel en texte, ou une donnée fixée près d'un champ de P3 |
| Blocage bariatrique | règle non écrite | supprimé : l'option se propose avec un critère d'ambulance, ce que `offeredIf` sait faire |
| Deux segments | à comparer dans une simulation | supprimés (D-80). Q3.1 bloque « Aller-retour différent » |
| Pays d'une adresse | case « Adresse hors de France » proposée | le modèle le sait par Q2.2.5 : pays obligatoire, code postal libre |
| Format postal local | à vérifier, pays par pays | abandonné par l'éditeur |
| Adresse contre la distance | PDF à bloquer | abandonné par l'éditeur |
| Q2.2.1 | une liste de douze options | quatre réponses, une aide dépliable, des précisions sur la même page |
| Fait inconnu | n'existait pas | un fait peut manquer, et une cible rester indéfinie (D-77) |

## Ce que la v10.0.2 change à l'inventaire

Tiré du diff des deux packages : `GUIDE_DEVELOPPEUR_DELTA_v10.0.2.md`, les
six tickets `TS1002`, `COMPLETION_DOCUMENTS.md`, `CONTRAT_SAISIES_ET_PAGES.md`,
`CORRECTIF_FAITS_SANS_REPONSE.md` et `MAPPING_ACROFORM_GABARITS.json`. Le
YAML, le contrat réponses/faits et l'oracle relèvent du modèle : voir le
chantier 10.

| Sujet | Avant | Maintenant |
|---|---|---|
| PDF de sortie | dessiner ou remplir : en attente de l'éditeur | remplir, puis aplatir les trois sorties (D-84). La capacité 19 n'attend plus, et couvre aussi le S3141 |
| Type de lieu | libellé à souligner | le champ « autre lieu » ou « structure de soins » suffit. L'autre reste vide |
| Cases groupées de la DAP | pas vu | 11 cellules partagent 4 champs. Un champ ne sait cocher qu'une case : chacune se marque à part, sur le PDF aplati. Capacité 22 |
| Cellule sans champ | pas vu | « Urgence : autres (précisez) » de la PMT n'a aucun champ. Capacité 23 |
| Texte trop long | accord oral, livrable contraire | écrit dans le livrable (D-85). Plus de taille plancher, plus de recouvrement |
| Longueur maximale d'un champ | `fillCerfa` refuse d'écrire | elle ne doit ni retirer un mot, ni bloquer |
| Fait inconnu | attendait la v10.0.2 | spécifié (D-86). La capacité 20 n'attend plus |
| Provenance | attendait la v10.0.2 | spécifiée (D-87). La capacité 21 n'attend plus |
| Variables manquantes | à trancher | un outil de diagnostic. Les questions s'affichent par leurs conditions (`askedIf`, `offeredIf`) et par les cibles. Le socle ne les expose pas : rien à faire |
| Recherche d'acte de Q2.1 | liste filtrable à coder | inactive : le moteur calcule que le code d'un soin ne change aucune décision. Capacité 14 gelée |
| Q2.10, Q2.7, Q2.8 | une question par page | des précisions sur la même page, selon la réponse : `askedIf` le fait déjà |
| Contradiction avec une page antérieure | pas vu | le prescripteur corrige la réponse d'origine. S'ajoute à la validation croisée (13) |
| Gabarits | ceux de Notion (D-62) | ceux du package, contrôlés par leur empreinte. Le mapping des champs y est lié |

## Ce que ces décisions entraînent

- **D-60.** Une réponse n'est plus seulement une chaîne, un nombre ou une
  liste. La comparaison de deux réponses, l'effacement des dépendances, les
  seeds et la trace doivent accepter un objet. Les règles postales françaises
  entrent dans le socle.
- **D-61, D-85.** `fillCerfa` lève aujourd'hui `TextOverflowError` et ne
  produit aucun PDF. Cette règle s'inverse : `TextOverflowError` disparaît, et
  l'écran « PDF bloqué » sort de l'inventaire. `fillCerfa` refuse aussi un
  texte plus long que la limite du champ : cette limite se lève avant
  d'écrire, puisque le PDF de sortie n'a plus de champ.
- **D-84.** L'option `readOnly` de `fillCerfa` n'a plus d'objet. Une case
  d'un groupe ne se coche plus par son champ quand une autre du même groupe
  l'est aussi : elle se dessine.
- **D-86.** Fait : le moteur n'envoie que les faits établis. Publicodes refuse
  une valeur `undefined`, et une clé absente laisse indéfinie la cible qui en
  dépend. Vérifié sur la version 1.10.1 : indéfinie se lit `undefined`, sans
  objet se lit `null`. Les 59 faits de la v10.0.2 sont tous des oui/non.
- **D-86, D-87.** Fait : le modèle calculait ses faits à partir des seules
  réponses, qui ne disent ni quelles options étaient proposées, ni si une
  question facultative sans réponse a été validée. Il reçoit maintenant les
  questions validées (D-88). C'est le premier changement du contrat `Model`,
  par ajout.
- **D-88.** Les questions se lisent dans l'ordre. Une question est validée
  quand elle se pose et que sa réponse suffit, et que rien n'attend avant
  elle. Aucun état ne s'ajoute au questionnaire : la liste se déduit des
  réponses et de l'ordre des pages, puisqu'on ne passe une page qu'en la
  validant. Sur la page ouverte, une question voit celles qui la précèdent
  telles qu'elles sont à l'écran : Q2.3.4 dépend d'une cible que Q2.3.1, sur
  la même page, fait changer.

## Inventaire

Tiré de `CONTRAT_SAISIES_ET_PAGES.md`, `SPECIFICATION_NAVIGATION.md`,
`COMPLETION_DOCUMENTS.md`, `mapping_documents.json` et du catalogue des
questions, puis confronté au socle.

### Ce que le socle sait déjà faire

| Besoin de la v10 | Dans le socle |
|---|---|
| Sous-questions conditionnelles sur la même page (Q2.1.a à k, Q2.6, Q2.8, et Q2.10.a et b depuis la v10.0.2) | `askedIf` par question, plusieurs questions par page |
| « Aucune » exclusive (Q1.3, Q2.2.1, Q2.6, Q3.7) | `exclusiveOption` |
| Avance immédiate, « Suivant » au retour | `auto-advance.ts` |
| Effacement des seules réponses dépendantes | `dependsOn`, `page-commit.ts` |
| Stepper en parties, trois ou quatre segments | D-45 |
| Verrou, pas de retour en P2 depuis P3 | `simulateur/start.ts` |
| Questions de P3 qui lisent la préconisation figée | `askedIf(answers, cibles)` (D-44) |
| PDF produit dans le navigateur, sans texte coupé | `fillCerfa`, `TextOverflowError` |
| Cartes radio (Q0.1) | une option porte une `description`, rendue sous son libellé |
| Options qui dépendent des réponses (Q1.3, Q2.2.1, Q2.6, Q2.13, Q3.2, Q3.3) | `offeredIf` sur une option. Une réponse perd l'option qui ne se propose plus |
| Libellé de question qui dépend des réponses (Q1.4) | `labelFrom` |
| Page qui ne pose plus rien, sautée sans écran de rappel | `askedPages` |
| Texte sur plusieurs lignes dans un cadre du PDF | `text-fit.ts` mesure un champ multiligne ligne par ligne. `singleLineFields` ramène sur une ligne le texte d'un cadre qui n'en montre qu'une |
| Modèle chargé à la demande (D-71) | `app/model-loading.ts` |
| Décision par publicodes (D-76) | `decision-engine/publicodes.ts` |

### Le modèle de démonstration (D-82) : fait

| Tâche | État |
|---|---|
| Un dossier par modèle | Fait : `front/model/` est devenu `front/models/fake/`. `front/models/eligibilite/` arrive avec la v10.0.2. D'ici là, l'app déroule le modèle de démonstration. |
| Deux factices | Fait. Celui de l'app grandit avec le socle. Celui des tests, dans `tests/socle/fixtures/modele-factice/`, reste petit et figé : les tests de mécanique le déroulent de bout en bout. |
| Une vitrine | Fait : chaque capacité codée y a sa page, et l'indication sous la question dit ce qu'elle démontre. Huit seeds ouvrent ses pages et ses deux résultats. |
| Le choix du modèle | Fait dans le socle, sans le mot « démonstration » (D-83) : `App` reçoit `models`, une liste `{ label, load }`, et ouvre le premier. À plusieurs, les developer tools montrent un bouton par modèle, coché pour celui qui est ouvert. Rien n'est rechargé ni stocké. `main.tsx` n'en liste qu'un tant que `eligibilite/` n'existe pas : d'ici là, il n'y a pas de bouton. |
| Les gardes | Fait : aucun modèle n'importe l'autre, le test de conformité passe sur chaque dossier de `front/models/`, `verifier-bundle` lit le catalogue de seeds de chacun. |

L'audience n'a rien demandé : seul le service n° 4 voit les developer tools,
et Matomo reçoit le service avec chaque évènement. Une simulation de
démonstration se range donc déjà à part.

### Ce qui manque

La colonne « Version » dit quel package le demande.

| N° | Capacité | Demandée par | Version | Écart | Poids |
|---|---|---|---|---|---|
| 1 | ~~Liste déroulante~~ | Q3.2, Q3.3 | les deux | Fait : `dropdown` sur un choix unique. Sa page garde son bouton. | fait |
| 2 | ~~Question facultative~~ | complément d'adresse, commentaire de Q3.4, case de Q2.3.2 | les deux | Fait : `optional`. Le libellé reçoit « (facultatif) », et la page garde son bouton. | fait |
| 3 | ~~Entier strict~~ | Q3.1 | les deux | Fait : `integer` sur un nombre. | fait |
| 4 | ~~Bornes de date et d'heure~~ | Q2.8, Q3.6 | les deux | Fait : `min`, `max`, et `boundsFrom` quand les bornes dépendent des réponses ou du jour. | fait |
| 5 | ~~Texte long, sur plusieurs lignes~~ | Q3.4, Q3.5, fondement de Q2.1.l | les deux | Fait : le type `long text`, rendu en zone de texte. | fait |
| 6 | ~~Options qui s'excluent deux à deux, avec une explication~~ | Q1.2 (6 et 7, 4 et 11), Q2.2.1.b | 10.0.1 | Fait : `incompatibleOptions`. Cocher l'une décoche l'autre, l'explication s'affiche. | fait |
| 7 | ~~Réponse qui bloque~~ | Q3.1, « Aller-retour différent » : un message, et « Suivant » bloqué (D-80) | 10.0.1 | Fait : `blocks` sur une option, le message à afficher. | fait |
| 8 | ~~Libellé d'option qui dépend des réponses, option exclusive conditionnelle~~ | Q2.2.1 (« Aucune de ces situations » devient « Aucune autre situation parmi celles proposées »), « Aucun » de Q3.7, indisponible dès qu'une case est acquise | 10.0.1 | Fait : `labelFrom` sur une option. L'option exclusive a aussi son `offeredIf`. | fait |
| 9 | ~~Aide dépliable sur une option~~ | Q2.2.1, « Voir les situations concernées » | 10.0.1 | Fait : `help` et `helpFrom` sur une option, rendus en lien dépliable juste sous elle. | fait |
| 10 | ~~Rappel d'une valeur connue~~ | les repères « R » de `SPECIFICATION_REAFFICHAGE_FAITS.md` : Q2.1, Q2.1.f, Q2.2.1, Q2.5, Q2.6, Q2.13, Q2.14 | 10.0.1 | Fait : `reminder` et `reminderFrom` sur une question, en une phrase. Le rappel se rend juste avant elle, et seulement si elle se pose. | fait |
| 11 | ~~Donnée fixée près d'un champ~~ | les repères « D » : Q3.2, Q3.3, Q3.4, Q3.7, Q3.8 | 10.0.1 | Fait : le même `reminder`, en valeurs avec leur intitulé, rendues en liste de définitions au-dessus du champ. Une seule capacité avec la 10, sous un seul nom. | fait |
| 12 | Adresse, type du socle (D-60) : champs séparés, code postal français, mode étranger donné par le modèle | Q3.2, Q3.3, Q3.8 | les deux, pays revu en 10.0.1 | Aucun type. La réponse devient un objet. | moyen |
| 13 | Validation croisée, un message par incohérence | début avant fin (Q2.8), code postal selon le pays, extrémité contre le lieu verrouillé, deux adresses identiques pour un même trajet, groupe de Q2.2.1 coché sans précision. Depuis la v10.0.2, une réponse qui contredit une page antérieure : exceptions de Q2.6 contre le séjour, la durée ou la dialyse de Q1.3, « Aucune de ces situations » en Q2.10 après une convocation en Q2.1 | les deux, étendue en 10.0.2 | `errorOf` ne voit qu'une réponse. Il doit voir toutes les réponses, et dire laquelle corriger. | moyen |
| 14 | Liste filtrable (D-65) : **gelée** | Q2.1.c, Q2.1.d | 10.0.1 | La v10.0.2 n'affiche plus la recherche d'acte. À reprendre si une règle future rend le code d'un soin décisif. | gelée |
| 15 | Impression de la fiche | R2 | toutes | `printLabel` n'est pas lu. | petit |
| 16 | Production, téléchargement et impression du PDF, avec la date de complétion figée. Un avertissement quand le commentaire facultatif a été retiré | R3 | toutes, avertissement en 10.0.2 | `downloadLabel`, `template` et `mapping` ne sont pas lus. C'est le reste du chantier 06. | moyen |
| 17 | Taille du texte en configuration (D-68) : 9 pt visés, 8 pt avant de retirer le commentaire | adresses, texte médical | toutes | `text-fit.ts` a 10 et 6 en constantes. 8 pt n'est plus un plancher (D-85). | petit |
| 18 | Texte trop long (D-85). Le texte requis et le commentaire facultatif arrivent séparés. Réduire de 9 à 8 pt, retirer le commentaire, puis réduire jusqu'à ce que tout tienne. Dire ce qui a été retiré, et le garder dans la trace | adresses, texte médical | revue en 10.0.2 | `fillCerfa` refuse d'écrire, et s'arrête à une taille plancher. | moyen |
| 19 | PDF de sortie aplati, sans aucun champ (D-84) | PMT, DAP, S3141 | 10.0.2 | Les champs restent dans le PDF produit. `form.flatten()` de `pdf-lib` les retire : essayé sur la PMT (53 champs, puis 0) et la DAP (56, puis 0). Reste à l'essayer sur le S3141, et à contrôler le rendu dans un lecteur courant. | petit |
| 20 | ~~Fait à trois états (D-86)~~ | tout P2 | 10.0.2 | Fait : le moteur n'envoie pas un fait absent, et rend une cible indéfinie. Le modèle reçoit les questions validées, avec les options qui s'y proposaient (D-88). | fait |
| 21 | ~~Provenance de chaque fait dans la trace, et son export pour la recette (D-87)~~ | recette N3 de l'éditeur | 10.0.2 | Fait : un fait porte sa valeur et sa provenance. La trace de debug montre les questions validées, les faits et leur provenance, dit d'une cible qu'elle est indéfinie, et s'exporte en JSON. | fait |
| 22 | Marque dessinée sur le PDF aplati, à la place de la case, pour chaque motif établi | DAP : groupes `km` (distance, série, CAMSP, maternité), `sit` (quatre situations avion ou bateau), `ald` (ALD, AT/MP), et `malrare` | 10.0.2 | `check` ne coche qu'une case par champ, et refuse une case sans état d'export. La position se lit dans le gabarit : c'est le rectangle de la case. | petit |
| 23 | Texte écrit hors de tout champ, à une position donnée par le mapping | PMT, « Urgence : autres (précisez) », pages 3 et 4 | 10.0.2 | Une ligne du mapping est un champ, sans exception. Le livrable ne donne pas la position : à relever. | petit |

Trois lignes du mapping des champs ne demandent rien au socle :

- **l'adresse** (16 cellules par formulaire) : ses composants se réunissent
  dans le seul champ du type de lieu retenu. C'est le mapping du modèle ;
- **le NIR**, à couper entre le numéro et sa clé : l'identité reste vide
  (D-74) ;
- **l'organisme** de la DAP, sans champ : de l'identité aussi.

### Ce que l'éditeur fixe sur la lecture seule et l'adresse

- **Jamais de seconde saisie.** « Les valeurs déjà établies sont affichées en
  lecture seule, sans seconde saisie. » Une valeur reprise n'est donc pas une
  réponse : elle se calcule à l'affichage.
- **Deux formes d'affichage.** Un rappel en clair (Q2.1, Q2.2.1, Q3.2 : « sans
  case à recocher »). Et, dans un choix multiple, des cases « reprises cochées
  en lecture seule » (Q2.3.2, Q3.7), que « Aucune » n'efface pas. « Aucun »
  devient indisponible dès qu'une case est acquise.
- **Le pays.** « Pays si hors France. » En France, un code postal de cinq
  chiffres. Hors France, le pays est obligatoire et le code postal suit le
  format local. L'éditeur ne dit pas comment le pays se saisit.

Ces trois points décrivent la v10.0.0. La v10.0.1 les remplace : voir « Ce
que la v10.0.1 change à l'inventaire ».

### PDF

- **Les gabarits de Notion (D-62).** Trois fichiers, tous en AcroForm : PMT
  (53 champs), DAP (56 champs), moins de 20 ans (46 champs). Le DAP et le
  moins de 20 ans sont identiques à l'octet à ceux que le dépôt portait avant
  la v10. Le PMT a été réenregistré le 26 août 2026 : mêmes champs, mêmes
  positions, même texte.
- **Les PDF du livrable.** `S3138g.pdf` et `S3139h.pdf` sont les spécimens
  publiés sur ameli.fr : filigrane « SPECIMEN », aucun champ. `S3141.pdf` est
  le même fichier que celui de Notion.
- **Depuis la v10.0.1**, le livrable porte des gabarits remplissables : PMT
  (53 champs), DAP (56 champs), moins de 20 ans (46 champs).
  `PROVENANCE_FORMULAIRES.json` les dit remis le 7 octobre. Le DAP et le
  moins de 20 ans sont identiques à l'octet aux nôtres. Le PMT reste à
  comparer à celui de Notion.
- **Un écart de texte.** Les spécimens datent de février 2026 et ont deux
  corrections que nos gabarits n'ont pas : une référence légale perd la
  mention « annexe VI », et le DAP écrit « prescripteur » là où le nôtre écrit
  « descripteur ». À signaler à l'équipe.
- **Le numéro du troisième formulaire.** Il porte le cerfa 16184*01, la
  référence S3141, et sa notice le numéro 52996#01. Notion le nomme par la
  notice, le livrable par la référence.
- **Conséquence.** `fillCerfa` écrit dans des champs sur les trois formulaires.
  Aucune écriture par coordonnées n'est nécessaire, hors débordement. La
  v10.0.1 demandait l'inverse pour la PMT et la DAP. La v10.0.2 y renonce
  (D-84).
- **Depuis la v10.0.2**, `MAPPING_ACROFORM_GABARITS.json` relie chacune des
  182 cellules à son champ : 121 par le champ seul, 48 pour les adresses,
  11 marques à dessiner (capacité 22) et 2 textes sans champ (capacité 23, et
  l'organisme de la DAP). Il est lié aux gabarits du package par leur
  empreinte. Les trois empreintes sont les mêmes qu'en v10.0.1.
- **Le mapping.** 182 lignes, sans aucune coordonnée : chaque cellule est
  décrite en prose. Écrire sur les PDF sans champs demande de relever chaque
  position, volet par volet.
- **Les sept rendus.** `checkbox` (74), `text` (39), `joined_address` (36),
  `date_fr` (12), `underline_printed_label_and_shared_address` (12),
  `checkbox_expression` (6), `integer` (3). Tous sont du calcul, que le mapping
  du modèle fait avec `textFrom` et `formatDateForField`. Le soulignement
  n'est plus demandé (D-84).
- **Le corps du texte.** Le livrable vise 9 pt, descend à 8 pt, puis plus bas
  s'il le faut (D-85). Le socle a 10 et 6 en constantes.

### Hors de ce chantier

- Le verrou serveur : l'éditeur l'a retiré du livrable (D-64). Le socle ne
  garde rien entre deux chargements et n'a pas d'URL par écran : recharger
  recommence une simulation, sans garde à écrire.
- Le retour différent (Q2.12) et les deux simulations : une question du modèle,
  pas une capacité.
- La concaténation d'une adresse et la composition du texte médical : le
  mapping du modèle.

## Proposé, à confirmer

- **L'ordre, revu sur la v10.0.2.** Faits : le modèle de démonstration
  (D-82), la saisie (1 à 9), le rappel (10, 11), la décision (20, 21).
  Restent trois groupes, à valider un par un :

  | Groupe | Capacités | Pourquoi là |
  |---|---|---|
  | ~~1. La décision~~ | ~~20, 21~~ | Fait. Le modèle écrit tous ses faits dessus |
  | 2. L'adresse | 12 | Change le type d'une réponse |
  | 3. La validation croisée | 13 | S'appuie sur l'adresse pour deux de ses cas |
  | 4. Le PDF | 19 et 17, puis 18, puis 22 et 23, puis 16 et 15 | Aplatir d'abord : tout le reste se contrôle sur le PDF aplati |

  La liste filtrable (14) ne se code pas.
- **Une capacité entre dans le socle par un commit**, avec ses tests et sa
  page de démonstration. Son usage par le modèle v10 vient dans un autre.
- **La forme d'un fait.** Un fait du moteur de décision porte sa valeur et sa
  provenance dans le même objet : `{ value, provenance }`. Sans valeur, il est
  absent, et la provenance dit pourquoi. C'est la forme que l'éditeur décrit
  (`faitsTraces`). L'autre voie était une seconde fonction du modèle pour les
  provenances : le contrat gagnait un champ, et rien n'empêchait d'en oublier
  une. Codé ainsi, à confirmer.
- **La démonstration.** Le modèle de démonstration a maintenant trois règles
  publicodes : le lait tourne au contact du citron. Avec un café, le citron ne
  se propose pas : le fait est absent, et la mise en garde reste indéfinie.
  Avec un thé, il se propose : non coché, il vaut « non ».
- **La lecture seule : tranchée par la v10.0.1.** Une valeur connue est
  invisible par défaut. Elle est rappelée en texte si elle éclaire une
  question de la page, ou fixée près d'un champ de P3. Deux petites capacités
  la portent : le rappel et la donnée fixée. Le socle les réunit sous un
  seul nom, `reminder`, à deux formes : « donnée fixée » ne disait rien hors
  de la spec de l'éditeur.
- **Le pays : tranché par la v10.0.1.** Le prescripteur dit en P2 (Q2.2.5)
  si le départ ou l'arrivée est à l'étranger. L'adresse de P3 demande alors
  le pays, en texte libre, et lève la règle des cinq chiffres. Le type
  d'adresse du socle reçoit ce réglage du modèle, sans case à cocher.

## Problèmes restants

### En attente d'une réponse de l'éditeur

Levés par la v10.0.1, puis par la v10.0.2 pour les points 11 et 12. Le
texte d'origine reste pour mémoire.

1. ~~La lecture seule.~~ Tranchée : voir « Proposé, à confirmer ».
2. ~~Les deux blocages avant un résultat.~~ L'équipement bariatrique ne
   bloque plus rien, et les deux segments sont supprimés (D-80). Le constat
   d'origine : un équipement bariatrique
   incompatible avec le mode (avant la fin de P1), et deux segments
   incompatibles (avant R2). La validation croisée sait bloquer, mais la
   règle n'est pas écrite dans le livrable.

   Un segment est un sens du trajet : l'aller, ou le retour. Ce n'est pas une
   contradiction entre réponses, que le moteur de questionnaire empêche déjà.
   Le prescripteur peut déclarer un retour différent de l'aller (catalogue,
   ligne 487). Chaque segment est alors qualifié à part. S'ils ne donnent pas
   le même mode, le même financeur et le même document, le livrable demande
   de bloquer et de faire deux simulations.

   Le socle n'a aucune notion de segment : une réponse par question, une
   préconisation par simulation. Le YAML non plus : il reçoit un seul jeu de
   faits et un booléen `fait_seconde_branche_incompatible`. La comparaison des
   deux segments est donc laissée à l'application, qui devrait poser P2 deux
   fois et calculer deux préconisations. C'est plus qu'une question du modèle
   (D-46), et cela relève du chantier 10.

11. ~~Dessiner ou remplir.~~ Tranché par la v10.0.2 (D-84) : remplir les
    champs, puis aplatir, comme proposé le 12 octobre. Le soulignement est
    abandonné. Restent à contrôler chez nous : le PDF aplati dans un lecteur
    courant et à l'impression, et le S3141, dont un moteur de rendu affiche
    mal certains libellés d'après l'éditeur.
12. ~~Le texte trop long.~~ Écrit dans la v10.0.2 (D-85), ticket `TS1002-06`.
    Les quatre endroits qui demandaient de bloquer sont corrigés.

### Conception à arrêter

3. **L'adresse (D-60).** Moins lourd qu'annoncé. Quatre fichiers du socle
   manipulent une réponse. La comparaison de deux réponses accepte déjà un
   objet, et l'audience ne lit aucune réponse. Restent deux points : une
   question ne porte aujourd'hui qu'un message d'erreur, et l'adresse en
   demande un par champ ; le pays reste proposé (case « Adresse hors de
   France »).

Ouverts par la v10.0.2 :

13. ~~Ce que le modèle sait de ce qui a été demandé (D-86).~~ Tranché le
    13 octobre (D-88) : ni A, ni B, ni C telles quelles. Le socle remonte
    toutes les questions validées, avec leurs réponses ou leur absence. C'est
    l'option A en entier, sans état de plus. Le texte d'origine : pour dire
    « non », le modèle doit savoir qu'une option a été proposée et que sa
    page est validée. Il ne reçoit que les réponses. Les options proposées
    s'en déduisent, puisque `offeredIf` ne lit qu'elles. La validation ne
    s'en déduit pas toujours : une question facultative laissée vide ne
    laisse aucune réponse, validée ou non. À la fin du parcours, tout ce qui
    est demandé est validé, et les réponses suffisent. En cours de route, non.

    | Option | Ce qu'elle coûte |
    |---|---|
    | A. Le socle donne au modèle, avec les réponses, les questions validées et leurs options proposées | `preconisation.faits` reçoit un second argument : le contrat `Model` change, par ajout |
    | B. Le socle garde une réponse vide pour une question facultative validée | Rien au contrat. Mais « rien de coché » redevient une réponse, à rebours de ce que le moteur de questionnaire fait aujourd'hui |
    | C. Le modèle ne calcule ses faits qu'à la fin du parcours | Rien au socle. Mais une question ne peut plus dépendre d'une cible en cours de route, alors que Q2.3.4 dépend de `cible_question_urgence_requise` |

    Proposé : A. C'est la seule qui ne déforme ni les réponses ni le
    questionnaire.
14. **Une cible indéfinie à R2 (D-86).** Elle ne doit pas s'afficher comme
    une décision. Le socle ne sait pas laquelle des cibles est l'issue.
    Proposé : il transporte la cible indéfinie telle quelle, et c'est le
    résultat du modèle qui refuse de l'afficher. Un test de conformité vérifie
    qu'aucune seed du modèle n'arrive à R2 sans issue.
15. **Sortir du cadre, ou rétrécir dedans (D-85).** L'éditeur permet au texte
    de sortir de son cadre, sans recouvrir une autre cellule. Il faut alors
    connaître l'espace libre autour de chaque champ, que le mapping ne donne
    pas. Proposé : rester dans le cadre et réduire le corps jusqu'à ce que
    tout tienne. Rien n'est coupé ni recouvert, sans aucune position à
    relever. La lisibilité des cas extrêmes se juge à la recette papier (N5).
16. **Les gabarits (D-62).** Le package les porte depuis la v10.0.1, avec
    leur empreinte, et le mapping des champs y est lié. Proposé : prendre
    ceux du package, et remplacer D-62.
17. **La liste filtrable gelée (14).** L'éditeur garde la recherche d'acte
    dans le catalogue, pour une activation future. Proposé : ne pas la coder
    tant qu'aucune branche ne l'affiche.

Tranchés : la taille du texte vient d'un fichier de configuration du socle
(D-68), et la page de démonstration reste dans le factice, qui ne disparaît
plus (D-82). Le débordement sous le cadre (D-67) est remplacé par D-85.

### Demandes du livrable qu'un programme ne sait pas tenir

Non implémentées, et notées dans les points à remonter à l'éditeur.

8. **Rejeter un texte libre contradictoire** (Q3.4, Q3.5) : « toute nouvelle
   indication, nature d'acte, régime ou urgence contradictoire doit être
   rejetée ». Inchangé dans la v10.0.1 et dans la v10.0.2.
18. **Contrôler à l'œil le PDF produit** : la v10.0.2 demande un contrôle
    visuel automatisé des limites, des chevauchements et des glyphes, puis
    une recette humaine (N4). Le socle mesure le texte avant de l'écrire, et
    ses tests relisent le PDF. Comparer des images de pages n'est pas prévu.
9. ~~Vérifier le format postal local~~ : abandonné par l'éditeur, le code
   postal étranger est libre.
10. ~~Bloquer le PDF pour une adresse « clairement incompatible »~~ :
    abandonné par l'éditeur. Seule une contradiction certaine bloque, comme
    deux adresses identiques pour un même trajet.

### Résolu en regardant les gabarits

- **Le soulignement n'est plus nécessaire.** Les trois gabarits ont un champ
  de texte par type de lieu : « autre lieu » et « structure de soins », au
  départ et à l'arrivée, plus une case « domicile ». L'adresse s'écrit dans le
  champ du type retenu. Les rendus `underline_printed_label_and_shared_address`
  et `joined_address` du mapping répondaient aux spécimens sans champs. La
  v10.0.2 le confirme (D-84).

## Critères d'acceptation

- [ ] Chaque capacité a sa tâche, avec un test sur le factice.
- [ ] Aucune n'a modifié le type `Model`, sauf le fait à trois états, par
      ajout (D-88).
