# Journal des versions

Ce qui change d'une version à l'autre. Le titre renvoie à la release GitHub ;
chaque ligne renvoie à son commit et commence par un verbe, comme le sujet du
commit lui-même.

Le simulateur affiche en bas de page la version qu'il exécute, le commit déployé
et la version du modèle de règles.

## [1.3.0](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%401.3.0), 18 novembre 2026

Le journal des parcours passe de Grist à PostgreSQL, avec une lecture ouverte
au futur tableau de bord, et chaque question s'ouvre sous la réponse qui la
déclenche. 9 commits depuis la 1.2.0.

### TL;DR

- Le journal des parcours s'écrit dans la base PostgreSQL de Scalingo (`SCALINGO_POSTGRESQL_URL`) et plus dans Grist ; ses tables se créent au démarrage, sans reprise de l'historique.
- Le tableau de bord lit le journal page par page par `GET /api/journal/v1/events`, avec le jeton `JOURNAL_READ_TOKEN`.
- Une réponse choisie ouvre juste sous elle le panneau des questions qu'elle déclenche, en P2 comme en P3.
- Q3.4 ne demande plus de précision libre sur le soin et le trajet.

### ✨ Nouveautés

- [d01ae8c](https://github.com/betagouv/transport-sanitaire/commit/d01ae8c) : écrit le journal des parcours dans PostgreSQL : un nouvel adaptateur du port, trois tables créées à la première requête, l'événement entier en `jsonb` ; `SCALINGO_POSTGRESQL_URL` remplace `JOURNAL_GRIST_DOC_URL`, et l'adaptateur Grist du journal est retiré.
- [8b76659](https://github.com/betagouv/transport-sanitaire/commit/8b76659) : ouvre la lecture du journal au tableau de bord : `GET /api/journal/v1/events`, page par page par curseur, derrière le jeton `JOURNAL_READ_TOKEN` ; sans jeton, la route n'existe pas.
- [92901b0](https://github.com/betagouv/transport-sanitaire/commit/92901b0) : ouvre le panneau d'une question sous chacun de ses déclencheurs : une question à plusieurs déclencheurs se pose sous le premier devenu effectif, et passe sous le suivant, sa réponse gardée, quand on retire le sien.
- [b601e0b](https://github.com/betagouv/transport-sanitaire/commit/b601e0b) : place les questions de P2 sous leur déclencheur, d'après l'inventaire des panneaux de l'éditeur ; l'urgence, Q2.3.4, a une place par motif d'accord préalable.
- [6e9744c](https://github.com/betagouv/transport-sanitaire/commit/6e9744c) : place les champs de P3 sous leur déclencheur : le nombre de trajets sous le sens choisi, les champs d'un lieu sous sa catégorie, au départ comme à l'arrivée.
- [af988f6](https://github.com/betagouv/transport-sanitaire/commit/af988f6) : retire la précision générique facultative de Q3.4 : le prescripteur réécrit la cellule médicale en R3 s'il veut préciser.

### ♻️ Sous le capot

- [da02d04](https://github.com/betagouv/transport-sanitaire/commit/da02d04) : nomme les absences des panneaux et hisse l'aide de Q2.3.4, pour les règles de lisibilité.

### ✅ Tests

- [6e15652](https://github.com/betagouv/transport-sanitaire/commit/6e15652) : rapporte les 63 lignes de l'inventaire des panneaux de l'éditeur aux questions du modèle : aucune question n'en sort, sauf le côté de l'USLD ou de l'EHPAD.

### 📝 Documentation

- [53bb8a1](https://github.com/betagouv/transport-sanitaire/commit/53bb8a1) : note le retrait de la précision générique de Q3.4 au journal des décisions (D-305).

## [1.2.0](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%401.2.0), 17 novembre 2026

Le modèle v10.2.1 puis v10.2.2 de l'éditeur, la réécriture des textes qui ne
tiennent pas sur le cerfa, et le journal des parcours selon le contrat
analytics v10.2.2. 38 commits depuis la 1.1.0.

### TL;DR

- Le simulateur suit le modèle v10.2.2 : un trajet à l'étranger sans motif d'accord préalable va vers la caisse, et un trajet en avion ou bateau de ligne demande et affiche sa partie terrestre.
- Une cellule médicale ou une précision sur l'urgence qui ne tient pas sur le cerfa se réécrit en R3 avant d'imprimer ; Q3.5 compte ses caractères et demande « Précisez l'urgence. » quand elle reste vide.
- Q1.3, Q1.3.b et Q3.4.a prennent les libellés de la v10.2.0, et les blocages de Q2.13 et Q2.14 proposent « Faire une nouvelle simulation ».
- Le journal des parcours suit le contrat analytics v10.2.2 de l'éditeur, et la collecte en vérifie les 26 règles ; un onglet ouvert avant le déploiement ne journalise plus rien jusqu'à son rechargement.
- Un établissement ou un service saisi à la main part au journal sous son vrai identifiant dès la première visite ; un événement hors du référentiel est mis en quarantaine.

### ✨ Nouveautés

- [3fcbbfb](https://github.com/betagouv/transport-sanitaire/commit/3fcbbfb) : intègre le modèle v10.2.1 : un trajet à l'étranger sans motif d'accord préalable va vers la caisse, sans document ; avec un motif, il reste à examiner sur la DAP.
- [1ef1707](https://github.com/betagouv/transport-sanitaire/commit/1ef1707) : demande la partie terrestre d'un trajet en avion ou bateau de ligne, sous la case de la ligne régulière, et l'ajoute à la fiche avec ses étapes et les badges de son mode.
- [6166372](https://github.com/betagouv/transport-sanitaire/commit/6166372) : suit les libellés de la v10.2.0 : titre et ordre des réponses de Q1.3, lien avec l'ALD précisé en Q1.3.b, aide retirée de Q3.4.a.
- [0b2f8ac](https://github.com/betagouv/transport-sanitaire/commit/0b2f8ac) : propose « Faire une nouvelle simulation » quand « aller et retour différents » (Q2.13) ou « deux déplacements différents » (Q2.14) bloquent ; Q2.14 dit « Ces deux déplacements nécessitent deux simulations distinctes. »
- [1acebac](https://github.com/betagouv/transport-sanitaire/commit/1acebac) : garde dans la simulation les textes réécrits pour le cerfa ; une nouvelle simulation repart sans.
- [06866a6](https://github.com/betagouv/transport-sanitaire/commit/06866a6) : fait réécrire en R3 la cellule médicale qui ne tient pas sur la PMT ou la DAP : compteur, « Valider » seulement quand le texte tient, impression et téléchargement suspendus, aperçu marqué « Aperçu – texte à valider » en attendant.
- [554bf3f](https://github.com/betagouv/transport-sanitaire/commit/554bf3f) : demande « Précisez l'urgence. » sous Q3.5 laissée vide, à la place du message générique.
- [ffd411c](https://github.com/betagouv/transport-sanitaire/commit/ffd411c) : fait raccourcir la précision sur l'urgence qui ne tient pas sur une ligne des volets des deux cerfas : Q3.5 compte ses caractères, R3 ouvre l'éditeur avant d'imprimer.
- [f3b9b4f](https://github.com/betagouv/transport-sanitaire/commit/f3b9b4f) : écrit l'établissement et le service de chaque événement en deux colonnes du journal, pour les lire sans ouvrir le JSON de la simulation.
- [9471809](https://github.com/betagouv/transport-sanitaire/commit/9471809) : écrit ces deux colonnes en JSON, prêtes à exploiter.
- [73ce8c4](https://github.com/betagouv/transport-sanitaire/commit/73ce8c4) : envoie au journal la composition du transport, terrestre, ligne régulière seule ou mixte, calculée par le modèle et non plus tirée du texte affiché.
- [d2efd2f](https://github.com/betagouv/transport-sanitaire/commit/d2efd2f) : mesure chaque texte du cerfa sous l'identifiant de champ fixé par l'éditeur ; la structure et l'adresse d'une extrémité comptent pour un champ.
- [3017f99](https://github.com/betagouv/transport-sanitaire/commit/3017f99) : envoie pour chaque version du cerfa les champs remplis et leur taille imprimée ; la collecte refuse un champ hors liste, et ne garde qu'une mesure par document.
- [a408258](https://github.com/betagouv/transport-sanitaire/commit/a408258) : envoie les boutons Imprimer et Télécharger de la fiche patient et du cerfa sous leurs noms du contrat, vus puis cliqués ; sur le cerfa, l'impression ou le téléchargement lancés partent à part du clic.
- [8e9901a](https://github.com/betagouv/transport-sanitaire/commit/8e9901a) : n'envoie plus au journal ce que le contrat ne prévoit pas : noms de l'établissement et du service, financeur, motifs, chargement de la page, question invalidée.
- [d27fd11](https://github.com/betagouv/transport-sanitaire/commit/d27fd11) : envoie la première et la dernière page affichées de chaque phase, une fois chacune.
- [b05fe20](https://github.com/betagouv/transport-sanitaire/commit/b05fe20) : envoie avec chaque événement la version du contrat, du modèle et de l'app, son rang dans la simulation, et s'il vient d'un geste du prescripteur ; « Faire une nouvelle simulation » ferme la précédente.
- [356d54a](https://github.com/betagouv/transport-sanitaire/commit/356d54a) : envoie toujours l'issue et le support du premier résultat ; un résultat dont les règles ne les donnent pas ne part plus.
- [e6690f5](https://github.com/betagouv/transport-sanitaire/commit/e6690f5) : distingue la révision du cerfa de sa version : une page de P3 validée qui change les réponses invalide le document, une autre mise en page du même document n'en change que la version.
- [649cdda](https://github.com/betagouv/transport-sanitaire/commit/649cdda) : fait vérifier par la collecte les 26 règles du contrat v10.2.2 ; un envoi hors contrat, comme celui d'un onglet ouvert avant le déploiement, est refusé.
- [6d19ab6](https://github.com/betagouv/transport-sanitaire/commit/6d19ab6) : fait enregistrer au référentiel l'établissement ou le service saisi à la main, et renvoyer son identifiant.
- [e1aff4d](https://github.com/betagouv/transport-sanitaire/commit/e1aff4d) : attend, 5 secondes au plus, l'identifiant d'un établissement ou d'un service saisi à la main, avec « Ouverture du simulateur… » sur le bouton ; sans réponse du référentiel, le prescripteur entre sans identifiant plutôt que sous « Autre ».
- [62f73f7](https://github.com/betagouv/transport-sanitaire/commit/62f73f7) : met en quarantaine un événement dont l'établissement est inconnu du référentiel, ou dont le service n'est pas sous son établissement.

### 🐛 Corrections

- [b815d0a](https://github.com/betagouv/transport-sanitaire/commit/b815d0a) : retire le message d'erreur de la cellule médicale dès que le texte tient.
- [7d60b56](https://github.com/betagouv/transport-sanitaire/commit/7d60b56) : range la partie terrestre comme l'éditeur : après la ligne régulière, sous « Pour la partie terrestre du trajet », sans badge sur la ligne.
- [1756b21](https://github.com/betagouv/transport-sanitaire/commit/1756b21) : retire des exports que plus rien ne lit ; rien ne change à l'écran.

### ♻️ Sous le capot

- [bb837f2](https://github.com/betagouv/transport-sanitaire/commit/bb837f2) : fait des fabriques du questionnaire des classes nommées ; aucun comportement ne change.
- [ccda8e4](https://github.com/betagouv/transport-sanitaire/commit/ccda8e4) : donne un objet valeur à l'identifiant d'une question ; aucun comportement ne change.
- [1309f3a](https://github.com/betagouv/transport-sanitaire/commit/1309f3a) : garde privé le message de l'éditeur de la cellule.
- [43d87a1](https://github.com/betagouv/transport-sanitaire/commit/43d87a1) : recopie le modèle v10.2.2, aux règles identiques à la v10.2.1 ; seules les métadonnées du catalogue changent.
- [fec23af](https://github.com/betagouv/transport-sanitaire/commit/fec23af) : ne garde plus les noms de l'établissement et du service saisis, que le journal n'écrit plus.

### ✅ Tests

- [24efa79](https://github.com/betagouv/transport-sanitaire/commit/24efa79) : retire la version du modèle du titre d'un test de Q1.3.
- [36ec0b2](https://github.com/betagouv/transport-sanitaire/commit/36ec0b2) : retire la version du contrat des titres de deux tests.

### 📝 Documentation

- [274c18f](https://github.com/betagouv/transport-sanitaire/commit/274c18f) : écrit QUAL-018 et QUAL-019 : un fichier dit son rôle par son suffixe, et hors de React une notion est une classe.
- [a706f2b](https://github.com/betagouv/transport-sanitaire/commit/a706f2b) : écrit un ADR par fichier, et l'ADR-0052 sur le sens des dépendances du socle.
- [dacad97](https://github.com/betagouv/transport-sanitaire/commit/dacad97) : note le cadrage de l'éditeur de la cellule médicale (D-302 à D-304).
- [4cbc7a6](https://github.com/betagouv/transport-sanitaire/commit/4cbc7a6) : retire le badge de la seed du trajet mixte.
- [b5129b6](https://github.com/betagouv/transport-sanitaire/commit/b5129b6) : décrit l'attente des identifiants saisis, la quarantaine et la table Grist à créer.

## [1.1.0](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%401.1.0), 16 novembre 2026

Deux correctifs de l'audit de production du 16 novembre, l'urgence du cerfa et
la sortie du blocage de l'aller-retour différent, et de quoi voir une collecte
qui tombe. 7 commits depuis la 1.0.1.

### TL;DR

- Sur une demande d'accord préalable urgente sans appel au Centre 15 établi, le cerfa coche « autres » et écrit la précision saisie.
- Le blocage « aller-retour différent » de l'étape de prescription propose « Faire une nouvelle simulation ».
- Un journal des parcours qui cesse d'écrire se voit dans l'heure, et un envoi refusé pour débit est réessayé.
- Des parcours sont rejoués dans de vrais navigateurs à chaque PR.

### ✨ Nouveautés

- [144371f](https://github.com/betagouv/transport-sanitaire/commit/144371f) : propose « Faire une nouvelle simulation » quand « aller-retour différent » bloque l'étape de prescription : le bouton ouvre une simulation vide et garde l'établissement.
- [2878080](https://github.com/betagouv/transport-sanitaire/commit/2878080) : signale une collecte qui tombe : un appel à Grist est abandonné au bout de dix secondes, le navigateur réessaie un envoi refusé pour débit, et un contrôle interroge chaque heure le signe de vie du journal en production.

### 🐛 Corrections

- [08a9323](https://github.com/betagouv/transport-sanitaire/commit/08a9323) : coche « autres » et écrit la précision de l'urgence sur la demande d'accord préalable quand l'urgence est attestée sans appel au Centre 15 établi ; la case du Centre 15 reste vide.
- [2db1133](https://github.com/betagouv/transport-sanitaire/commit/2db1133) : rétablit les tests du dialogue avec la page hôte, que la montée de happy-dom faisait échouer ; rien ne change à l'écran.

### ♻️ Sous le capot

- [61d6052](https://github.com/betagouv/transport-sanitaire/commit/61d6052) : renomme `test:navigateur` le script des parcours en navigateur, pour le trouver à côté de `test`.

### ✅ Tests

- [bc0b8bb](https://github.com/betagouv/transport-sanitaire/commit/bc0b8bb) : déroule six parcours dans Chromium et WebKit, le simulateur servi dans l'iframe d'une page d'une autre origine comme en production : rattachement, premier résultat, fiche en PDF, étape de prescription, thème et refus de la mesure d'audience.
- [3ea7739](https://github.com/betagouv/transport-sanitaire/commit/3ea7739) : fait échouer la suite quand une question entre dans le modèle sans que ses dépendances envers les autres réponses aient été pesées.

## [1.0.1](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%401.0.1), 16 novembre 2026

La garde de l'API contre les abus, une suite de tests stable et le moteur du
questionnaire rangé par rôle. 3 commits depuis la 1.0.0.

### TL;DR

- L'API refuse une écriture venue d'un autre site, limite les écritures par adresse IP et par minute, et plafonne la taille de ce qu'elle reçoit.
- Rien ne change à l'écran pour le prescripteur, hors le nom saisi sous « Autre », borné à 150 caractères.
- Le moteur du questionnaire et la simulation sont rangés par rôle, sans changement de comportement ; la suite de tests ne dépasse plus ses délais.

### ✨ Nouveautés

- [756fe9d](https://github.com/betagouv/transport-sanitaire/commit/756fe9d) : protège l'API contre les abus : une écriture venue d'un autre site reçoit un 403, chaque adresse IP a droit à 60 rattachements et 600 événements par minute, un envoi ne dépasse pas 32 ko et le nom saisi sous « Autre » 150 caractères.

### ♻️ Sous le capot

- [6ce3a29](https://github.com/betagouv/transport-sanitaire/commit/6ce3a29) : range la simulation, le moteur de décision et le moteur du questionnaire par rôle (entité, objet valeur, service, use case), et nomme « réponses possibles » les options d'une question ; aucun comportement ne change.

### ✅ Tests

- [a5caf5b](https://github.com/betagouv/transport-sanitaire/commit/a5caf5b) : stabilise la suite de tests, qui dépassait ses délais presque à chaque fois, et la ramène de 4 min 19 à environ 1 min 50 ; le moteur des règles garde les cibles déjà calculées pour une même situation.

## [1.0.0](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%401.0.0), 13 novembre 2026

Le correctif v10.1.8 de l'éditeur, l'effacement des sous-questions qu'il a
spécifié et recetté, et le journal des parcours complet pour le dashboard.
22 commits depuis la 0.7.0.

### TL;DR

- Une réponse qui ne vaut plus s'efface : sous-question que la page ne pose plus, question devenue inapplicable sur une autre page, précision rattachée à d'autres séances, nom d'un lieu qui change de catégorie. Reposée, la question revient vide.
- « Suivant » ne se grise plus que pour une réponse qui manque ou qui ne va pas en elle-même ; une incohérence se dit au clic, et le moteur refuse lui-même une page incomplète ou incohérente.
- Une date d'accident future ou une date qui n'existe pas au calendrier est refusée près du champ.
- Le simulateur suit le correctif v10.1.8 du 13 novembre : garde de l'article 80, fondement autonome, côté de l'USLD et de l'EHPAD aux deux lieux, Q2.6 retirée à la permission d'un adulte sur une ligne régulière.
- Le journal des parcours reçoit l'intention, les questions affichées, les résultats, les documents R3, les boutons et leurs clics, le chargement de la page, les versions de l'app, et un signe de vie chaque heure.

### ✨ Nouveautés

- [b9c64c8](https://github.com/betagouv/transport-sanitaire/commit/b9c64c8) : intègre le correctif v10.1.8 du 13 novembre : une exception de l'article 80 encore inconnue et décisive empêche de décider, le fondement autonome ne vaut « non » que sans permission, convocation ni maternité, le côté de l'USLD et de l'EHPAD propose « Au départ et à l'arrivée ».
- [40be7b1](https://github.com/betagouv/transport-sanitaire/commit/40be7b1) : ne pose plus Q2.6 à la permission d'un adulte sur une ligne régulière : l'avion ou le bateau de Q2.3.2 établit l'exception, et la décision se calcule.
- [1e92060](https://github.com/betagouv/transport-sanitaire/commit/1e92060) : efface la réponse d'une sous-question que la page ne pose plus, dès la saisie et de proche en proche : décocher ALD efface Q1.3.b, qui revient vide une fois recochée.
- [d93aea0](https://github.com/betagouv/transport-sanitaire/commit/d93aea0) : efface à la validation la réponse d'une question devenue inapplicable sur une autre page ; reposée, elle revient vide.
- [a2dd0fa](https://github.com/betagouv/transport-sanitaire/commit/a2dd0fa) : relit sur les réponses corrigées le brouillon qu'une correction restaure : ce qui ne se pose plus en sort, et ne revient pas à la correction suivante.
- [ff01c91](https://github.com/betagouv/transport-sanitaire/commit/ff01c91) : dit une incohérence au clic sur « Suivant », qui ne se grise plus que pour une réponse manquante ou fausse en elle-même.
- [bf5cdfa](https://github.com/betagouv/transport-sanitaire/commit/bf5cdfa) : refuse dans le moteur une page incomplète ou incohérente, quel que soit l'appelant : aucun résultat ni cerfa ne sort d'une combinaison non validée.
- [3169b19](https://github.com/betagouv/transport-sanitaire/commit/3169b19) : refuse près du champ une date d'accident future (Q1.3, Q3.6.1), avec « Suivant » grisé ; le calendrier ne propose plus les jours futurs.
- [e71d64f](https://github.com/betagouv/transport-sanitaire/commit/e71d64f) : signale une date qui n'existe pas au calendrier, comme le 31/02 : « Indiquez une date complète, qui existe au calendrier. »
- [d7b7719](https://github.com/betagouv/transport-sanitaire/commit/d7b7719) : envoie au journal l'intention du premier choix validé en P0, et range la mesure d'audience en clean architecture.
- [29536f8](https://github.com/betagouv/transport-sanitaire/commit/29536f8) : envoie au journal les questions affichées, les saisies, les validations, les validations qu'une correction fait tomber, et l'entrée et la fin de chaque phase.
- [2555a80](https://github.com/betagouv/transport-sanitaire/commit/2555a80) : envoie au journal chaque révision du premier résultat, avec l'issue, le mode, les motifs affichés, le support et le financeur, et la révision qu'une correction fait tomber.
- [bf6fd60](https://github.com/betagouv/transport-sanitaire/commit/bf6fd60) : envoie au journal chaque version du document R3 affiché, et chaque génération ratée.
- [2d430bc](https://github.com/betagouv/transport-sanitaire/commit/2d430bc) : envoie au journal les boutons exposés du R2 et du R3, « Imprimer », « Télécharger » et « Donner mon avis », et chacun de leurs clics.
- [76d64c5](https://github.com/betagouv/transport-sanitaire/commit/76d64c5) : envoie au journal la taille où chaque champ rempli du document R3 s'imprime, jamais son texte.
- [6056988](https://github.com/betagouv/transport-sanitaire/commit/6056988) : envoie au journal le chargement de la page, ouverte, rechargée ou revenue par l'historique, y compris dans l'iframe du CMS.
- [a7e578d](https://github.com/betagouv/transport-sanitaire/commit/a7e578d) : envoie avec chaque événement du journal la version des règles, celle de l'app et le commit déployé.
- [2f68825](https://github.com/betagouv/transport-sanitaire/commit/2f68825) : écrit chaque heure le signe de vie de la collecte : une heure sans lui est une heure sans collecte.

### 🐛 Corrections

- [a1b73ca](https://github.com/betagouv/transport-sanitaire/commit/a1b73ca) : efface Q2.1.f quand les séances cochées en Q1.3 changent.
- [b5c635f](https://github.com/betagouv/transport-sanitaire/commit/b5c635f) : garde Q2.1.f quand seules d'autres options de Q1.3 changent, comme un accident coché en plus.
- [1576b9c](https://github.com/betagouv/transport-sanitaire/commit/1576b9c) : efface le nom d'un lieu quand sa catégorie change, de structure de soins à autre lieu ou l'inverse ; y revenir ne le rend pas, l'adresse reste.
- [907347b](https://github.com/betagouv/transport-sanitaire/commit/907347b) : n'envoie plus au journal de partie terrestre que rien ne prouve ; une liste de motifs vide dit qu'aucun n'est affiché.

## [0.7.0](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%400.7.0), 12 novembre 2026

Le modèle v10.1.8 de l'éditeur, le début du journal des parcours et la trace de
debug ouverte à l'Assurance Maladie. 4 commits depuis la 0.6.0.

### TL;DR

- Le simulateur suit la v10.1.8 : au-delà de 150 km, l'accord préalable demande une finalité de soins ; les lieux de P3 se rangent en trois catégories, domicile, structure de soins et autre lieu.
- Les précisions de l'ALD, de la dialyse et de l'accident causé par un tiers se posent dans un panneau sous leur case.
- Le début de chaque simulation s'écrit dans le journal des parcours, en production seulement.
- La structure « Assurance Maladie » ouvre la trace de debug sur tous les environnements.

### ✨ Nouveautés

- [a27e0eb](https://github.com/betagouv/transport-sanitaire/commit/a27e0eb) : intègre le modèle v10.1.8 : finalité de soins demandée au-delà de 150 km quand rien ne la prouve, « Autre motif » qui ne dit plus rien du soin, permission d'un adulte autorisée qui aboutit, sens de plusieurs permissions demandé, déplacement évalué entre maternité et HTNM, sous-titres de Q1.4, précisions de Q1.3 dans un panneau, lieux de P3 en trois catégories avec le nom et le service de la structure.
- [35888a4](https://github.com/betagouv/transport-sanitaire/commit/35888a4) : écrit le début de chaque simulation, avec l'établissement et le service, dans le journal des parcours, sans réponse ni texte libre ; seule la production le garde, et rien ne part quand le prescripteur s'oppose à la mesure.
- [7c0ee2d](https://github.com/betagouv/transport-sanitaire/commit/7c0ee2d) : ouvre la trace de debug à qui choisit la structure « Assurance Maladie », en staging et en production ; les seeds et le choix du modèle restent en local.

### 📝 Documentation

- [f57f889](https://github.com/betagouv/transport-sanitaire/commit/f57f889) : décide que le navigateur envoie ses événements au backend, qui les valide et les écrit dans Grist.

## [0.6.0](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%400.6.0), 9 novembre 2026

Le modèle v10.1.7 de l'éditeur, l'écran d'entrée revu avec le porteur et les
developer tools réservés au poste local. 11 commits depuis la 0.5.1.

### TL;DR

- Le simulateur suit la v10.1.7 : chaque situation ne se déclare qu'à un endroit, l'accident causé par un tiers passe en Q1.3, les dates de la permission n'ont plus d'heure, et l'adresse du domicile s'écrit sur les cerfa.
- Un conflit de lieux certain s'arrête avant R2, avec des liens vers les réponses à revoir ; le sens du trajet se demande avant R2 quand il change les lieux.
- L'écran d'entrée prend le titre et la liste voulus par le porteur : « Libéral », « Assurance Maladie » et « Autre » seulement sous les établissements.
- Sous Safari, chaque nouvelle page remonte en haut de l'iframe ; la page suit le thème du site qui l'embarque.
- Les developer tools ne s'ouvrent plus qu'en local.

### ✨ Nouveautés

- [b0da571](https://github.com/betagouv/transport-sanitaire/commit/b0da571) : intègre le modèle v10.1.7 : textes des résultats et libellés de P0, Q3.1.2, Q3.7 et de la caisse revus, accident causé par un tiers recueilli en Q1.3, dates de la permission sans heure avec une question sur sa durée, adresse du domicile écrite dans la zone du bénéficiaire des trois cerfa, critères du mode retirés du texte médical.
- [d58db14](https://github.com/betagouv/transport-sanitaire/commit/d58db14) : ne découvre chaque situation qu'à un endroit : Q2.1 garde neuf motifs, la permission se dit sous le séjour en établissement, le CAMSP et la convocation en Q2.2.1.b, l'examen et l'hébergement de la maternité deviennent deux cases de Q2.2.1.
- [5fd6b82](https://github.com/betagouv/transport-sanitaire/commit/5fd6b82) : pose l'urgence sous la seule Q2.3.4, au trajet ou à la branche ; Q2.12 disparaît.
- [d8c12af](https://github.com/betagouv/transport-sanitaire/commit/d8c12af) : arrête avant R2 des réponses qui donnent à un lieu des natures inconciliables, et mène par des liens aux réponses à revoir ; l'adresse de la page porte l'étape, et le bouton Retour du navigateur y revient.
- [1134725](https://github.com/betagouv/transport-sanitaire/commit/1134725) : pose le sens du trajet avant R2 (Q2.13.sens) quand il change les lieux ; Q3.1.2 ne le redemande pas.
- [f8465e2](https://github.com/betagouv/transport-sanitaire/commit/f8465e2) : passe le champ médical des cerfa en multiligne avant toute mesure.
- [032b675](https://github.com/betagouv/transport-sanitaire/commit/032b675) : suit les retours du porteur sur l'écran d'entrée : titre « Faites une simulation pour prescrire le transport adapté », mention de la phase expérimentale, marge haute retirée, liste « Établissement » sans phrase d'aide, et sous le trait « Autre établissement », « Libéral », « Assurance Maladie », « Autre » seulement.
- [9b6622b](https://github.com/betagouv/transport-sanitaire/commit/9b6622b) : crée le service « Autre » d'un établissement saisi, pour que le collègue suivant puisse y saisir son propre service.

### 🐛 Corrections

- [bd3f719](https://github.com/betagouv/transport-sanitaire/commit/bd3f719) : corrige quatre retours Marker.io : une adresse longue se dessine lisible sous son cadre au lieu de rapetisser, le simulateur suit le thème du site qui l'embarque, le bloc de suivi se détache de l'encadré de refus, la fiche s'imprime sans en-tête ni pied de page du navigateur.
- [24677d8](https://github.com/betagouv/transport-sanitaire/commit/24677d8) : remonte la page hôte au haut de l'iframe sous Safari à chaque nouvelle page ; le script collé dans Sites Conformes est à recoller.
- [6aa9e65](https://github.com/betagouv/transport-sanitaire/commit/6aa9e65) : ouvre les developer tools en local seulement, quel que soit le service choisi ; ils ne s'ouvrent plus en staging ni en production.

## [0.5.1](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%400.5.1), 4 novembre 2026

Le modèle v10.1.6 de l'éditeur et le nouvel écran d'entrée, qui ouvre le
simulateur dès le choix de l'établissement ou de la structure. 3 commits depuis
la 0.5.0.

### TL;DR

- L'écran d'entrée propose dans une seule liste les établissements et les structures (libéral, Assurance Maladie, autre) ; un établissement absent de la liste se déclare et rejoint le référentiel.
- Le simulateur suit la v10.1.6 : le nom de l'hébergement de l'Engagement maternité devient obligatoire quand la DAP en a besoin, chaque page remonte l'écran et porte le focus au titre, et la recette des deux pages des situations particulières est rejouée.

### ✨ Nouveautés

- [a7293c4](https://github.com/betagouv/transport-sanitaire/commit/a7293c4) : demande à l'entrée l'établissement ou la structure dans une seule liste et ouvre le simulateur dès la sélection ; un service ou un établissement absent de la liste se saisit en toutes lettres, rejoint le référentiel et se retrouve dans la liste à la visite suivante.
- [69a08c9](https://github.com/betagouv/transport-sanitaire/commit/69a08c9) : intègre le modèle v10.1.6 : le nom de l'hébergement de l'Engagement maternité est exigé quand il est le départ ou l'arrivée de la DAP, les réponses de Q2.10 sont ponctuées, chaque nouvelle page remonte l'écran et porte le focus à son titre, un changement de réponse au premier bloc des situations particulières efface le second, et cinq variantes de résultat devenues inatteignables sortent du catalogue.

### ♻️ Sous le capot

- [c22025a](https://github.com/betagouv/transport-sanitaire/commit/c22025a) : range le code par entités et capacités, moteur de décision, moteur de questionnaire et simulation, pour que l'arborescence dise ce que fait chaque dossier ; rien ne change à l'écran.

## [0.5.0](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%400.5.0), 2 novembre 2026

Le passage au modèle v10 de l'éditeur, de la v10.0.2 à la v10.1.5, sur un
simulateur vidé de la v9 et reconstruit pour lui. 208 commits depuis la 0.4.0.

### TL;DR

- Le simulateur suit le modèle v10 de l'éditeur, de la v10.0.2 à la v10.1.5, sur un socle qui ne dépend d'aucune version du modèle.
- Le parcours se pose en entier, de P0 à P3, et une question dont la réponse ne change plus le résultat n'est plus posée.
- R2 donne la fiche à remettre au patient pour chaque issue, téléchargeable en PDF ; R3 remplit les trois Cerfa (PMT, DAP, S3141) depuis le parcours, texte médical compris, et les montre à imprimer ou télécharger.
- L'écran d'entrée ne demande plus que l'établissement et le service : plus rien de nominatif dans Matomo, et la mesure d'audience respecte l'opposition de l'utilisateur.
- Un lien invite le prescripteur à donner son avis, et Matomo reçoit le verdict de chaque parcours ALD.
- La recette de l'éditeur est rejouée bien plus largement : frontières B01 à B21, 133 scénarios de démonstration, recettes N2 et N4.
- Deux failles de niveau « high » (zod, body-parser) sont refermées.

### ✨ Nouveautés

- [6496a48](https://github.com/betagouv/transport-sanitaire/commit/6496a48) : retire de l'écran d'entrée le nom du prescripteur, qui partait dans chaque évènement Matomo : seuls l'établissement et le service sont désormais demandés, et le bandeau de consentement devient inutile.
- [8fb6c6b](https://github.com/betagouv/transport-sanitaire/commit/8fb6c6b) : transmet à Matomo l'identifiant du service tel quel, sans chiffrement : les rapports se lisent sans table de correspondance, et la production n'a plus de secret à garder.
- [73dabe1](https://github.com/betagouv/transport-sanitaire/commit/73dabe1) : laisse entrer dans le simulateur, sous un rattachement « Autre / Autre », quand la liste des établissements ou des services ne se charge pas, au lieu d'en bloquer l'accès.
- [2284b00](https://github.com/betagouv/transport-sanitaire/commit/2284b00) : attend, avant toute mesure d'audience, le choix transmis par le site qui héberge le simulateur : sur refus, Matomo n'est jamais chargé et aucun évènement ne part.
- [80faa85](https://github.com/betagouv/transport-sanitaire/commit/80faa85) : fournit le script à coller dans Sites Conformes, qui ajoute au pied de page le lien « Désactiver la mesure d'audience du simulateur » et transmet ce choix au simulateur.
- [ac1b390](https://github.com/betagouv/transport-sanitaire/commit/ac1b390) : livre `tsp`, une commande unique pour qui contribue au dépôt : installation d'une machine neuve, vérifications par app, specs, branches et PR vers staging, ouverture des outils du projet.
- [e183d92](https://github.com/betagouv/transport-sanitaire/commit/e183d92) : affiche « Chargement du simulateur… » après l'écran de rattachement tant que le modèle n'est pas arrivé, et une alerte s'il n'arrive pas.
- [e82f254](https://github.com/betagouv/transport-sanitaire/commit/e82f254) : sort le modèle du premier téléchargement : il se charge pendant que le prescripteur se rattache, ce qui allège l'ouverture du simulateur.
- [818515b](https://github.com/betagouv/transport-sanitaire/commit/818515b) : permet d'accompagner une option d'une explication sous son libellé, comme les durées des cartes de Q0.1 (« Environ 2 minutes. »).
- [f625b8a](https://github.com/betagouv/transport-sanitaire/commit/f625b8a) : ne présente une option que si les réponses précédentes l'autorisent — en Q1.3, « non compatible avec un transport partagé » n'apparaît que pour un transport assis professionnel — et retire d'une réponse déjà donnée l'option devenue caduque.
- [434187e](https://github.com/betagouv/transport-sanitaire/commit/434187e) : fait varier l'intitulé d'une question selon les réponses, comme Q1.4 qui précise « en toute autonomie » ou « avec l'aide d'un proche » d'après Q1.1.
- [3c851e8](https://github.com/betagouv/transport-sanitaire/commit/3c851e8) : calcule si toutes les questions de P1 et de P2 ont reçu leur réponse, deux faits de complétude que les règles v10 attendent de l'application.
- [b406e28](https://github.com/betagouv/transport-sanitaire/commit/b406e28) : embarque le moteur publicodes, figé dans la version 1.10.1 testée par l'éditeur, pour que le modèle calcule ses issues à partir des faits.
- [0a3f2ed](https://github.com/betagouv/transport-sanitaire/commit/0a3f2ed) : propose dans les developer tools de dérouler un modèle de démonstration à la place du modèle livré, puis d'en sortir, sans recharger la page.
- [0c1e1a6](https://github.com/betagouv/transport-sanitaire/commit/0c1e1a6) : fait du modèle de démonstration une vitrine où chaque question dit le mécanisme qu'elle illustre, avec quatre seeds pour ouvrir ses pages et ses résultats.
- [bef3b87](https://github.com/betagouv/transport-sanitaire/commit/bef3b87) : refuse une décimale dans un nombre qui doit être entier, comme le nombre de transports de Q3.1, et n'offre que des chiffres au clavier d'un téléphone.
- [fcd7fcd](https://github.com/betagouv/transport-sanitaire/commit/fcd7fcd) : laisse valider une page sans répondre à une question marquée « (facultatif) », comme le complément d'adresse ou le commentaire de Q3.4.
- [83711ba](https://github.com/betagouv/transport-sanitaire/commit/83711ba) : présente un choix unique en liste déroulante quand le modèle le demande, comme la nature d'un lieu en Q3.2 et Q3.3.
- [31b56db](https://github.com/betagouv/transport-sanitaire/commit/31b56db) : offre une zone de texte sur plusieurs lignes pour les précisions de Q3.4, Q3.5 et Q2.1.l, où « Entrée » va à la ligne sans valider la page.
- [dfb0110](https://github.com/betagouv/transport-sanitaire/commit/dfb0110) : limite une date, avec ou sans heure, d'après les réponses ou le jour : le calendrier grise ce qui sort des limites, et la fin d'une permission ne peut plus précéder son début.
- [da2f493](https://github.com/betagouv/transport-sanitaire/commit/da2f493) : bloque « Suivant » et affiche la consigne d'une réponse qui exige une seconde simulation, comme « Aller-retour différent » en Q3.1.
- [3f1a50f](https://github.com/betagouv/transport-sanitaire/commit/3f1a50f) : adapte aux réponses l'option « Aucune » : en Q2.2.1, elle devient « Aucune autre situation parmi celles proposées » quand un contexte est acquis, et en Q3.7 elle disparaît dès qu'une case est acquise.
- [634e86c](https://github.com/betagouv/transport-sanitaire/commit/634e86c) : décoche, en l'expliquant, l'option incompatible avec celle qu'on vient de cocher — voyager dans son fauteuil ou sur un brancard en Q1.2 — sans toucher aux autres critères.
- [713e5f0](https://github.com/betagouv/transport-sanitaire/commit/713e5f0) : ajoute sous les options une aide repliée, « Voir les situations concernées » en Q2.2.1, qui liste ce qu'une option regroupe sans être une réponse.
- [f2d1ad5](https://github.com/betagouv/transport-sanitaire/commit/f2d1ad5) : ajoute quatre seeds qui ouvrent directement les nouvelles pages du modèle de démonstration, sans dérouler tout le questionnaire.
- [2e81578](https://github.com/betagouv/transport-sanitaire/commit/2e81578) : rappelle juste avant une question un fait déjà établi qui aide à y répondre, sans le redemander, et seulement si la page pose encore cette question.
- [4193712](https://github.com/betagouv/transport-sanitaire/commit/4193712) : affiche près du champ encore demandé les données déjà fixées, comme le rôle et la nature d'un lieu en P3, sans sélecteur à rejouer.
- [ca2ec55](https://github.com/betagouv/transport-sanitaire/commit/ca2ec55) : distingue un fait inconnu d'un fait faux : une option jamais proposée laisse le fait absent au lieu de valoir « non », et la trace de debug montre, et exporte en JSON pour la recette, d'où vient chaque fait.
- [b441e3d](https://github.com/betagouv/transport-sanitaire/commit/b441e3d) : ajoute la saisie d'une adresse en champs séparés : code postal à cinq chiffres en France ; à l'étranger, pays demandé et code postal facultatif.
- [081d2b0](https://github.com/betagouv/transport-sanitaire/commit/081d2b0) : signale sous la question à corriger les incohérences entre deux réponses, deux adresses identiques par exemple, plusieurs messages à la fois si besoin, et retient la page tant qu'elles demeurent.
- [4a2d1a8](https://github.com/betagouv/transport-sanitaire/commit/4a2d1a8) : génère le cerfa dans le navigateur et le propose au téléchargement en action principale du second résultat, daté du jour où le complément a été validé.
- [4806688](https://github.com/betagouv/transport-sanitaire/commit/4806688) : livre un cerfa aplati, sans plus aucun champ modifiable, et en écrit les textes à 9 pt comme le demande la v10.0.2, la même taille d'un cerfa à l'autre.
- [2fa1f4a](https://github.com/betagouv/transport-sanitaire/commit/2fa1f4a) : alimente chaque cerfa par des données nommées en clair, et coche correctement les cases de la DAP qui partagent un même champ du gabarit.
- [b525ff8](https://github.com/betagouv/transport-sanitaire/commit/b525ff8) : écrit un texte là où le gabarit n'a pas de champ, comme la précision de « Urgence : autres » sur le PMT ou le centre de paiement sur la DAP, et ajoute un bouton d'impression à la fiche du premier résultat.
- [9bf9971](https://github.com/betagouv/transport-sanitaire/commit/9bf9971) : ne refuse ni ne coupe plus un texte trop long pour son cadre : il passe à 8 pt, perd au besoin son commentaire facultatif, signalé avant le téléchargement, puis déborde sous le cadre.
- [ffc6e75](https://github.com/betagouv/transport-sanitaire/commit/ffc6e75) : intègre les règles v10.0.2 de l'éditeur, avec leurs 59 faits et 53 cibles, et rejoue son oracle (cas D01 à D49) ; le modèle ne pose encore que P0.
- [6b01395](https://github.com/betagouv/transport-sanitaire/commit/6b01395) : ouvre le modèle de l'éditeur dans les developer tools avec P0 et P1 (Q1.1 à Q1.4) sous leurs libellés v10.0.2, options incompatibles et options conditionnelles comprises.
- [33a70f0](https://github.com/betagouv/transport-sanitaire/commit/33a70f0) : ajoute la question faite d'une seule case à cocher, où une case laissée décochée sur une page validée vaut « non », comme le demande Q2.3.2.
- [df17a73](https://github.com/betagouv/transport-sanitaire/commit/df17a73) : demande en P2 la distance (Q2.3.1), la série de transports au-delà de 50 km (Q2.3.3), l'avion ou le bateau de ligne (Q2.3.2) et l'urgence attestée (Q2.3.4).
- [c2508c7](https://github.com/betagouv/transport-sanitaire/commit/c2508c7) : demande en P2 le motif médical du déplacement (Q2.1), avec ses précisions sur la même page pour les séances, l'hospitalisation et le CAMSP, et l'omet quand P1 prouve déjà un motif de transport.
- [48abf42](https://github.com/betagouv/transport-sanitaire/commit/48abf42) : porte le modèle en v10.1.1, sans passer par la v10.1.0 : un mineur en soins prolongés non vérifiable renvoie vers la caisse, son dispositif ne demande plus d'ALD, et Q0.1 annonce 3 et 10 minutes.
- [444980e](https://github.com/betagouv/transport-sanitaire/commit/444980e) : ne pose plus Q2.3.4 que lorsque la règle livrée par l'éditeur le prévoit, ce qui la fait aussi poser pour un CAMSP à 50 km ou moins.
- [970f309](https://github.com/betagouv/transport-sanitaire/commit/970f309) : ajoute à Q1.3 le mineur reconnu en soins continus de plus de six mois, et ne fait plus perdre son ALD à un patient qui a besoin de l'aide d'un proche.
- [4e20a5a](https://github.com/betagouv/transport-sanitaire/commit/4e20a5a) : épargne Q2.1 au prescripteur dès que P1 établit une ALD à 100 % liée au soin ou un mineur reconnu en soins continus, comme le confirme la v10.1.1 ; une ALD sans le 100 % ne suffit pas.
- [cef2784](https://github.com/betagouv/transport-sanitaire/commit/cef2784) : reprend tel quel le catalogue des textes de R2 livré par l'éditeur, contrôlé à la compilation, avec un texte pour chacune des dix issues.
- [38428bc](https://github.com/betagouv/transport-sanitaire/commit/38428bc) : tient pour non prouvée toute exclusion du transport, le modèle chargé n'en portant aucune : les règles peuvent ainsi donner une issue sans interroger le médecin.
- [4ad1991](https://github.com/betagouv/transport-sanitaire/commit/4ad1991) : demande en P2 les situations particulières du déplacement (Q2.2.1) sur tous les parcours, avec la permission, l'autre cadre et l'étranger sur la même page ; une situation proposée et écartée vaut « non ».
- [93a69f0](https://github.com/betagouv/transport-sanitaire/commit/93a69f0) : demande après le trajet de P2 si le déplacement est un transfert (Q2.5), puis son type et les huit exceptions de l'article 80 (Q2.6.a, Q2.6), filtrées selon le séjour.
- [ea59e76](https://github.com/betagouv/transport-sanitaire/commit/ea59e76) : demande les dates d'une permission de sortie (Q2.7, et Q2.8 sur une seule page pour un patient de moins de 20 ans), et bloque « Suivant » à chaque incohérence de date, de durée ou de période ; un mineur admissible obtient le S3141.
- [d9e70b6](https://github.com/betagouv/transport-sanitaire/commit/d9e70b6) : écarte d'office le transfert et l'appel au Centre 15 quand le déplacement est une permission, sauf si Q2.5 dit le contraire.
- [b4ce6d4](https://github.com/betagouv/transport-sanitaire/commit/b4ce6d4) : demande la catégorie d'une convocation (Q2.10) et, pour un appareillage, l'agrément du fournisseur et l'appareil concerné sur la même page ; un agrément incertain oriente vers la caisse.
- [034e1ad](https://github.com/betagouv/transport-sanitaire/commit/034e1ad) : clôt P2 par une dernière page, posée seulement si elle sert — le départ (Q2.13), l'Engagement maternité (Q2.14), puis l'urgence (Q2.12) — et affiche le résultat directement après.
- [b96ebed](https://github.com/betagouv/transport-sanitaire/commit/b96ebed) : porte le modèle en v10.1.2 : Q2.2.1 ne rappelle plus « Déjà indiqué » et perd l'option du centre de référence, désormais demandée en P3.
- [fe7b42e](https://github.com/betagouv/transport-sanitaire/commit/fe7b42e) : qualifie le retour vers un établissement pénitentiaire d'après les réponses déjà données : mouvement administratif sans résultat, sortie définitive d'hospitalisation, ou transfert refusé selon le cas.
- [8f53164](https://github.com/betagouv/transport-sanitaire/commit/8f53164) : ouvre le simulateur sur le modèle de l'éditeur pour tous les services, au lieu du modèle de démonstration, qui ne reste accessible qu'au service de test.
- [fd6417b](https://github.com/betagouv/transport-sanitaire/commit/fd6417b) : calcule ce qui explique le premier résultat (R2) — cibles, faits et réponses réellement données — et l'accompagne d'une situation de référence par issue.
- [0d2a32d](https://github.com/betagouv/transport-sanitaire/commit/0d2a32d) : affiche la page du praticien pour les cinq issues sans fiche patient (caisse, établissement, permission à la charge du patient, convocation, étranger), avec les textes du catalogue de l'éditeur chargés à la demande.
- [9296ad1](https://github.com/betagouv/transport-sanitaire/commit/9296ad1) : affiche la fiche explicative à remettre au patient non éligible, avec la raison la plus prioritaire qu'établissent ses réponses et les trois modes de transport illustrés.
- [78a9a3a](https://github.com/betagouv/transport-sanitaire/commit/78a9a3a) : affiche la fiche à remettre au patient pour une prescription médicale de transport ou un S3141, avec la carte de sa situation bordée de vert et les seuls badges que ses réponses établissent.
- [bc1a6e9](https://github.com/betagouv/transport-sanitaire/commit/bc1a6e9) : étend la fiche patient aux deux accords préalables (sans urgence, urgence attestée), avec le fondement de la demande et son rappel : les dix issues ont désormais leur texte.
- [4056795](https://github.com/betagouv/transport-sanitaire/commit/4056795) : propose « Compléter la prescription » ou « Compléter la demande » selon l'issue, seulement quand la suite a un écran, et retire du premier résultat son bouton d'impression.
- [6100e10](https://github.com/betagouv/transport-sanitaire/commit/6100e10) : présente la fiche du patient non éligible comme une feuille, avec les logos de l'Assurance Maladie et du ministère de la Santé et un bloc de suivi.
- [dbbfc64](https://github.com/betagouv/transport-sanitaire/commit/dbbfc64) : porte le modèle en v10.1.3 : sigles développés dans les libellés, Q2.14 en deux groupes de conditions, retour pénitentiaire sans raison médicale orienté vers l'organisation pénitentiaire, et textes de R2 tous tirés du catalogue.
- [c562ff5](https://github.com/betagouv/transport-sanitaire/commit/c562ff5) : offre à l'éditeur du modèle des constructeurs de questions par sorte, qui tirent les options du catalogue d'après l'identifiant et refusent à la compilation une option inconnue ; aucun écran ne change.
- [f331447](https://github.com/betagouv/transport-sanitaire/commit/f331447) : permet d'écrire un fait comme le contrat de l'éditeur le décrit — ce qui le met à « oui », à « non », ou le laisse absent — et y migre une dizaine de faits, sans changer aucun résultat.
- [432056c](https://github.com/betagouv/transport-sanitaire/commit/432056c) : ouvre la partie 3, le complément du cerfa, par le nombre et le sens des transports (Q3.1), et récapitule les réponses de P3 au second résultat en attendant le PDF.
- [7770032](https://github.com/betagouv/transport-sanitaire/commit/7770032) : demande le départ et l'arrivée (Q3.2, Q3.3) — nature, nom, adresse — sans redemander une nature déjà établie en P2, et bloque deux adresses identiques.
- [c0b6b24](https://github.com/betagouv/transport-sanitaire/commit/c0b6b24) : demande en P3 la description du soin (Q3.4), la justification d'un lieu éloigné, le centre de référence (Q3.4.a) et la précision de l'urgence attestée (Q3.5).
- [5985ae1](https://github.com/betagouv/transport-sanitaire/commit/5985ae1) : demande les dates d'un accident du travail ou d'un accident causé par un tiers (Q3.6) et, en contexte hospitalier, les cas d'exonération (Q3.7).
- [798e989](https://github.com/betagouv/transport-sanitaire/commit/798e989) : affiche chaque case à cocher dans une carte bordée et entièrement cliquable, comme les boutons radio, avec son aide sous la carte.
- [1522993](https://github.com/betagouv/transport-sanitaire/commit/1522993) : propose au second résultat (R3) le cerfa de l'issue (S3138g, S3139h ou S3141), à imprimer ou à télécharger, encore vierge à ce stade.
- [1b5e4b4](https://github.com/betagouv/transport-sanitaire/commit/1b5e4b4) : remplit le S3141 téléchargé d'après le parcours — accident, hospitalisation, trajets, mode, ALD, lieux, exonération et date de prescription —, les identités restant vides.
- [9950dbd](https://github.com/betagouv/transport-sanitaire/commit/9950dbd) : compose le texte médical de la PMT et de la DAP à partir des réponses, dans l'ordre que fixe l'éditeur, avec la précision facultative du prescripteur.
- [5c6f3c2](https://github.com/betagouv/transport-sanitaire/commit/5c6f3c2) : fait du titre de la partie celui du stepper, annonce la partie suivante, met en gras les deux choix de P0 et range la barre d'actions du premier résultat.
- [09834c4](https://github.com/betagouv/transport-sanitaire/commit/09834c4) : numérote les deux étapes de la fiche patient, encadre le rappel de l'accord préalable, et imprime la fiche sur une ou deux A4 selon sa hauteur mesurée, dessins agrandis dans la place libre.
- [cf34a09](https://github.com/betagouv/transport-sanitaire/commit/cf34a09) : donne à la DAP d'un trajet en avion ou bateau de ligne ses propres textes : aucun badge, et « Pour les éventuelles parties terrestres du trajet » en tête des cartes.
- [5d059eb](https://github.com/betagouv/transport-sanitaire/commit/5d059eb) : range le second résultat de haut en bas selon la maquette et montre, sous les boutons, l'aperçu du PDF qu'ils impriment ou téléchargent.
- [0d24d6e](https://github.com/betagouv/transport-sanitaire/commit/0d24d6e) : remplit la prescription médicale de transport (S3138g) sur ses deux volets, avec en plus des rubriques du S3141 les motifs, le nombre de transports, l'urgence et le centre de référence des maladies rares.
- [2129acb](https://github.com/betagouv/transport-sanitaire/commit/2129acb) : remplit la demande d'accord préalable (S3139h) sur ses trois volets, pour l'accord préalable comme pour l'examen à l'étranger : les trois documents sortent désormais remplis.
- [19fc546](https://github.com/betagouv/transport-sanitaire/commit/19fc546) : affiche « Préparation du PDF… » sur « Télécharger » pendant la génération, et ne sort plus un document prêt après qu'on a quitté R3.
- [1d9e225](https://github.com/betagouv/transport-sanitaire/commit/1d9e225) : réduit un texte trop long jusqu'à ce qu'il tienne dans son champ, sur plusieurs lignes au besoin : les éléments médicaux de la DAP ne débordent plus sur le reste du cerfa.
- [da375fe](https://github.com/betagouv/transport-sanitaire/commit/da375fe) : ajoute à la fiche patient un bouton « Télécharger », qui donne en un clic un PDF d'une ou deux pages, coupé comme à l'impression.
- [67f6d01](https://github.com/betagouv/transport-sanitaire/commit/67f6d01) : invite le prescripteur à donner son avis par un lien vers le questionnaire du porteur, au premier ou au second résultat selon ce qu'il est venu faire.
- [f0610a7](https://github.com/betagouv/transport-sanitaire/commit/f0610a7) : compile à chaque build les règles du modèle en graphe de décision, versionné pour qu'une livraison de l'éditeur se lise dans le diff ; rien ne s'en sert encore.
- [62ccbf1](https://github.com/betagouv/transport-sanitaire/commit/62ccbf1) : calcule pour chaque question les faits que sa réponse peut changer, d'après ce que lisent déjà les faits et les conditions d'affichage ; rien ne change à l'écran.
- [7f31c69](https://github.com/betagouv/transport-sanitaire/commit/7f31c69) : déclare ce dont dépend la complétude de P1 et de P2, pour que le saut des questions inutiles ne fasse pas sauter toute une partie ; rien ne change à l'écran.
- [e051480](https://github.com/betagouv/transport-sanitaire/commit/e051480) : déclare les cibles et les faits que lit chaque texte de R2 et de R3 (25 cibles et 19 faits pour R2), et refuse à la compilation une lecture non déclarée.
- [a698009](https://github.com/betagouv/transport-sanitaire/commit/a698009) : saute une question dont la réponse ne peut plus changer le résultat — un patient en SAMSAH, orienté vers la caisse, ne donne plus la distance de son trajet — et corrige le seuil de longue distance du CAMSP sur la DAP (150 km, pas 50).
- [5e6c3d5](https://github.com/betagouv/transport-sanitaire/commit/5e6c3d5) : envoie à Matomo, à chaque arrivée d'un parcours ALD sur R2, son verdict (dans la cible, trop de pages, trop de questions, caisse) et le nombre de questions posées, sans aucune réponse.
- [2bc3ee5](https://github.com/betagouv/transport-sanitaire/commit/2bc3ee5) : reprend mot pour mot les libellés de P1 et P2 de la v10.1.4, retire « Je ne peux pas le vérifier » de Q2.1.h, Q2.7.a et Q2.8.4, et place « Donner mon avis » dans la barre d'actions.
- [5ba3a7b](https://github.com/betagouv/transport-sanitaire/commit/5ba3a7b) : demande en Q1.3.b, juste sous la case ALD, si le soin est lié à l'ALD, distingue un séjour en établissement d'une HAD, et range la fiche non éligible comme l'aperçu de la v10.1.4.
- [9ee3937](https://github.com/betagouv/transport-sanitaire/commit/9ee3937) : tire les lieux de P3 des rôles du séjour (une permission ne présume plus le domicile), demande le sens avant le nombre de trajets en Q3.1, et ne montre au prescripteur que les sections que le catalogue de la v10.1.4 prévoit.
- [091dfaf](https://github.com/betagouv/transport-sanitaire/commit/091dfaf) : porte le modèle en v10.1.5 : Q2.8.4.a et Q2.1.h disparaissent, Q2.2.1 se pose en deux pages, la DAP d'un Engagement maternité demande la maternité et son niveau, et un caractère que la police ignore ne fait plus échouer le cerfa.

### 🐛 Corrections

- [7ce6b22](https://github.com/betagouv/transport-sanitaire/commit/7ce6b22) : dit simplement que le catalogue des situations de référence est vide, sans plus promettre leur retour avec le modèle suivant.
- [3821225](https://github.com/betagouv/transport-sanitaire/commit/3821225) : place l'aide d'une option juste sous cette option, en lien qui déplie sa liste, plutôt qu'en accordéon après toutes les options : en Q2.2.1, elle n'arrivait qu'après « Aucune de ces situations ».
- [8ea26bc](https://github.com/betagouv/transport-sanitaire/commit/8ea26bc) : donne enfin une issue à une consultation ordinaire sans séance en Q1.3 : elle vaut désormais « non éligible », comme les cas D41 et D42 de l'oracle.
- [8a7b5c5](https://github.com/betagouv/transport-sanitaire/commit/8a7b5c5) : présente les fiches patient positives (PMT, S3141, accord préalable) dans la liseuse, sur fond gris avec « Imprimer », et garde leurs badges lisibles en thème sombre.
- [d0f362b](https://github.com/betagouv/transport-sanitaire/commit/d0f362b) : referme deux failles de déni de service de niveau « high » signalées par l'audit de sécurité, en montant zod en 4.6.7 et body-parser en 2.4.0.
- [af1b897](https://github.com/betagouv/transport-sanitaire/commit/af1b897) : étend la zone « Résultat pour le prescripteur » à toute la page (stepper, titre, introduction, boutons), comme le gabarit, transport à l'étranger compris.
- [4be63de](https://github.com/betagouv/transport-sanitaire/commit/4be63de) : débloque l'adresse de départ en P3 d'un patient hospitalisé qui sort vers une HAD par « Autre déplacement » en Q2.5 puis « Admission en HAD » en Q2.6.
- [5b49923](https://github.com/betagouv/transport-sanitaire/commit/5b49923) : répare la vérification de staging, qu'un test cassait en important des lecteurs de PDF depuis leur ancien fichier.

### ♻️ Sous le capot

- [41077cd](https://github.com/betagouv/transport-sanitaire/commit/41077cd) : appelle « rattachement » ce que l'écran d'accueil recueille, un établissement et un service, pour ne plus laisser croire qu'une personne y est identifiée.
- [0f61a96](https://github.com/betagouv/transport-sanitaire/commit/0f61a96) : retire le code mort et les textes devenus faux depuis que l'écran d'accueil ne demande plus qui répond, et vérifie par un test qu'une identité envoyée par un ancien client est ignorée.
- [3000bf5](https://github.com/betagouv/transport-sanitaire/commit/3000bf5) : aligne le module du choix de mesure d'audience sur le vocabulaire de son dossier, sans changer le protocole échangé avec le site.
- [e52a497](https://github.com/betagouv/transport-sanitaire/commit/e52a497) : retire le mode test des règles, qui servait à essayer des règles sans livraison : la v10 repart d'un modèle neuf, et le moteur ne charge plus que les règles embarquées.
- [24a6c20](https://github.com/betagouv/transport-sanitaire/commit/24a6c20) : vide le simulateur de tout ce que portait la v9 (règles, questionnaire, parcours, résultats, Cerfa) et le remplace par un questionnaire factice de trois questions qui garde en vie la mécanique à reprendre en v10.
- [3950ae9](https://github.com/betagouv/transport-sanitaire/commit/3950ae9) : range le module Cerfa à la racine du front : le remplissage du document fait désormais partie du parcours, ce n'est plus un outil réservé ni une bêta.
- [b965f41](https://github.com/betagouv/transport-sanitaire/commit/b965f41) : range les seeds à la racine du front, puisque les tests les rejouent autant que l'écran qui les affiche ; seul cet écran reste un outil réservé.
- [7a426b5](https://github.com/betagouv/transport-sanitaire/commit/7a426b5) : donne aux outils réservés le nom anglais de developer tools dans le code, sans toucher au libellé affiché.
- [7f301b1](https://github.com/betagouv/transport-sanitaire/commit/7f301b1) : appelle Footer le pied de page du simulateur, dont le contenu ne se limite pas à la version.
- [7603231](https://github.com/betagouv/transport-sanitaire/commit/7603231) : place le point d'entrée du navigateur au-dessus du dossier de l'application, puisque c'est lui qui la monte.
- [382c942](https://github.com/betagouv/transport-sanitaire/commit/382c942) : appelle Container le cadre DSFR de chaque écran, que l'ancien nom faisait passer pour un écran pleine largeur.
- [8e5a89b](https://github.com/betagouv/transport-sanitaire/commit/8e5a89b) : nomme le numéro de la simulation en cours d'après ce qu'il représente, et non d'après le mécanisme React qui le consomme.
- [4b1699f](https://github.com/betagouv/transport-sanitaire/commit/4b1699f) : appelle « Developer tools » les outils réservés jusque dans les commentaires, la documentation et l'encadré affiché à l'écran.
- [2c7ad74](https://github.com/betagouv/transport-sanitaire/commit/2c7ad74) : appelle simplement « Seeds » l'écran qui liste les situations de référence, à l'écran comme dans le code.
- [20c2f89](https://github.com/betagouv/transport-sanitaire/commit/20c2f89) : appelle « écran de rattachement » l'écran d'accueil, d'après ce qu'il fait, au lieu d'un terme qu'il fallait expliquer à chaque lecture.
- [bc13a74](https://github.com/betagouv/transport-sanitaire/commit/bc13a74) : range chacun des trois écrans dans le module qu'il sert, pour qu'App ne fasse plus que choisir lequel afficher.
- [7ae6d1a](https://github.com/betagouv/transport-sanitaire/commit/7ae6d1a) : suffixe en Form les deux composants qui portent un formulaire, pour ne plus confondre le formulaire de rattachement et l'écran qui le monte.
- [a4abdeb](https://github.com/betagouv/transport-sanitaire/commit/a4abdeb) : donne au composant d'étapes le nom que lui donne le DSFR, Stepper, plutôt qu'une francisation que personne n'emploie.
- [d788a36](https://github.com/betagouv/transport-sanitaire/commit/d788a36) : nomme les champs du questionnaire comme le DSFR et HTML, FormField et FormFields, et lève l'interdiction de ces mots dans la garde de lisibilité.
- [92211ce](https://github.com/betagouv/transport-sanitaire/commit/92211ce) : passe le vocabulaire technique du code en anglais, en gardant le métier en français, et sort les champs de saisie génériques dans une bibliothèque d'interface qui ignore le questionnaire.
- [e551740](https://github.com/betagouv/transport-sanitaire/commit/e551740) : range les traces de débogage avec les developer tools, que le simulateur reçoit désormais en composants au lieu de les importer.
- [81878ef](https://github.com/betagouv/transport-sanitaire/commit/81878ef) : fusionne les deux traces de débogage en une seule, qui montre le chemin parcouru puis ce que l'écran en sait de plus.
- [82c138a](https://github.com/betagouv/transport-sanitaire/commit/82c138a) : appelle QuestionForm le formulaire des questions d'une page, d'après ce qu'il affiche et non la mécanique qui le pilote.
- [c439fed](https://github.com/betagouv/transport-sanitaire/commit/c439fed) : nomme le suivi d'audience d'après ce qu'il mesure, le questionnaire : son début, ses étapes, sa conclusion, son abandon.
- [032ba88](https://github.com/betagouv/transport-sanitaire/commit/032ba88) : nomme l'état du questionnaire d'après ce qu'il décrit, ses réponses validées et la page ouverte.
- [9b7d02d](https://github.com/betagouv/transport-sanitaire/commit/9b7d02d) : donne au fichier de l'état du questionnaire le nom du type qu'il exporte.
- [161811f](https://github.com/betagouv/transport-sanitaire/commit/161811f) : donne au hook qui pilote le questionnaire le nom du fichier où il vit.
- [610a628](https://github.com/betagouv/transport-sanitaire/commit/610a628) : donne au type que fournit ce hook le même nom que lui, Questionnaire.
- [94c508c](https://github.com/betagouv/transport-sanitaire/commit/94c508c) : aligne le nom du questionnaire factice sur le vocabulaire du reste du module.
- [c5585eb](https://github.com/betagouv/transport-sanitaire/commit/c5585eb) : distingue partout ce qui porte sur une question (préfixe Question) de ce qui porte sur l'ensemble (préfixe Questionnaire).
- [b8f86b0](https://github.com/betagouv/transport-sanitaire/commit/b8f86b0) : lève l'homonymie entre le composant du premier questionnaire et le type exporté du même nom, et appelle « questionnaire factice » l'ancien parcours factice.
- [9d7af29](https://github.com/betagouv/transport-sanitaire/commit/9d7af29) : nomme « commit » d'une page, en paire avec son brouillon, le geste qui efface les réponses dépendantes, pour ne plus le confondre avec la validation des saisies.
- [8c234f8](https://github.com/betagouv/transport-sanitaire/commit/8c234f8) : passe en anglais les identifiants du socle PDF, souvent des calques français accentués, sans changer aucun comportement.
- [27cc858](https://github.com/betagouv/transport-sanitaire/commit/27cc858) : passe en anglais les identifiants du module des seeds, en ne gardant que le mot seed, sans changer les textes affichés.
- [fe05e71](https://github.com/betagouv/transport-sanitaire/commit/fe05e71) : sépare le front en un socle, qui ne dépend d'aucune version du modèle, et un modèle, qu'un livrable de l'éditeur remplace : faire évoluer l'un n'oblige plus à lire l'autre.
- [3d2fcf9](https://github.com/betagouv/transport-sanitaire/commit/3d2fcf9) : déclare le questionnaire en parties qui contiennent leurs pages, comme le livrable de l'éditeur, au lieu d'une liste à plat où rang et total pouvaient se contredire.
- [647a3b2](https://github.com/betagouv/transport-sanitaire/commit/647a3b2) : fait passer le modèle au socle par un contrat, pour qu'une nouvelle version se livre sans rouvrir le socle ; le stepper s'affiche désormais aussi sur les résultats.
- [7a7203b](https://github.com/betagouv/transport-sanitaire/commit/7a7203b) : déduit des réponses l'écran où une seed s'ouvre, au lieu de le déclarer à part au risque de se contredire.
- [3f7656b](https://github.com/betagouv/transport-sanitaire/commit/3f7656b) : retire du point d'entrée du socle une fonction qu'aucun modèle n'appelle encore, en attendant le modèle qui s'en servira.
- [441cb90](https://github.com/betagouv/transport-sanitaire/commit/441cb90) : prévoit un dossier par modèle, puisque l'app embarquera celui de l'éditeur et le modèle de démonstration, et garde qu'aucun n'importe l'autre.
- [64e6fbd](https://github.com/betagouv/transport-sanitaire/commit/64e6fbd) : retire du socle toute mention du modèle de démonstration : l'app reçoit une liste de modèles et ouvre le premier, les developer tools proposant un bouton par modèle.
- [57bdc6a](https://github.com/betagouv/transport-sanitaire/commit/57bdc6a) : sort le contrôle d'une saisie du fichier des questions, qui approchait la limite de 300 lignes.
- [8b56e9e](https://github.com/betagouv/transport-sanitaire/commit/8b56e9e) : découpe quatre fonctions de champ passées au-dessus de 30 lignes, une par ce qu'elles font.
- [d8779d0](https://github.com/betagouv/transport-sanitaire/commit/d8779d0) : sépare ce qu'est une question de la forme qu'elle prend selon les réponses, le fichier dépassant 300 lignes.
- [fb6a1cb](https://github.com/betagouv/transport-sanitaire/commit/fb6a1cb) : écrit dossiers et fichiers en kebab-case, sauf le fichier d'un composant React, et fait tenir la règle par une garde.
- [7c1405c](https://github.com/betagouv/transport-sanitaire/commit/7c1405c) : réunit sous un seul « rappel » les deux façons de redire, au-dessus d'une question, ce qui est déjà connu.
- [30a7577](https://github.com/betagouv/transport-sanitaire/commit/30a7577) : dit qu'une page « s'affiche » plutôt qu'elle « se pose », formule calquée de l'anglais ; une question, elle, se pose toujours.
- [4e86a82](https://github.com/betagouv/transport-sanitaire/commit/4e86a82) : nomme ce qui s'affiche avec les mots que le moteur emploie déjà, asked pour une question et offered pour une option.
- [768e288](https://github.com/betagouv/transport-sanitaire/commit/768e288) : retire de l'outil en ligne de commande les specs et le dossier des tâches : un chantier se suit désormais dans une issue GitHub et ses sous-issues, seul endroit où lire et écrire son état.
- [22c75b7](https://github.com/betagouv/transport-sanitaire/commit/22c75b7) : partage les faits et les situations de départ des tests de référence, pour rejouer à part les sujets apportés par la v10.1.1.
- [9d03fd5](https://github.com/betagouv/transport-sanitaire/commit/9d03fd5) : range les 57 fichiers du modèle de l'éditeur par partie du parcours (P1, P2, R2), et garde qu'une partie ne lit pas celle qui la suit.
- [cb5b58b](https://github.com/betagouv/transport-sanitaire/commit/cb5b58b) : fait lire les réponses au modèle par des objets du socle, qui distinguent une case refusée d'une case jamais montrée sans que chaque fichier le recode.
- [1b9fc5e](https://github.com/betagouv/transport-sanitaire/commit/1b9fc5e) : ajoute aux réponses lues une négation explicite, qui se lit mieux qu'un point d'exclamation en tête d'une longue chaîne d'appels.
- [1894db1](https://github.com/betagouv/transport-sanitaire/commit/1894db1) : déclare chaque question du modèle par un constructeur nommé, qui tire sa sorte et ses options du catalogue de l'éditeur au lieu de les redire.
- [5419bc9](https://github.com/betagouv/transport-sanitaire/commit/5419bc9) : étend ces constructeurs au modèle de démonstration et au modèle factice des tests, et refuse désormais une question écrite en objet littéral.
- [fb512fa](https://github.com/betagouv/transport-sanitaire/commit/fb512fa) : nomme chaque absence possible d'une valeur de retour par un type explicite, au lieu d'un undefined muet, et fait tenir la règle par une garde.
- [baaf438](https://github.com/betagouv/transport-sanitaire/commit/baaf438) : sort le métier dans une racine sans écran, core/, que Node charge sans le navigateur, et le lit en objets : un fait déclaré une fois dans un fichier à lui, des cibles et des questions posées en objets valeur.
- [aed01f5](https://github.com/betagouv/transport-sanitaire/commit/aed01f5) : ouvre la chaîne de règles d'un fait par unFait(), qu'on lit d'abord comme la déclaration d'un fait, pour préparer la phase 1 de la règle d'or.
- [c942615](https://github.com/betagouv/transport-sanitaire/commit/c942615) : écrit les gardes, les résultats R2 et R3 et les faits en conditions qui savent ce qu'elles lisent, au lieu de fonctions qui lisaient ce qu'elles voulaient ; questions posées, faits et cibles restent identiques.
- [0a27695](https://github.com/betagouv/transport-sanitaire/commit/0a27695) : retire les trois derniers concepts partagés entre pages et faits : chaque page et chaque fait lit ses réponses là où il s'en sert, même écrites deux fois.
- [c06229a](https://github.com/betagouv/transport-sanitaire/commit/c06229a) : fait profiter la ligne de travail de la v10 de l'outil `tsp`, des hooks et de la fermeture automatique des issues, et lève ses conflits avec staging.
- [c5c9c65](https://github.com/betagouv/transport-sanitaire/commit/c5c9c65) : fait pointer les liens du pied de page, du journal des versions et du journal des décisions vers le nouveau nom du dépôt, betagouv/transport-sanitaire.
- [95282bd](https://github.com/betagouv/transport-sanitaire/commit/95282bd) : recopie tel quel le modèle v10.1.4 de l'éditeur, fait lire à R2 son catalogue de textes tel qu'il est livré, et retire les blancs en trop de ces textes.
- [90065dd](https://github.com/betagouv/transport-sanitaire/commit/90065dd) : reporte dans staging le journal et le numéro de la 0.4.0, livrée depuis main, pour que la 0.5.0 parte de la version publiée.

### ✅ Tests

- [d3672ae](https://github.com/betagouv/transport-sanitaire/commit/d3672ae) : ne garde que les tests qui décrivent ce que fait l'app : ceux qui vérifiaient l'absence des anciennes routes d'identité et du champ « Vous êtes » partent.
- [8d1404d](https://github.com/betagouv/transport-sanitaire/commit/8d1404d) : achève de remplacer « flow » par « questionnaire » dans l'app, jusque dans les fichiers de test.
- [1cbdc90](https://github.com/betagouv/transport-sanitaire/commit/1cbdc90) : vérifie qu'un modèle livré tient ce que le socle suppose de lui (questions et pages aux identifiants uniques, dépendances vers des questions existantes), et rejoue chaque seed contre ses attendus, quel que soit le modèle.
- [0dc17c3](https://github.com/betagouv/transport-sanitaire/commit/0dc17c3) : donne aux tests du socle leur propre copie du modèle factice, pour qu'ils ne changent plus quand le modèle de l'app change.
- [dba97a3](https://github.com/betagouv/transport-sanitaire/commit/dba97a3) : rejoue les 2 048 combinaisons de Q1.2 (1 151 acceptées, 897 refusées) et vérifie qu'au retour en P1, retirer le brancard efface la corpulence sans toucher l'ALD ni le mineur.
- [4b44df4](https://github.com/betagouv/transport-sanitaire/commit/4b44df4) : vérifie la case « ALD non exonérante » d'un mineur en soins prolongés sur chaque volet de la PMT et de la DAP, et sa mention, une seule fois, sur le volet médical.
- [3551972](https://github.com/betagouv/transport-sanitaire/commit/3551972) : rejoue les 21 scénarios de frontière entre issues de la recette v10.1.3 (B01 à B21), qui passent tous sans toucher aux règles.
- [5925ef5](https://github.com/betagouv/transport-sanitaire/commit/5925ef5) : rejoue les 133 scénarios de démonstration de l'éditeur, qui donnent les mêmes 55 cibles que nos règles.
- [c093ead](https://github.com/betagouv/transport-sanitaire/commit/c093ead) : compare, champ par champ, les textes de R2 à ceux des scénarios de démonstration de l'éditeur : ils sont identiques sur tout ce que l'app peut atteindre.
- [cf9bad6](https://github.com/betagouv/transport-sanitaire/commit/cf9bad6) : corrige l'en-tête du test du parcours de référence ALD, qui présentait comme un écart un cas prévu par la spécification.
- [d82d938](https://github.com/betagouv/transport-sanitaire/commit/d82d938) : couvre les quatre profils ALD et mineur de la recette N2, de la réponse au premier résultat, et les deux paires d'options de Q1.2 qui s'excluent ; la recette N3 l'était déjà entièrement.
- [e069d88](https://github.com/betagouv/transport-sanitaire/commit/e069d88) : nomme les tests issus de la recette N2 d'après ce qu'ils vérifient (parcours ALD et mineur, mode de transport) plutôt que d'après leur origine.
- [8c51042](https://github.com/betagouv/transport-sanitaire/commit/8c51042) : stabilise le test de R3 à l'écran sous la suite complète, en accordant quatre secondes à la génération du PDF au lieu d'une.
- [27c61e3](https://github.com/betagouv/transport-sanitaire/commit/27c61e3) : vérifie les points de la recette N4 sur les documents (case du centre de référence, texte médical sans nom de règle, fiches patient sans identifiant technique), avec une nouvelle seed d'un mineur en soins prolongés.
- [ec82188](https://github.com/betagouv/transport-sanitaire/commit/ec82188) : reprend en tests les compléments de recette de l'éditeur (v10.1.4) sur P1, P2, les lieux, le retour pénitentiaire, les résultats et P3, et corrige un test des dates de la S3141 qui passait même faux.

### 📝 Documentation

- [5544efe](https://github.com/betagouv/transport-sanitaire/commit/5544efe) : décrit dans les ADR le rattachement par établissement et service, sans identité du prescripteur ni drapeau de consentement Matomo.
- [b2904a9](https://github.com/betagouv/transport-sanitaire/commit/b2904a9) : explique dans les ADR pourquoi le service part à Matomo sous son identifiant du référentiel en clair plutôt que haché, et décrit le rattachement dégradé.
- [019d4e5](https://github.com/betagouv/transport-sanitaire/commit/019d4e5) : consigne que l'opposition au suivi se règle dans le pied de page du CMS Sites Conformes et se transmet à l'iframe, et que le suivi des liens sortants est retiré.
- [523f4b7](https://github.com/betagouv/transport-sanitaire/commit/523f4b7) : décrit dans le README et l'AGENTS.md une app entre deux modèles, vidée du modèle v9, et retire neuf documents de domaine partis avec son code.
- [4cd473b](https://github.com/betagouv/transport-sanitaire/commit/4cd473b) : ramène les en-têtes de cinquante fichiers à ce que le fichier permet de faire, en quelques phrases courtes.
- [d22abdc](https://github.com/betagouv/transport-sanitaire/commit/d22abdc) : simplifie les commentaires du code et des tests (phrases courtes, mots simples) et corrige deux renvois périmés.
- [7e70536](https://github.com/betagouv/transport-sanitaire/commit/7e70536) : fait dire aux commentaires l'état présent de l'app, sans annonce d'un modèle à venir ni renvoi à une version du livrable.
- [e0ae337](https://github.com/betagouv/transport-sanitaire/commit/e0ae337) : écrit le plan de séparation du socle et du modèle en dix chantiers, avec son journal des décisions (D-01 à D-74) et le suivi des questions à l'éditeur.
- [056136f](https://github.com/betagouv/transport-sanitaire/commit/056136f) : ouvre chez l'éditeur un ticket dédié à l'adresse qui contredit la distance déclarée, invérifiable sans calcul d'itinéraire, avec une suggestion : rappeler la tranche sans bloquer.
- [dd13c30](https://github.com/betagouv/transport-sanitaire/commit/dd13c30) : met le plan de la v10 à jour de la v10.0.1 (63 faits, 49 cas d'oracle, gabarits remplissables) et des réponses de l'éditeur du 12 octobre.
- [b83d9cd](https://github.com/betagouv/transport-sanitaire/commit/b83d9cd) : explique pourquoi le modèle v10.0.0 quitte la branche v10, qui ne garde que le socle : la v10.0.2 change les règles et les faits.
- [f1a3cd5](https://github.com/betagouv/transport-sanitaire/commit/f1a3cd5) : dresse la liste des 21 capacités que la v10 demande au socle, dont 19 se codent sans attendre la v10.0.2.
- [cbf2c76](https://github.com/betagouv/transport-sanitaire/commit/cbf2c76) : fait du modèle factice un second modèle durable de l'app, choisi dans les developer tools, pour valider chaque capacité du socle à l'écran.
- [8312666](https://github.com/betagouv/transport-sanitaire/commit/8312666) : précise qu'il existe deux modèles factices, celui de l'app qui grandit avec le socle et celui des tests qui reste figé, et qu'une capacité du socle arrive avec ses tests, sa page de démonstration et sa seed.
- [c4785f4](https://github.com/betagouv/transport-sanitaire/commit/c4785f4) : marque comme faites les capacités 10 et 11 du socle, le rappel et la donnée fixée : il en reste dix.
- [c526ee0](https://github.com/betagouv/transport-sanitaire/commit/c526ee0) : revoit les capacités du socle d'après la v10.0.2 (PDF rempli puis aplati, texte trop long jamais bloquant, fait à trois états) : il en reste 11, en quatre groupes.
- [d846b28](https://github.com/betagouv/transport-sanitaire/commit/d846b28) : range le journal des décisions de la v10 dans docs/knowledge/adr/ et laisse le plan aux issues GitHub (issue 50), dont docs/tasks n'était que la copie.
- [80b42b5](https://github.com/betagouv/transport-sanitaire/commit/80b42b5) : corrige le journal : l'incohérence de la permission (D-107) reste à remonter à l'éditeur.
- [3f52bee](https://github.com/betagouv/transport-sanitaire/commit/3f52bee) : consigne (D-109) que Q2.2.2 à Q2.2.4, simples rattrapages dans la v10.1.1, ne se posent jamais dans l'app.
- [5caff2b](https://github.com/betagouv/transport-sanitaire/commit/5caff2b) : note la validation à l'écran de la lecture du retour pénitentiaire (D-118) ; reste l'avis de l'éditeur.
- [daaebf5](https://github.com/betagouv/transport-sanitaire/commit/daaebf5) : explique dans l'AGENTS.md comment le modèle déclare ses questions et ses faits, et ce que reçoit une condition.
- [dd790fd](https://github.com/betagouv/transport-sanitaire/commit/dd790fd) : met les six skills du dépôt à l'heure de la v10, alors que 78 des chemins qu'ils citaient n'existaient plus, déplace leurs règles dans docs/knowledge/ et en renomme quatre.
- [8b9ee15](https://github.com/betagouv/transport-sanitaire/commit/8b9ee15) : étoffe le glossaire de l'app des termes arbitrés depuis le chantier 01, chacun avec le mot de l'éditeur, et retient « prescripteur » partout, jusque dans le code.
- [933b150](https://github.com/betagouv/transport-sanitaire/commit/933b150) : consigne dans le journal (D-211 à D-215) et l'ADR-23 ce qu'est une garde, la condition qui dit quand une question se pose ou une option se propose.
- [96460f5](https://github.com/betagouv/transport-sanitaire/commit/96460f5) : explique pourquoi les gardes `mattersWhile` restent (D-227) : sur 53 parcours, le graphe pose toujours une question qu'une garde cachait.
- [b621006](https://github.com/betagouv/transport-sanitaire/commit/b621006) : ne fait plus remonter à l'éditeur que Q2.1 et Q2.13.depart : remplie jusqu'au bout, Q2.7 ne change ni l'issue ni le cerfa.
- [258cdc1](https://github.com/betagouv/transport-sanitaire/commit/258cdc1) : remplace D-57 par D-236 : les 49 cas de l'oracle se rejouent en faits, et les seeds suivent les issues plutôt que les cas.
- [4f1e4e4](https://github.com/betagouv/transport-sanitaire/commit/4f1e4e4) : allège le retour à l'éditeur de la rubrique « Levés », pour n'y garder que ce qui l'attend.

## [0.4.0](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%400.4.0), 29 septembre 2026

Trois montées du modèle d'éligibilité, de la v9.7.0 à la v9.7.3, et
l'intégration complète du mapping documentaire de la v9.7 sur les trois Cerfa.
57 commits depuis la 0.3.0.

### TL;DR

- Le modèle passe de la v9.7.0 à la v9.7.3 en trois pas (v9.7.1, v9.7.2, v9.7.3), chacun rejoué sur sa propre recette.
- Les tableaux de remplissage du PMT, de la DAP et du S3141 (nouveau, jamais produit jusqu'ici) lisent tous le mapping documentaire de la v9.7 : préremplissage, checklist du Bloc 3 et PDF partagent désormais la même source.
- Une convocation longue distance ou aérienne peut désormais orienter vers la caisse pour accord préalable, un huitième cas final.
- Toute réponse modifiée efface systématiquement les réponses en aval, et les lieux déduits s'affichent au lieu d'être redemandés, jusque dans le Résultat 2.
- Les 21 tickets de l'intégration v9.7.3 sont clos : contradictions bloquées (EHPAD/USLD, radiothérapie, retour pénitentiaire...), ordre du parcours aligné sur le contrat, adresses et texte médical lisibles sur les PDF.
- La documentation du dépôt passe en divulgation progressive (docs/knowledge/), et les évènements Matomo portent un nom fixe, vérifié à la compilation.
- La suite de tests passe de 791 à 1531 tests (4 ignorés).

### ✨ Nouveautés

- [e6fbd85](https://github.com/betagouv/transport-sanitaire/commit/e6fbd85) : fait porter l'origine du mapping documentaire (publicodes, application, externe, manuel) à chaque case du Bloc 3, ce qui prépare le branchement des tableaux de remplissage sur la même feuille.
- [0e93d83](https://github.com/betagouv/transport-sanitaire/commit/0e93d83) : complète la transcription des trois Cerfa dans le mapping documentaire — les lignes manquantes (en-tête bénéficiaire, organisme, adresses, prescripteur, signature...) rejoignent celles déjà lues.
- [dab06e4](https://github.com/betagouv/transport-sanitaire/commit/dab06e4) : fait lire le préremplissage CERFA depuis le mapping documentaire plutôt que sa propre logique — il suit désormais les mêmes cases que la checklist.
- [e2a9ec9](https://github.com/betagouv/transport-sanitaire/commit/e2a9ec9) : branche le tableau de remplissage du PMT sur le mapping documentaire — neuf champs jusque-là marqués « hors modèle » se remplissent réellement (mode, ALD, exonérations, dates d'accident...).
- [87ddc2d](https://github.com/betagouv/transport-sanitaire/commit/87ddc2d) : branche le tableau de remplissage de la DAP sur le mapping documentaire, et corrige au passage deux cases qui lisaient la mauvaise réponse.
- [1d938e1](https://github.com/betagouv/transport-sanitaire/commit/1d938e1) : branche le tableau de remplissage du S3141 sur le mapping documentaire — ce troisième document, jusqu'ici jamais produit, se génère désormais.
- [4230420](https://github.com/betagouv/transport-sanitaire/commit/4230420) : porte le modèle en v9.7.1 — une convocation longue distance ou aérienne peut désormais orienter vers la caisse pour accord préalable, un huitième cas final.
- [a528304](https://github.com/betagouv/transport-sanitaire/commit/a528304) : adapte au cas d'une convocation les libellés du nombre de transports et de la justification de distance.
- [aea8118](https://github.com/betagouv/transport-sanitaire/commit/aea8118) : donne au patient la marche à suivre de l'orientation vers la caisse — contacter la caisse, garder la convocation et la synthèse.
- [4dae9ae](https://github.com/betagouv/transport-sanitaire/commit/4dae9ae) : fait reposer la mosaïque de caractéristiques d'une convocation (distance, avion, bateau) quand le trajet change réellement, plutôt que de garder des caractéristiques établies pour un autre trajet.
- [87888d7](https://github.com/betagouv/transport-sanitaire/commit/87888d7) : compose enfin les éléments d'ordre médical du PMT et de la DAP, obligatoires sur la prescription — le motif et la justification de la DAP ne se recopient plus à la main.
- [de8cf71](https://github.com/betagouv/transport-sanitaire/commit/de8cf71) : porte le modèle en v9.7.2, un correctif qui répare l'attente d'accord préalable sur la branche « orientation vers la caisse », restée muette jusque-là.
- [4470660](https://github.com/betagouv/transport-sanitaire/commit/4470660) : rend les textes validés par le porteur pour l'orientation vers la caisse (reste à charge, cas retenu, points à vérifier), qui remplacent les textes provisoires de la v9.7.1.
- [32d2bc0](https://github.com/betagouv/transport-sanitaire/commit/32d2bc0) : remplace le texte qui mélangeait asepsie et désinfection du véhicule par un texte distinguant les deux, sur les deux pages de résultat.
- [6c5df99](https://github.com/betagouv/transport-sanitaire/commit/6c5df99) : signale dans la mosaïque de convocation quand le transport aérien ou maritime est déjà connu par ailleurs, et masque l'option devenue redondante.
- [af89767](https://github.com/betagouv/transport-sanitaire/commit/af89767) : porte le modèle en v9.7.3 — trois questions retirées, une nouvelle (retour pénitentiaire), et les lieux déduits absorbés dans le modèle.
- [7db288a](https://github.com/betagouv/transport-sanitaire/commit/7db288a) : contextualise le résultat de l'orientation vers la caisse pour un avion/bateau hors convocation — « Votre déplacement » remplace « Votre convocation » quand aucune convocation n'existe.
- [920d128](https://github.com/betagouv/transport-sanitaire/commit/920d128) : affiche un lieu déduit (arrivée en structure de soins, par exemple) au lieu de le redemander, et invalide l'adresse devenue incompatible quand le motif change.
- [de20995](https://github.com/betagouv/transport-sanitaire/commit/de20995) : montre au Résultat 2 chaque lieu déduit, avec son origine, pour que le prescripteur les vérifie avant impression.
- [e6f50f4](https://github.com/betagouv/transport-sanitaire/commit/e6f50f4) : imprime désormais le texte médical intégral dans le volet 1 du Cerfa, sans annexe, et le propose à révision quand il déborde du cadre.
- [0807e3a](https://github.com/betagouv/transport-sanitaire/commit/0807e3a) : efface systématiquement les réponses en aval d'une réponse modifiée, quelle que soit la question, conformément au contrat d'interface.

### 🐛 Corrections

- [f999893](https://github.com/betagouv/transport-sanitaire/commit/f999893) : monte js-yaml en 4.3.2, qui corrige une vulnérabilité de déni de service par CPU signalée par l'audit de sécurité.
- [49d077a](https://github.com/betagouv/transport-sanitaire/commit/49d077a) : retire l'option « Domicile » de l'arrivée dès que le départ l'a déjà prise, un trajet domicile-domicile étant interdit.
- [3d3beff](https://github.com/betagouv/transport-sanitaire/commit/3d3beff) : réaffiche l'adresse déjà saisie (rue, code postal, ville) quand sa page revient après un retour en arrière — elle ne montrait plus que le complément et le pays.
- [c14de74](https://github.com/betagouv/transport-sanitaire/commit/c14de74) : affiche la raison principale du déplacement en radios quelle que soit sa taille, plutôt qu'en liste déroulante au-delà de dix réponses, et masque trois options tant qu'elles ne sont pas déclarées en Partie 1.
- [53052fe](https://github.com/betagouv/transport-sanitaire/commit/53052fe) : verrouille par un test qu'un avion/bateau sans sous-situation Cerfa ne réclame aucune adresse de trajet.
- [d438043](https://github.com/betagouv/transport-sanitaire/commit/d438043) : bloque cinq combinaisons contradictoires de raison de déplacement et de lieu d'arrivée (EHPAD, USLD, établissement pénitentiaire...) restées passantes malgré le modèle v9.7.3.
- [a4b8ba7](https://github.com/betagouv/transport-sanitaire/commit/a4b8ba7) : verrouille par des tests les garde-fous déjà en place sur un retour pénitentiaire incompatible avec le contexte déclaré.
- [8da754a](https://github.com/betagouv/transport-sanitaire/commit/8da754a) : agrandit la police minimale d'une adresse trop longue sur les PDF, illisible à l'impression faute de plancher.
- [8cfa0c5](https://github.com/betagouv/transport-sanitaire/commit/8cfa0c5) : referme une faille qui laissait passer l'exception radiothérapie sur un transfert définitif, malgré son masquage à l'écran.
- [9f9773d](https://github.com/betagouv/transport-sanitaire/commit/9f9773d) : bloque la génération d'un PMT quand une exception EHPAD ou USLD est cochée sans lieu de ce type sur le trajet, et explique au prescripteur laquelle des deux réponses corriger.
- [a7fa91d](https://github.com/betagouv/transport-sanitaire/commit/a7fa91d) : verrouille par des tests que l'exception radiothérapie reste réservée à une séance déclarée en Partie 1.
- [f0847d1](https://github.com/betagouv/transport-sanitaire/commit/f0847d1) : borne le nombre de trajets d'une DAP de permission à ce que sa période autorise réellement, au lieu d'accepter n'importe quel total.
- [4479a71](https://github.com/betagouv/transport-sanitaire/commit/4479a71) : n'affiche plus « Nombre de transports itératifs : 1 » sur la checklist d'une PMT à trajet unique, cohérent avec ce que le PDF laisse vide.

### ♻️ Sous le capot

- [da19c08](https://github.com/betagouv/transport-sanitaire/commit/da19c08) : sort les frais à prévoir d'un refus de Bloc1Resultat.tsx, qui frôlait la limite de 300 lignes.
- [7c84822](https://github.com/betagouv/transport-sanitaire/commit/7c84822) : sort l'orientation vers la caisse de Bloc1Resultat et EtapesPatient dans son propre fichier, pour la même raison.
- [a222491](https://github.com/betagouv/transport-sanitaire/commit/a222491) : réorganise secretariat/ en dossiers dédiés (résultat, rubriques du mapping) plutôt qu'un seul niveau plat.
- [5ef3a15](https://github.com/betagouv/transport-sanitaire/commit/5ef3a15) : fait saisir directement les précisions médicales (motif, détail d'un transfert) plutôt que de les choisir dans une liste, avec un contrôle qui bloque un libellé générique ou un texte trop long.
- [90149a6](https://github.com/betagouv/transport-sanitaire/commit/90149a6) : pose les exceptions et contextes complémentaires d'un transfert après sa qualification, dans l'ordre du contrat d'interface, plutôt qu'avant.
- [b85e684](https://github.com/betagouv/transport-sanitaire/commit/b85e684) : pose l'urgence après le trajet et la distance, comme le veut le contrat d'interface v9.7.3.
- [d01039b](https://github.com/betagouv/transport-sanitaire/commit/d01039b) : fige le nom de chaque évènement Matomo (outil et statut compris) dans un référentiel vérifié à la compilation, au lieu de le composer à l'exécution.

### ✅ Tests

- [538c0ec](https://github.com/betagouv/transport-sanitaire/commit/538c0ec) : couvre les neuf champs du PMT nouvellement branchés sur le mapping documentaire.
- [f3466d9](https://github.com/betagouv/transport-sanitaire/commit/f3466d9) : couvre les quatre champs de la DAP nouvellement branchés sur le mapping documentaire.
- [c916ff2](https://github.com/betagouv/transport-sanitaire/commit/c916ff2) : couvre les 46 champs du S3141 nouvellement branchés sur le mapping documentaire.
- [e2c61d4](https://github.com/betagouv/transport-sanitaire/commit/e2c61d4) : étend la couverture de l'orientation caisse au parcours hors convocation (avion/bateau en situation spéciale).
- [a187bd3](https://github.com/betagouv/transport-sanitaire/commit/a187bd3) : porte la recette de la v9.7.1 — convocation, financement et asepsie, quatre suites transposées du livrable.
- [b2bd1f0](https://github.com/betagouv/transport-sanitaire/commit/b2bd1f0) : porte la recette de la v9.7.2 — les suites qui vérifient le correctif de l'attente d'accord préalable.
- [fa8a087](https://github.com/betagouv/transport-sanitaire/commit/fa8a087) : porte la recette complète de la v9.7.3, campagne de l'éditeur comprise — `pnpm verifier` passe pour la première fois depuis le début de l'intégration.
- [6969366](https://github.com/betagouv/transport-sanitaire/commit/6969366) : retire la version du modèle des noms et des titres de la recette, qui datait inutilement des fichiers valables pour tout modèle qui passe leurs tests.

### 📝 Documentation

- [2396902](https://github.com/betagouv/transport-sanitaire/commit/2396902) : documente dans l'AGENTS.md où vit le mapping documentaire et sa correspondance id vers règle.
- [7385d0a](https://github.com/betagouv/transport-sanitaire/commit/7385d0a) : documente dans l'AGENTS.md la composition des éléments d'ordre médical.
- [dd530a3](https://github.com/betagouv/transport-sanitaire/commit/dd530a3) : met le README à l'heure de la v9.7.1.
- [89080fc](https://github.com/betagouv/transport-sanitaire/commit/89080fc) : met le README à l'heure de la v9.7.2.
- [e491e86](https://github.com/betagouv/transport-sanitaire/commit/e491e86) : réorganise toute la documentation du dépôt en docs/knowledge/, à divulgation progressive — un agent ne charge plus tout le contenu quand la tâche n'en a besoin que d'une partie.
- [45e0efe](https://github.com/betagouv/transport-sanitaire/commit/45e0efe) : ébauche la spec d'extraction d'un module cerfa.
- [13cf747](https://github.com/betagouv/transport-sanitaire/commit/13cf747) : renomme le skill d'intégration d'une version du modèle, qui délègue désormais la découpe en tickets à /to-tasks puis /implement.
- [bd08c64](https://github.com/betagouv/transport-sanitaire/commit/bd08c64) : met le README à l'heure de la v9.7.3 — 324 règles, 76 cibles, et le tableau des fichiers de recette par version.

## [0.3.0](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%400.3.0), 10 septembre 2026

La montée du modèle d'éligibilité de la v9.5.1 à la v9.7.0, et le passage du
contrat d'interface au rang de source de ce que l'application déduisait
elle-même. Huit commits depuis la 0.2.0.

### TL;DR

- Le modèle passe de la v9.5.1 à la v9.7.0 : 294 règles contre 188, 74 cibles contre 42, 115 questions contre 69. La v9.6 n'a jamais été intégrée.
- Le contexte administratif devient une raison principale à choix unique, la case « séance » éclate en trois, et la branche « patient détenu » disparaît.
- Trois sorties directes de la Partie 1 sont retirées, le SMUR, le seul motif bariatrique et la prestation non prise en charge, au profit d'un septième cas final : la prescription S3141.
- Quatre conditions d'accord préalable entrent dans les motifs ouvrant droit : la distance de plus de 150 km, la série, le CAMSP/CMPP et le SAMSAH.
- L'ordre du parcours, les bornes de saisie, les formes de saisie et les cases des trois Cerfa se déclarent désormais d'après le contrat d'interface, au lieu d'être déduits.
- Six dates se saisissent en champ de date ou d'heure, là où le questionnaire offrait du texte libre.
- Le Résultat 2 s'imprime quel que soit le cas final, et porte sa date de prescription.
- La suite de tests passe de 473 à 792 tests, la recette du livrable comptant à elle seule 275 cas.

### ✨ Nouveautés

- [65cc893](https://github.com/betagouv/transport-sanitaire/commit/65cc893) : lit du modèle les cases des trois Cerfa. La v9.7 livre une correspondance documentaire qui nomme, pour chaque zone du PMT S3138g, de la DAP S3139h et du S3141, la règle qui la décide et la condition qui la fait exister. L'application les déduisait jusqu'ici des critères médicaux et du libellé du mode, et se trompait de plusieurs façons : une position allongée se listait sans ambulance, un TPMR ne cochait pas le transport assis professionnalisé dont il relève, le SAMSAH réclamait une case qui n'existe sur aucun formulaire, et le nombre affiché était celui qui est prévu plutôt que celui que le document couvre. Le S3141, que le contrat d'interface ne décrit pas, gagne ses six rubriques.
- [2633a0b](https://github.com/betagouv/transport-sanitaire/commit/2633a0b) : ouvre l'impression du Résultat 2 quel que soit le cas final, et le date. Quand aucun Cerfa n'est dû, c'est cette page qui part au patient, en synthèse et jamais en prescription factice ; les commandes et le pied de page se retirent du papier. La date de prescription vient de l'application et non du modèle, se pose à l'arrivée sur la page et s'y tient : revenir au questionnaire puis en ressortir ne redate pas la prescription, et une simulation menée à 23 h 30 à Paris ne date pas du lendemain.
- [8ce19db](https://github.com/betagouv/transport-sanitaire/commit/8ce19db) : rend les contenus et les couleurs de la v9.7, désormais fixés par le contrat d'interface et par les cibles du modèle. Le Résultat 1 nomme le mode dans son titre et reste toujours bleu, puisqu'il ne tranche que le médical : une teinte verte ou rouge y faisait lire un accord ou un refus qui n'y sont pas. Le Résultat 2 titre ce que la prise en charge permet plutôt que ce qu'elle garantit, dit au patient ce qu'il engage s'il organise quand même son déplacement, et prend sa couleur du modèle, là où la table tenue à la main rendait en orange un transport à la charge de l'établissement que le contrat veut vert.
- [e346684](https://github.com/betagouv/transport-sanitaire/commit/e346684) : pose les saisies de date et d'heure du questionnaire. Les six dates que la v9.7 recueille, début d'une hospitalisation, deux bornes et fin d'une permission, AT/MP et accident causé par un tiers, se rendaient en champ libre : publicodes ne connaît pas la date, et l'application aurait eu à deviner le format dont dépend l'admissibilité au S3141. Quatre dates et deux instants se distinguent désormais, la limite de quarante-huit heures se comptant à l'heure près.
- [a79c187](https://github.com/betagouv/transport-sanitaire/commit/a79c187) : passe le modèle en v9.7, soit 294 règles et 74 cibles. Le saut se fait depuis la v9.5.1, la v9.6 n'ayant jamais été intégrée, et aucune des 118 règles communes n'est restée identique. Trois choses ont quitté le modèle et se déclarent maintenant dans l'application : l'ordre du parcours, les bornes d'une saisie chiffrée, et onze entrées qu'il faut calculer sans jamais les poser, faute de quoi le questionnaire les réclamait comme des questions et s'ouvrait sur une saisie sans énoncé. Deux défauts sont corrigés en passant : le Résultat 2 affichait « false » en guise de titre, et les entrées calculées n'atteignaient ni le raccourci de seed ni la conclusion du parcours.

### ♻️ Sous le capot

- [5dfac7a](https://github.com/betagouv/transport-sanitaire/commit/5dfac7a) : déclare l'ordre des étapes du parcours, que le classement des variables manquantes de publicodes fixait jusqu'ici. Personne ne l'avait choisi, et une règle citée une fois de plus pouvait déplacer sa question. L'ordre déclaré est celui que le parcours suivait déjà, relevé sur les trente-deux situations de référence qui s'accordent sans exception : rien ne change pour le prescripteur.

### ✅ Tests

- [618b07d](https://github.com/betagouv/transport-sanitaire/commit/618b07d) : porte la recette v9.7, 275 cas contre une trentaine en v9.5.1. Le livrable ne donne pas des situations mais des options, qu'un adaptateur de référence traduit en réponses ; sans cette traduction, aucun de ses cas n'est rejouable ici. Les 225 cas engendrés reproduisent le produit croisé de cinq modes, cinq motifs, trois tranches de distance et trois nombres de transports, et les cinquante cas nommés se répartissent par sujet. La grille rend lisible une règle que le journal des évolutions ne dit pas : un critère clinique d'ambulance ouvre le droit à lui seul, là où un besoin d'aide professionnelle ne le fait pas.

### 📝 Documentation

- [065f299](https://github.com/betagouv/transport-sanitaire/commit/065f299) : remonte à l'éditeur la fusion des motifs ouvrant droit et des conditions d'accord préalable. Vingt-quatre des 225 cas de la grille rendent remboursable un déplacement qu'aucun motif ne couvre dès qu'il dépasse 150 km, là où la v9.5.1 et la v9.6.0 tenaient les deux jugements séparés ; c'est bien ce que la matrice livrée attend, d'où une question posée plutôt qu'un défaut signalé. Une erreur de notre premier constat est corrigée au passage : un critère d'ambulance ouvrant le droit à lui seul n'est pas nouveau en v9.7, il figurait déjà parmi les motifs en v9.5.1.

## [0.2.0](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%400.2.0), 27 août 2026

Deux montées du modèle d'éligibilité, de la v9.4.1 à la v9.5.1, et le passage du
dépôt en workspace pnpm. Dix-neuf commits depuis la 0.1.2.

### TL;DR

- Le modèle passe de la v9.4.1 à la v9.5.1 : 188 règles, 42 cibles.
- Le questionnaire se resserre : Q1 absorbe l'urgence vitale SMUR, A2.1 et A2.2 fondent en une seule question, A3.8 disparaît.
- L'urgence médicale attestée ne supprime pas la demande d'accord préalable, elle supprime l'attente de la décision.
- L'accompagnement par un proche n'impose plus à lui seul une demande d'accord préalable : c'était une régression de la v9.5.0, remontée à l'éditeur et corrigée par la v9.5.1.
- Les deux transports assis retrouvent la marche à suivre du patient, muette sur treize seeds sur vingt.
- La trace du parcours s'ouvre au service produit, y compris en production.
- Le serveur refuse désormais de démarrer en production sans ses secrets, au lieu de se replier en silence.
- La suite de tests passe de 403 à 473 tests.

### ✨ Nouveautés

- [28b95fd](https://github.com/betagouv/transport-sanitaire/commit/28b95fd) : ouvre la trace du parcours au service produit, sur tous les environnements. Le prescripteur qui signalait un séquencement inattendu ne pouvait rien montrer : la trace du chemin parcouru et des réponses saisies n'existait pas dans le build déployé. Elle devient le troisième outil produit, derrière la même porte que la galerie de seeds et le labo.
- [3246572](https://github.com/betagouv/transport-sanitaire/commit/3246572) : distingue l'urgence médicale attestée de l'attente d'une décision. Une cause réglementaire de demande d'accord préalable en reste une, mais l'urgence lève le délai de quinze jours : la page de résultat dit alors le S3139h valant prescription, la réalisation immédiate et la prescription a posteriori. Les cases d'urgence des deux CERFA lisent désormais le type d'urgence que le modèle tranche, l'exception d'aide médicale urgente comprise.
- [0836f83](https://github.com/betagouv/transport-sanitaire/commit/0836f83) : passe le modèle en v9.5.1, qui défait la régression qu'on avait remontée à l'éditeur. L'accompagnement par un proche n'impose plus à lui seul une demande d'accord préalable : les motifs exposés passent de sept à six, et une prescription peut de nouveau porter un accompagnant. A2.4 gagne au passage la définition validée du dispositif Engagement maternité.
- [1de1038](https://github.com/betagouv/transport-sanitaire/commit/1de1038) : rend les quatre contenus que le contrat d'interface de la v9.5.0 ajoute ou réécrit. Le verdict médical dit la portée de sa décision au lieu de parler de coût, le verdict bariatrique dit ce qui manque plutôt que ce que la contrainte n'est pas, la page administrative trace le motif ALD quand il est retenu, et la case du nombre de transports porte le chiffre exact au lieu de le laisser à recopier.
- [afc1052](https://github.com/betagouv/transport-sanitaire/commit/afc1052) : passe le modèle en v9.5.0, soit 187 règles et 40 cibles. Q1 absorbe l'urgence vitale SMUR en quatrième réponse et M0 devient inapplicable derrière elle, A2.1 et A2.2 fondent en une seule question dont seul « Aucun de ces cas » poursuit le parcours, et A3.8 disparaît de même.
- [f7d5a84](https://github.com/betagouv/transport-sanitaire/commit/f7d5a84) : arrête le serveur au démarrage si une variable manque en production. Sans `GRIST_API_KEY` ni `PSEUDONYMISATION_SECRET`, il se repliait en silence sur un référentiel factice et sur un secret que tout le monde peut lire : le simulateur aurait servi des établissements inventés et signé ses refs Matomo avec un secret public. Hors production, les deux replis et leurs avertissements ne bougent pas.

### 🐛 Corrections

- [404cb01](https://github.com/betagouv/transport-sanitaire/commit/404cb01) : rétablit la marche à suivre des deux transports assis. Deux clés écrites en abrégé ne correspondaient plus à ce que le modèle nomme, et un mode introuvable ne rend rien sans rien dire : sur treize seeds sur vingt, l'écran s'arrêtait avant les deux phrases qui disent quoi faire du document, organiser le transport et présenter la prescription au transporteur.

### ♻️ Sous le capot

- [9829cb8](https://github.com/betagouv/transport-sanitaire/commit/9829cb8) : passe le dépôt en workspace pnpm. Les trois apps tenaient trois installations npm indépendantes, où rien n'empêchait Biome, TypeScript, vitest et knip de diverger ; les versions partagées vivent désormais dans un `catalog:` unique, et la divergence n'est plus exprimable. Les apps restent indépendantes de code, et le déploiement Scalingo se fait maintenant depuis la racine.

### ✅ Tests

- [5eff34f](https://github.com/betagouv/transport-sanitaire/commit/5eff34f) : porte la recette v9.5.1, six scénarios nés du correctif. Deux verrouillent la régression défaite, et quatre décrivent l'urgence médicale attestée : sans motif réglementaire elle conclut à une prescription, avec un motif elle laisse la demande en place mais lève l'attente.
- [1914314](https://github.com/betagouv/transport-sanitaire/commit/1914314) : porte la recette v9.5.0, six familles que rien ne couvrait encore. Elles constatent à l'écran qu'aucune vue ne propose plus le SMUR en M0 ni ne redemande l'accompagnement, que la huitième réponse d'A2.1 est la seule à poursuivre le parcours, et croisent le nombre de transports avec l'exception ALD et les seuils de 50 et 150 km.

### 📝 Documentation

- [8493730](https://github.com/betagouv/transport-sanitaire/commit/8493730) : allège le README du simulateur et le met dans l'ordre de lecture. Commandes, Configuration et Structure passent en tête, les commandes deviennent un tableau, et les sous-sections qui racontaient un correctif désormais amont sont retirées.
- [33e0c9f](https://github.com/betagouv/transport-sanitaire/commit/33e0c9f) : met le README à l'heure de la v9.5.1, de ses 188 règles et de ses 42 cibles.
- [c7f9f69](https://github.com/betagouv/transport-sanitaire/commit/c7f9f69) : extrait en skill la marche à suivre d'une intégration de modèle. L'intégration de la v9.5.0 avait redécouvert ce que celle de la v9.4.1 avait déjà appris, faute que ce soit écrit ailleurs que dans des messages de commit.
- [7bc16d7](https://github.com/betagouv/transport-sanitaire/commit/7bc16d7) : met le README à l'heure de la v9.5.0, et nomme les quatre fichiers qui portent désormais la recette du livrable.
- [f59b14c](https://github.com/betagouv/transport-sanitaire/commit/f59b14c) : refait les 38 liens de commit de ce journal, que la réécriture des messages avait laissés sur des commits hors de l'historique. La correspondance a été établie par la date d'auteur et le sujet, puis recoupée par le hash d'arbre.
- [3a30fee](https://github.com/betagouv/transport-sanitaire/commit/3a30fee) : sort les vingt-trois règles de code et de commit d'AGENTS.md vers `docs/contributing/`, et rend le style de la documentation exécutable. `verifier-documentation.ts` refuse désormais le tiret cadratin, la phrase de plus de vingt-cinq mots et le paragraphe de plus de quatre phrases.
- [efd55d8](https://github.com/betagouv/transport-sanitaire/commit/efd55d8) : réécrit les commentaires de l'analytics, des seeds et du pilote de parcours, sans toucher une ligne de code.
- [06cbaf4](https://github.com/betagouv/transport-sanitaire/commit/06cbaf4) : réécrit les commentaires du contrat partagé et du backend, en disant en toutes lettres les invariants qui comptent : le secret reste au serveur, le nom ne circule jamais en clair, l'annuaire complet ne sort pas de Grist.
- [be001cf](https://github.com/betagouv/transport-sanitaire/commit/be001cf) : réécrit les deux README dans la langue du dépôt, sans qu'aucun fait change.

## [0.1.2](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%400.1.2), 24 août 2026

Correctif d'outillage. Le simulateur ne change pas : le commit livré ne touche
pas l'app, mais la configuration de la CI qui la garde.

### TL;DR

- La détection de secrets bloquait toute livraison sur un faux positif : elle
  prenait un nom de règle du contrat publicodes pour une clé d'API.
- Aucun secret n'a fuité, et rien ne change pour un prescripteur.

### 🐛 Corrections

- [25b2b68](https://github.com/betagouv/transport-sanitaire/commit/25b2b68) : cesse de prendre les noms de règles du contrat publicodes pour des secrets. `p2_exception_radiotherapie_moins_48h` déclenchait la règle générique de gitleaks, qui voyait une clé d'API dans ses trente-six caractères, et la CI restait rouge. L'exception est cantonnée à cette règle et à ce seul fichier : la clé Grist, le secret de pseudonymisation et le jeton Matomo y restent surveillés.

## [0.1.1](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%400.1.1), 24 août 2026

Version de documentation. Le simulateur ne change pas : les deux commits livrés
ne touchent que l'`AGENTS.md` de l'app, qui n'est embarqué nulle part. Rien dans
`front/`, `server/`, `shared/` ni `regles/`.

### TL;DR

- Aucun changement de comportement, aucune règle touchée. Le pied de page
  annonce 0.1.1 parce que c'est une autre livraison, pas un autre produit.
- L'AGENTS.md de l'app dit désormais comment une version se livre.

### 📝 Documentation

- [1c469f3](https://github.com/betagouv/transport-sanitaire/commit/1c469f3) : réécrit l'AGENTS.md de l'app dans la langue du dépôt et lui ajoute la section « Versions » qui manquait : où vit le numéro, comment se nomme le tag, où s'écrit ce journal.
- [9370bdc](https://github.com/betagouv/transport-sanitaire/commit/9370bdc) : renvoie de cette section vers la marche à suivre de livraison, qui décrit les cinq gestes d'une version et pourquoi ils ne se séparent pas.

## [0.1.0](https://github.com/betagouv/transport-sanitaire/releases/tag/simulateur-eligibilite%400.1.0), 24 août 2026

Première version étiquetée. Elle rassemble les 35 commits mergés depuis
`staging` et `feat/prefill-cerfa-pmt`, entre l'intégration du modèle de règles
v9.1 et celle de la v9.4.1.

### TL;DR

- Le modèle d'éligibilité passe de la v8.10 à la v9.4.1 : 186 règles, 39 cibles,
  neuf cas finaux.
- Le simulateur pré-remplit les deux CERFA dans le navigateur, la prescription
  médicale de transport et la demande d'accord préalable.
- On peut revenir en arrière partout, y compris depuis la page du document, sans
  perdre ses réponses.
- Les pages de résultat expliquent leurs conclusions au lieu de les asséner.
- Les adresses se saisissent un lieu par écran.
- Un pied de page indique la version, le commit déployé et la version des règles.
- La suite de tests passe de 219 à 403 tests.

### ✨ Nouveautés

- [128bbfa](https://github.com/betagouv/transport-sanitaire/commit/128bbfa) : passe le modèle en v9.4.1 et corrige trois anomalies qu'on avait remontées à l'éditeur : une qualification administrative qui se rouvrait alors que le cas était tranché, l'ordre des questions d'adresse, et la description de la question A2.1.
- [1430db2](https://github.com/betagouv/transport-sanitaire/commit/1430db2) : laisse le modèle décider quel document proposer, ce qui affiche la demande d'accord préalable au même titre que la prescription.
- [5462bee](https://github.com/betagouv/transport-sanitaire/commit/5462bee) : pré-remplit la demande d'accord préalable (formulaire S3139h), le second document du parcours.
- [15d4d1f](https://github.com/betagouv/transport-sanitaire/commit/15d4d1f) : reprend du modèle les bornes de saisie et deux libellés, jusque-là écrits dans l'interface.
- [dca73ec](https://github.com/betagouv/transport-sanitaire/commit/dca73ec) : couvre la seconde entrée du dispositif Engagement maternité, la question A2.4.
- [e0043f6](https://github.com/betagouv/transport-sanitaire/commit/e0043f6) : explique pourquoi une ALD reconnue n'est pas retenue quand il manque une incapacité ou une déficience.
- [b7dce50](https://github.com/betagouv/transport-sanitaire/commit/b7dce50) : liste sur la page de résultat les motifs qui justifient une demande d'accord préalable, au lieu de dire seulement qu'il en faut une.
- [0a4ab38](https://github.com/betagouv/transport-sanitaire/commit/0a4ab38) : passe le modèle en v9.4.0, qui remplace la v9.3.0 qu'on n'avait pas intégrée.
- [2cff8e6](https://github.com/betagouv/transport-sanitaire/commit/2cff8e6) : affiche les phrases d'aide des questions à choix multiple et met une majuscule aux réponses de la question A4.1.
- [5465d2d](https://github.com/betagouv/transport-sanitaire/commit/5465d2d) : ajoute un bouton « Précédent » sur la page du document, quel que soit le chemin par lequel on y arrive.
- [8a37cb0](https://github.com/betagouv/transport-sanitaire/commit/8a37cb0) : ajoute une seed qui ouvre le questionnaire directement sur la saisie des adresses, plutôt que d'avoir à traverser tout le parcours à la main.
- [8700c36](https://github.com/betagouv/transport-sanitaire/commit/8700c36) : rappelle à l'entrée de la partie administrative ce que les réponses qui suivent ne peuvent plus changer.
- [b08a30b](https://github.com/betagouv/transport-sanitaire/commit/b08a30b) : rappelle sur la question Q1 qu'elle porte sur un seul sens du trajet.
- [f4da5b7](https://github.com/betagouv/transport-sanitaire/commit/f4da5b7) : passe le modèle en v9.2.1 et retire le correctif qu'on maintenait de notre côté, l'éditeur l'ayant intégré.
- [70e4efb](https://github.com/betagouv/transport-sanitaire/commit/70e4efb) : affiche en bas de page le commit déployé et la version des règles.
- [b3336dc](https://github.com/betagouv/transport-sanitaire/commit/b3336dc) : applique le contrat d'interface 2.0.0 : les champs libres s'affichent, les pages à choix unique avancent seules, et la décision médicale ne se verrouille qu'au passage à la suite.
- [b5614d8](https://github.com/betagouv/transport-sanitaire/commit/b5614d8) : passe le modèle en v9.1, ce qui change l'ordre du questionnaire médical et toutes les valeurs de sortie.

### 🐛 Corrections

- [75214d2](https://github.com/betagouv/transport-sanitaire/commit/75214d2) : retire le message qui annonçait le verrouillage de la décision médicale.
- [96f6992](https://github.com/betagouv/transport-sanitaire/commit/96f6992) : garde les pages suivantes quand on revient en arrière corriger une réponse.
- [34239ed](https://github.com/betagouv/transport-sanitaire/commit/34239ed) : répare le téléchargement du CERFA avec le serveur de développement.
- [fdcf035](https://github.com/betagouv/transport-sanitaire/commit/fdcf035) : répartit les adresses sur deux pages, une par lieu, au lieu d'un écran de douze champs.
- [a14146f](https://github.com/betagouv/transport-sanitaire/commit/a14146f) : pose enfin les quatre champs d'adresse que le questionnaire sautait, le complément et le pays, que le CERFA lisait vides.
- [38d00eb](https://github.com/betagouv/transport-sanitaire/commit/38d00eb) : garde le bandeau de version en bas de la fenêtre quand la page est courte.
- [48d2d18](https://github.com/betagouv/transport-sanitaire/commit/48d2d18) : cesse de considérer comme rempli un champ d'adresse obligatoire qu'on a vidé.

### ♻️ Sous le capot

- [cadc8b3](https://github.com/betagouv/transport-sanitaire/commit/cadc8b3) : remplace la cascade de fonctions du remplissage CERFA par un tableau d'une ligne par champ.
- [32d1e1b](https://github.com/betagouv/transport-sanitaire/commit/32d1e1b) : range chaque CERFA dans son sous-dossier, gabarit compris.
- [2eb8b67](https://github.com/betagouv/transport-sanitaire/commit/2eb8b67) : confie aux règles du modèle la complétude des pages d'adresse, jusque-là décidée par une liste dans le code.
- [486a71c](https://github.com/betagouv/transport-sanitaire/commit/486a71c) : renomme les fichiers de la recette d'après la version du livrable qu'ils testent.

### ✅ Tests

- [32e3409](https://github.com/betagouv/transport-sanitaire/commit/32e3409) : compare un parcours dont on corrige Q1 après coup à une simulation neuve.
- [5e131d7](https://github.com/betagouv/transport-sanitaire/commit/5e131d7) : empêche le pilote de parcours des tests de déborder sur la page suivante quand la machine est chargée.
- [eff9866](https://github.com/betagouv/transport-sanitaire/commit/eff9866) : vérifie qu'on ne peut pas revenir au questionnaire médical une fois dans la partie administrative.
- [6ed0161](https://github.com/betagouv/transport-sanitaire/commit/6ed0161) : couvre le coche/décoche des cinq questions à choix multiple.

### 📝 Documentation

- [de08542](https://github.com/betagouv/transport-sanitaire/commit/de08542) : autorise la branche pour un changement structurant qu'aucun feature flag ne peut masquer.
- [7b8ff08](https://github.com/betagouv/transport-sanitaire/commit/7b8ff08) : documente la page des adresses.
- [31f1107](https://github.com/betagouv/transport-sanitaire/commit/31f1107) : met les deux specs produit à jour pour la v9.1.
