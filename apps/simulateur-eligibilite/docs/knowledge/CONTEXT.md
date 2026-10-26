# Simulateur d'éligibilité : domaine

Glossaire des termes propres à ce contexte : le parcours de simulation d'éligibilité
au transport sanitaire, et son écran de rattachement.

Chaque terme dit ce que l'éditeur du modèle emploie pour la même notion
(« Chez l'éditeur »). Le vocabulaire a été arbitré au chantier 01 de la v10
(issue 51) : les numéros D-… renvoient au
[journal des décisions](adr/journal-des-decisions-v10.md).

## Language

### Le simulateur et ses modèles

**Socle**:
Ce qui ne dépend d'aucun modèle : le rattachement, les moteurs, le parcours,
l'analytics, les seeds, les outils PDF, les developer tools.
_Chez l'éditeur_: aucun mot. Le socle est de nous.

**Modèle**:
Tout ce qui change avec un livrable de l'éditeur : ses questions, ses faits, ses
règles, ses cibles, ses deux résultats et ses cerfa. Le simulateur en ouvre un
(D-20).
_Chez l'éditeur_: **faux ami**. Le « modèle » (« modèle exécutable », « modèle
Publicode ») y est le seul fichier publicodes, que nous appelons les règles.

**Modèle de l'éditeur**:
Le modèle d'éligibilité, tiré du livrable de l'éditeur. C'est lui qui s'ouvre au
démarrage (D-119).

**Modèle de démonstration**:
Un modèle écrit par nous, où chaque capacité du socle a sa page, pour la voir à
l'écran sans dépendre de l'éditeur (D-82).
_Avoid_: factice, réservé au petit modèle figé sur lequel les tests éprouvent le
socle.

**Règles**:
Le fichier publicodes du modèle, tel que l'éditeur le livre (D-20).
_Chez l'éditeur_: « YAML métier », « fichier exécutable » ; « modèle exécutable »
dans les premières livraisons de la v10.

**Livrable**:
Ce que l'éditeur dépose pour une version du modèle : les règles, les contrats,
les gabarits, l'oracle.
_Chez l'éditeur_: « package », « livraison ».

**Nomenclatures**:
Les corpus officiels des actes et des produits : CCAM, NGAP, NABM, LPP (D-21).
_Chez l'éditeur_: « référentiels ».
_Avoid_: référentiel, réservé au rattachement.

**Référentiel**:
La liste des établissements et des services que propose le rattachement (D-21).
_Chez l'éditeur_: **faux ami**. Ses « référentiels » sont nos nomenclatures.

**Prescripteur**:
Le professionnel devant l'écran : il répond aux questions, lit les résultats et
prescrit le transport (D-199).
_Chez l'éditeur_: « prescripteur », et encore « praticien » pour celui qui lit
le premier résultat. Il passe à « prescripteur » partout.
_Avoid_: praticien, utilisateur.

### Le rattachement

**Rattachement**:
L'établissement et le service que déclare un prescripteur avant d'accéder au
simulateur, sans aucune information sur qui il est. C'est une affiliation
organisationnelle déclarative, pas une identité.
_Chez l'éditeur_: aucun mot. Le rattachement n'est pas son « contexte fiable »
(D-74).
_Avoid_: Identification, identité. Ces mots sont réservés à une éventuelle
authentification individuelle future (ProConnect, AgentConnect), non implémentée.
Les employer pour le rattachement laisserait croire qu'une personne est identifiée.

**Rattachement dégradé**:
Le rattachement « Autre / Autre » donné d'office quand le référentiel ne répond pas.
Le prescripteur entre quand même dans le simulateur, et l'analytics range sa visite
sous « autre ».
_Avoid_: rattachement vide, anonyme. Il est bien là, simplement non renseigné.

**Établissement**:
Celui que le prescripteur déclare au rattachement (D-24).
_Chez l'éditeur_: **faux ami**. Notre établissement y est la « structure »
(du prescripteur). Son « établissement » est un lieu du trajet.

**Lieu de soins**:
Un lieu du trajet où le patient reçoit ses soins (D-24).
_Chez l'éditeur_: « lieu du soin », l'un des rôles d'un lieu, et
« établissement ».
_Avoid_: établissement, réservé au rattachement.

**Sens**:
L'aller, le retour, ou l'aller et le retour, que le document prescrit (D-198).
_Chez l'éditeur_: « sens », le même mot ; « segment » pour une portion de trajet.
_Avoid_: segment, réservé au texte médical.

### Le questionnaire

