# 09: Capacités du socle pour la v10

**What to build:** ce que la v10 demande au socle et qu'il ne sait pas encore
faire. Chaque capacité est générique, testée sur le factice, et n'ajoute rien
au contrat `Model`.

**Blocked by:** 06 (le parcours).

**Status:** le modèle de démonstration (D-82) est en place, et les neuf
petites capacités de saisie (1 à 9) sont codées, avec leur page et leur seed.
Restent 12 capacités sur les 21 de l'inventaire : 10 ne dépendent pas de la
v10.0.2, 2 l'attendent.

## Décisions prises

- **D-60** L'adresse est un type de question du socle. Sa réponse est un
  objet, et le type `Answer` s'élargit.
- **D-61** Un texte trop long ne bloque jamais le PDF. Le socle applique les
  règles de l'éditeur tant qu'elles suffisent. Si le texte ne tient toujours
  pas, il est écrit en entier et déborde du cadre, comme sur un formulaire
  papier. L'éditeur l'a accepté à l'oral (rapporté le 12 octobre). Son
  livrable demande encore de bloquer : la mise à jour lui est demandée.
- **D-62** Les gabarits sont ceux de Notion, « 05. LIVRABLES » :
  `PMT_cerfa_11574-07`, `DAP_cerfa_11575-08` et celui des moins de 20 ans.
  Les PDF du dossier `formulaires/` du livrable ne servent pas.
- **D-63** Avant de déborder, le socle applique les seules règles
  automatiques : réduire le corps jusqu'au plancher (9 pt visés, 8 pt au
  minimum), puis retirer le commentaire facultatif en prévenant le
  prescripteur. La reformulation à valider n'est pas reprise : depuis D-61,
  elle ne débloque plus rien.
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
- **D-67** Un texte qui déborde continue sous son cadre, quitte à recouvrir
  ce qui s'y trouve.
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
  seule liste de modèles, chacun sous le nom que `Main` lui donne, et les
  developer tools proposent d'en changer quand il y en a plusieurs.

- **D-77** Un fait inconnu n'est pas transmis au moteur (éditeur).
- **D-80** Un seul sens par simulation (éditeur). Le socle n'a pas à porter
  de segment.

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

## Ce que ces décisions entraînent

- **D-60.** Une réponse n'est plus seulement une chaîne, un nombre ou une
  liste. La comparaison de deux réponses, l'effacement des dépendances, les
  seeds et la trace doivent accepter un objet. Les règles postales françaises
  entrent dans le socle.
- **D-61.** `fillCerfa` lève aujourd'hui `TextOverflowError` et ne produit
  aucun PDF. Cette règle s'inverse. Un champ AcroForm coupe ce qui dépasse de
  son cadre : pour déborder, le texte se dessine sur la page, hors du champ.
  L'écran « PDF bloqué » sort de l'inventaire.

## Inventaire

Tiré de `CONTRAT_SAISIES_ET_PAGES.md`, `SPECIFICATION_NAVIGATION.md`,
`COMPLETION_DOCUMENTS.md`, `mapping_documents.json` et du catalogue des
questions, puis confronté au socle.

### Ce que le socle sait déjà faire

| Besoin de la v10 | Dans le socle |
|---|---|
| Sous-questions conditionnelles sur la même page (Q2.1.a à k, Q2.6, Q2.8) | `askedIf` par question, plusieurs questions par page |
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
| Le choix du modèle | Fait dans le socle, sans le mot « démonstration » (D-83) : `App` reçoit `models`, une liste `{ label, load }`, et ouvre le premier. À plusieurs, les developer tools montrent un bouton par modèle, coché pour celui qui est ouvert. Rien n'est rechargé ni stocké. `Main.tsx` n'en liste qu'un tant que `eligibilite/` n'existe pas : d'ici là, il n'y a pas de bouton. |
| Les gardes | Fait : aucun modèle n'importe l'autre, le test de conformité passe sur chaque dossier de `front/models/`, `verifier-bundle` lit le catalogue de seeds de chacun. |

L'audience n'a rien demandé : seul le service n° 4 voit les developer tools,
et Matomo reçoit le service avec chaque évènement. Une simulation de
démonstration se range donc déjà à part.