**Questionnaire**:
L'ensemble des questions d'un modèle, rangées en parties et en pages (D-19).
_Chez l'éditeur_: « parcours », ou « catalogue des pages et des questions ».
Son « questionnaire » est celui de satisfaction.

**Parcours**:
Le chemin d'un prescripteur dans le questionnaire, page après page, jusqu'aux
résultats (D-19).
_Chez l'éditeur_: « parcours », qui désigne aussi le questionnaire.

**Partie**:
Un grand temps du questionnaire, de P0 à P3. Le stepper compte les parties, pas
les pages.
_Chez l'éditeur_: « Partie 0 » à « Partie 3 », le même mot.

**Page**:
Un écran de questions, à l'intérieur d'une partie : P1/1, P2/trajet (D-26).
_Chez l'éditeur_: **faux ami**. « Page » y a trois sens : la « page physique »
(notre page), la « page de résultat » et la page d'un PDF.
_Avoid_: page pour une partie ou pour un résultat.

**Question**:
Ce qu'on demande au prescripteur, sous l'identifiant que lui donne l'éditeur :
Q1.1, Q2.3.4 (D-40).
_Chez l'éditeur_: « question », le même mot.

**Réponse**:
Ce que le prescripteur donne à une question. Elle ne compte qu'une fois sa page
validée.
_Chez l'éditeur_: « réponse », le même mot.

**Brouillon**:
Ce qui est saisi sur une page avant « Suivant ». Une saisie ne compte qu'une
fois la page validée.
_Chez l'éditeur_: « brouillon courant ».

**Verrou**:
Le geste « Compléter », qui fige P1, P2 et leur préconisation avant le
complément.
_Chez l'éditeur_: « verrou », « verrou R2→P3 ». Son « jeton de verrou », côté
serveur, n'a pas d'équivalent chez nous (D-64).

**Rappel**:
Un fait déjà connu, redit en bref avant la question qu'il éclaire. Il ne se
modifie pas là : on le corrige en revenant à la page où il a été répondu (D-194).
_Chez l'éditeur_: « rappel », « rappel contextuel » (le traitement R).
_Avoid_: réponse déduite. « Déduit » se dit d'une réponse qu'on ne demande plus,
tirée d'une autre.

**Complément**:
La partie d'après le verrou, P3, qui recueille ce que le cerfa demande en plus.
_Chez l'éditeur_: **faux ami**. P3 y est la « complétion » (« compléter la
prescription »). Son « complément » est celui d'une adresse.

**Simulation**:
Un passage complet dans le simulateur, fait en une fois, sur le modèle chargé à
l'ouverture. Elle ne se partage pas et ne se reprend pas (D-104).
_Chez l'éditeur_: « simulation ». Sa « révision » n'a pas d'équivalent chez nous
(D-192).

### La décision

La chaîne : Questions → Faits → Cibles → Résultats.

**Fait**:
Ce que les réponses validées établissent, sous le nom que lui donne l'éditeur
(`fait_*`), avec sa provenance (D-12). Il vaut oui, non, ou reste inconnu. Un
fait inconnu ne vaut jamais « non » (D-86).
_Chez l'éditeur_: « fait », le même mot.

**Provenance**:
Ce qui établit un fait : la réponse qui le donne, ou la raison qui le rend sans
objet (D-87).
_Chez l'éditeur_: « provenance ».

**Cible**:
Une valeur que les règles calculent à partir des faits, sous le nom que lui
donne l'éditeur (`cible_*`) (D-12). Elle peut rester inconnue, ou être sans
objet.
_Chez l'éditeur_: « cible », le même mot.
_Avoid_: sortie, output, target (D-25).

**Cible documentaire**:
Une valeur que le cerfa écrit (D-197). Elle a deux origines : une projection des
faits, qui est une cible comme les autres, ou une réponse du complément, que le
cerfa met en forme.
_Chez l'éditeur_: « cible documentaire », le même mot. Celles qui viennent du
complément ne sont pas dans ses règles.

**Préconisation**:
L'ensemble des cibles d'une simulation. Les cibles ne servent pas à la calculer :
elles la composent (D-11, D-16).
_Chez l'éditeur_: « décision », « instantané ».
_Avoid_: décision, sortie.

**Issue**:
La conclusion d'une préconisation, une parmi dix : `ISSUE_PMT`,
`ISSUE_NON_ELIGIBLE`… (D-16).
_Chez l'éditeur_: « issue », le même mot.