### Ce qui manque, sans dépendre de la v10.0.2

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
| 10 | Rappel d'une valeur connue | les repères « R » de `SPECIFICATION_REAFFICHAGE_FAITS.md` : Q2.1, Q2.1.f, Q2.2.1, Q2.5, Q2.6, Q2.13, Q2.14 | 10.0.1 | Une page ne contient que des questions. Il faut un texte hors des réponses, affiché seulement si la page pose encore une question. | petit |
| 11 | Donnée fixée près d'un champ | les repères « D » : Q3.2, Q3.3, Q3.4, Q3.7, Q3.8 | 10.0.1 | Rien : le rôle et la nature d'un lieu se lisent à côté des champs d'adresse, sans sélecteur. | petit |
| 12 | Adresse, type du socle (D-60) : champs séparés, code postal français, mode étranger donné par le modèle | Q3.2, Q3.3, Q3.8 | les deux, pays revu en 10.0.1 | Aucun type. La réponse devient un objet. | moyen |
| 13 | Validation croisée, un message par incohérence | début avant fin (Q2.8), code postal selon le pays, extrémité contre le lieu verrouillé, deux adresses identiques pour un même trajet, groupe de Q2.2.1 coché sans précision | les deux | `errorOf` ne voit qu'une réponse. | moyen |
| 14 | Liste filtrable (D-65) | Q2.1.c, Q2.1.d | les deux | Rien. Une vingtaine d'options embarquées, filtrées sur le libellé et les synonymes, accessible au clavier, avec « je ne trouve pas ». Aucun chargement à la demande. | moyen |
| 15 | Impression de la fiche | R2 | les deux | `printLabel` n'est pas lu. | petit |
| 16 | Production, téléchargement et impression du PDF, avec la date de complétion figée | R3 | les deux | `downloadLabel`, `template` et `mapping` ne sont pas lus. C'est le reste du chantier 06. | moyen |
| 17 | Taille du texte en configuration (D-68) | adresses, texte médical | les deux | Le livrable vise 9 pt, plancher 8 pt. `text-fit.ts` a 10 et 6 en constantes. | petit |
| 18 | Texte trop long : règles de l'éditeur, puis débordement sous le cadre (D-61, D-63, D-67) | adresses, texte médical | les deux | `fillCerfa` refuse aujourd'hui d'écrire. | moyen |
| 19 | PDF de sortie statique, sans champ interactif | PMT et DAP | 10.0.1 | Les champs restent dans le PDF produit. `form.flatten()` de `pdf-lib` les retire : essayé sur la PMT (53 champs, puis 0) et la DAP (56, puis 0). La méthode attend l'éditeur : voir « Problèmes restants ». | petit si on aplatit |

### Ce qui attend la v10.0.2

| N° | Capacité | Demandée par | Écart | Pourquoi attendre | Poids |
|---|---|---|---|---|---|
| 20 | Fait inconnu (D-77) | tout P2 | Le moteur de décision reçoit des faits tous renseignés. Il doit accepter un fait absent et rendre une cible indéfinie. | L'éditeur ajoute des tests avec des faits inconnus, et déconseille de se fier aux seules variables manquantes. | moyen |
| 21 | Provenance des faits dans la trace, et son export pour la recette | la recette de l'éditeur | Rien. | Le contrat réponses/faits est corrigé dans la v10.0.2. | petit |

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
  v10.0.1 demande l'inverse pour la PMT et la DAP : voir « Problèmes
  restants ».
- **Le mapping.** 182 lignes, sans aucune coordonnée : chaque cellule est
  décrite en prose. Écrire sur les PDF sans champs demande de relever chaque
  position, volet par volet.
- **Les sept rendus.** `checkbox` (74), `text` (39), `joined_address` (36),
  `date_fr` (12), `underline_printed_label_and_shared_address` (12),
  `checkbox_expression` (6), `integer` (3). Tous sont du calcul, que le mapping
  du modèle fait avec `textFrom` et `formatDateForField`. Le soulignement
  n'est plus nécessaire : voir « Problèmes restants ».
- **Le corps du texte.** Le livrable vise 9 pt, plancher 8 pt. Le socle a 10 et
  6 en constantes.

### Hors de ce chantier

- Le verrou serveur : l'éditeur l'a retiré du livrable (D-64). Le socle ne
  garde rien entre deux chargements et n'a pas d'URL par écran : recharger
  recommence une simulation, sans garde à écrire.
- Le retour différent (Q2.12) et les deux simulations : une question du modèle,
  pas une capacité.
- La concaténation d'une adresse et la composition du texte médical : le
  mapping du modèle.

## Proposé, à confirmer

- **L'ordre va du plus petit au plus lourd.** Après le modèle de
  démonstration (D-82), les petites capacités de saisie (1 à 9), puis le
  rappel et la donnée fixée (10, 11), puis l'adresse, la validation croisée et
  la liste filtrable (12 à 14), enfin les résultats et le PDF (15 à 19), une
  fois la méthode du PDF statique arrêtée avec l'éditeur.
- **Une capacité entre dans le socle par un commit**, avec ses tests et sa
  page de démonstration. Son usage par le modèle v10 vient dans un autre.
- **La lecture seule : tranchée par la v10.0.1.** Une valeur connue est
  invisible par défaut. Elle est rappelée en texte si elle éclaire une
  question de la page, ou fixée près d'un champ de P3. Deux petites capacités
  la portent : le rappel et la donnée fixée.
- **Le pays : tranché par la v10.0.1.** Le prescripteur dit en P2 (Q2.2.5)
  si le départ ou l'arrivée est à l'étranger. L'adresse de P3 demande alors
  le pays, en texte libre, et lève la règle des cinq chiffres. Le type
  d'adresse du socle reçoit ce réglage du modèle, sans case à cocher.

## Problèmes restants

### En attente d'une réponse de l'éditeur

Levés par la v10.0.1. Le texte d'origine reste pour mémoire.

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

11. **Dessiner ou remplir.** Pour la PMT et la DAP, `COMPLETION_DOCUMENTS.md`
    de la v10.0.1 demande de retirer les champs du PDF de sortie et de
    dessiner textes, marques et soulignements d'après le mapping. Pour le
    S3141, il garde les champs, sauf l'adresse d'un « autre lieu » ou d'une
    « structure de soins », écrite dans une zone commune avec le libellé
    souligné. Le mapping ne donne aucune coordonnée : dessiner demande de
    relever 129 positions. Proposé à l'éditeur le 12 octobre : remplir les
    champs, puis aplatir le PDF (capacité 19), et abandonner le soulignement.
    Restent à contrôler, s'il accepte : le PDF aplati dans un lecteur courant
    et à l'impression, et que chaque ligne du mapping a son champ. Ticket
    Notion : « v10 : les PDF des cerfa du livrable ne sont pas les bons
    gabarits ».
12. **Le texte trop long.** L'accord est oral (D-61). Le livrable demande
    encore de bloquer le PDF, en quatre endroits. Ticket Notion : « v10 : un
    texte trop long déborde du cadre du cerfa, sans bloquer le PDF ».

### Conception à arrêter

3. **L'adresse (D-60).** Moins lourd qu'annoncé. Quatre fichiers du socle
   manipulent une réponse. La comparaison de deux réponses accepte déjà un
   objet, et l'audience ne lit aucune réponse. Restent deux points : une
   question ne porte aujourd'hui qu'un message d'erreur, et l'adresse en
   demande un par champ ; le pays reste proposé (case « Adresse hors de
   France »).

Tranchés : le débordement va sous le cadre (D-67), la taille du texte vient
d'un fichier de configuration du socle (D-68), la liste filtrable s'écrit dans
le socle, et la page de démonstration reste dans le factice, qui ne disparaît
plus (D-82).

### Demandes du livrable qu'un programme ne sait pas tenir

Non implémentées, et notées dans les points à remonter à l'éditeur.

8. **Rejeter un texte libre contradictoire** (Q3.4, Q3.5) : « toute nouvelle
   indication, nature d'acte, régime ou urgence contradictoire doit être
   rejetée ». Inchangé dans la v10.0.1.
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
  v10.0.1 redemande pourtant le soulignement : voir le point 11.

## Critères d'acceptation

- [ ] Chaque capacité a sa tâche, avec un test sur le factice.
- [ ] Aucune n'a modifié le type `Model`.