**Mode**:
Le mode de transport que la préconisation retient : ambulance, TAP, TPMR,
transport en commun, véhicule personnel.
_Chez l'éditeur_: « mode », le même mot.

**Support**:
Le cerfa que la préconisation retient : S3138g, S3139h, S3141, ou aucun.
_Chez l'éditeur_: « support », le même mot.

**Financeur**:
Celui qui paie le transport, selon la préconisation : l'Assurance maladie,
l'établissement, le patient, ou pas encore conclu.
_Chez l'éditeur_: « financeur », le même mot.

**Moteur de décision**:
Ce qui calcule les cibles des faits, par les règles publicodes du modèle (D-32).
_Chez l'éditeur_: aucun mot. Son « noyau de décision » est le fichier des
règles.

**Moteur de questionnaire**:
Ce qui dit, des réponses, quelles pages et quelles questions se posent (D-32).
_Chez l'éditeur_: aucun mot.
_Avoid_: « moteur » seul, réservé au moteur de décision.

### Les résultats et les documents

**Résultat**:
L'un des deux écrans qui concluent : R2, le premier résultat, après P2, et R3, le
second résultat, après le complément (D-11, D-17).
_Chez l'éditeur_: « page de résultat » ou « résultat de l'éligibilité » pour
R2, « page finale » pour R3.
_Avoid_: sortie (D-25), page (D-26).

**Trace du résultat**:
Ce que les textes du premier résultat lisent des réponses et des cibles. Rien
n'en est conservé (D-111, D-195).
_Chez l'éditeur_: « trace d'audit », « trace technique », que décrit son
« contrat de trace ». La sienne porte en plus la version du paquet et la
révision.
_Avoid_: trace, seule (D-23) ; trace d'audit, réservé à celle de l'éditeur.

**Fiche patient**:
Ce que le premier résultat donne à remettre au patient, positive ou négative.
Cinq issues n'en ont pas.
_Chez l'éditeur_: « fiche patient », le même mot.

**Cerfa**:
Le formulaire que remplit le second résultat : la PMT (S3138g), la DAP (S3139h)
ou le S3141, même si ce dernier n'a pas de numéro Cerfa (D-18).
_Chez l'éditeur_: « support » pour le formulaire que la préconisation retient,
« formulaire » pour le PDF officiel, « document » pour le PDF rempli. Son
« Cerfa » est le numéro officiel (11574*07).

**Gabarit**:
Le PDF vierge d'un cerfa, que le second résultat remplit.
_Chez l'éditeur_: « gabarit ».

**Rubrique**:
Une section imprimée d'un cerfa, qu'un autre cerfa peut reprendre : l'accident,
le trajet, la prescription (D-138).
_Chez l'éditeur_: « rubrique », le même mot.

**Cellule**:
Une zone imprimée d'un cerfa, qu'elle soit un champ du PDF ou non.
_Chez l'éditeur_: « cellule », le même mot.

**Volet**:
Une page à renseigner d'un cerfa. Un même champ se recopie sur chaque volet
(D-185).
_Chez l'éditeur_: « volet », le même mot.

**Segment**:
Un morceau du texte médical du cerfa : le soin, un besoin, un critère
d'ambulance. Les segments se joignent par « ; » (D-141, D-198).
_Chez l'éditeur_: **faux ami**. « Segment » y désigne aussi une portion de
trajet et une étape du stepper.
_Avoid_: segment pour un trajet, dire l'aller, le retour ou le sens.

### Les outils de l'équipe

**Seed**:
Une situation de référence : des réponses nommées et ce qu'on en attend. Elle se
rejoue dans les tests et s'ouvre à l'écran.
_Chez l'éditeur_: aucun mot.

**Catalogue des seeds**:
Les seeds d'un modèle. « Catalogue » ne s'emploie jamais seul (D-22).
_Chez l'éditeur_: **faux ami**. Son « catalogue » est celui des questions.

**Oracle**:
Les cas de l'éditeur (D01, D02…), écrits en faits, dont l'attendu est une issue.
Chaque cas a sa seed (D-57, D-79).
_Chez l'éditeur_: « oracle », le même mot.

**Trace de debug**:
Ce que les developer tools montrent sous le questionnaire et les résultats : les
pages, les réponses, les faits. Rien n'est conservé (D-23).
_Chez l'éditeur_: aucun mot.
_Avoid_: trace, seule.

**Developer tools**:
Les outils internes, ouverts au seul service produit : la trace de debug, l'écran
des seeds, le choix du modèle.
_Chez l'éditeur_: aucun mot.
