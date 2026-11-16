# ADR-0043 - Le journal en clean architecture, Grist en premier adaptateur

> Statut : **décidé** · 2026-11-12 · Anciennement ADR-7 de `analytics.md`

**Contexte.** Grist sert à démarrer : l'équipe y tient déjà le référentiel, le
backend sait déjà y écrire, et l'app n'a pas de base de données. Mais il n'est pas
fait pour stocker des événements en masse, et il ne tiendra probablement pas dans
la durée.

**Décision.** Le journal suit la clean architecture, côté serveur
(`server/journal/`) comme côté écran (`front/socle/analytics/`). Depuis le
2026-11-12, la mesure d'audience aussi, dans le même dossier de l'écran. Chaque
fichier dit son rôle par son suffixe, et chaque rôle s'écrit en classe ou en
interface :

| Suffixe | Rôle | Serveur | Écran |
|---|---|---|---|
| `.entity.ts` | une notion et ses règles, sans dépendance | `JournalEntry` : l'événement daté à sa réception, qui sait s'il en répète un autre, ou le signe de vie de l'heure | `Journey` : la simulation, qui numérote et date ses événements, ne garde que sa première intention, et rien d'une seed ; elle entre dans chaque phase et la termine une fois, et sait quelles validations une correction fait tomber (ADR-0044) ; `PageView` : un affichage de page, qui expose chaque question une fois et porte ses jalons ; `QuestionnaireRun` : un passage dans le questionnaire, qui tait le début d'une reprise, l'abandon après la fin, et tout le questionnaire du cerfa ; `AudienceEvent` : un événement Matomo, son nom pris dans `EventName`, et l'id du service, jamais le service libre |
| `.usecase.ts` | une action, qui ne parle qu'aux entités et aux ports | `CollectAnEvent` : garde un nouvel événement, ignore un renvoi, met une collision à part ; `ReportAlive` : écrit le signe de vie de l'heure (ADR-0051) | `StartASimulation` : ouvre un parcours et le signale sur P0 ; `SelectAnIntent` : signale le premier choix validé en P0 ; `OpenAPage`, `RevealQuestions`, `AnswerAQuestion` : une page ouverte, les questions qu'une saisie révèle, une saisie ; `StartAQuestionnaire`, `PassAStep`, `CorrectAnAnswer`, `CompleteAQuestionnaire`, `LeaveAQuestionnaire` : le début, une étape, une correction, la fin et l'abandon d'un questionnaire, `PassAStep` et `CompleteAQuestionnaire` parlant à Matomo et au journal ; `ReachAnAldResult` : le verdict ALD sur le premier résultat. Un use case n'en appelle pas un autre |
| `.port.ts` | l'interface qu'un use case ou un adaptateur attend de l'extérieur | `Journal` : retrouver, ajouter, mettre à part | `Journal` : garder un événement ; `Audience` : compter un événement ; `ConsentSource` : suivre le choix du prescripteur |
| `.adapter.ts` | une classe qui implémente un port | `GristJournal` ; `DiscardingJournal`, qui ne garde rien, sans doc Grist ; `MemoryJournal`, pour les tests | `ServerJournal` : envoi, réessais ; `MatomoAudience` : file `_paq`, amorçage, chargement de matomo.js ; `DiscardingAudience`, qui ne mesure rien, quand Matomo n'est pas activé ; `CmsConsent` : le choix demandé au CMS (ADR-0011), que les deux premiers suivent |
| `.controller.ts` | une entrée HTTP, qui valide la requête et appelle un use case | `JournalController` : la route de collecte | |
| `.hook.ts` | l'adaptateur primaire de l'écran : du React, et un appel de use case par événement, sans règle métier (#414) | | `journey.hook.ts` : `useRecordTheJourney` ; `questionnaire.hook.ts` : `useQuestionnaireTracking` ; `ald-pathway.hook.ts` : `useAldResultReached` |

Les adaptateurs parlent HTTP par deux clients préconfigurés (`.client.ts`), qui
portent l'adresse, l'authentification, le JSON et les erreurs :
`server/grist/grist-api.client.ts` (`GristApiClient`, serveur → Grist) et
`front/socle/server-api/server-api.client.ts` (`ServerApiClient`, écran → serveur).
Le référentiel et le rattachement passent aussi par eux. L'adaptateur Grist, seul à
connaître le document « Simulateur-Parcours », range chaque événement en colonnes
communes (`event_id`, `simulation_id`, `sequence`, type, dates, environnement,
version du schéma, `is_test`, puis `establishment` et `service`, ADR-0053) et le reste
en JSON dans une colonne `payload`, et les collisions dans une table à part.

Chaque côté a un conteneur, `container.ts` à sa racine, qui instancie une fois ses
classes et les exporte. `server/container.ts` choisit les adaptateurs d'après la
configuration (`adaptersFor`), puis assemble use case et contrôleur
(`createContainer`), que `server.ts` donne à `app.ts`. `front/container.ts`
instancie le client du serveur, le choix du prescripteur, Matomo s'il est activé (sinon une mesure qui ne garde rien), le
journal, leurs use cases, le référentiel et la déclaration du rattachement, que
`main.tsx` donne à l'app. Les use cases forment un seul ensemble
(`analyticsUseCases`, ADR-0044), qu'`App` pose dans un contexte React
(`use-cases-in-the-tree.ts`), où les hooks les lisent : aucune variable globale ne
les porte. Le simulateur y pose aussi le parcours de sa simulation, où le
questionnaire signale ses pages. Le rattachement se lit en session dans les hooks, pas dans le simulateur,
qui ignore qui prescrit. Le simulateur signale le parcours de sa simulation par
`useRecordTheJourney`, qui l'ouvre sur P0 et y signale l'intention que le modèle
déclare (`Model.intent`) ; le questionnaire signale ses pages, ses saisies et ses
validations par `useQuestionnaireTracking`, et le simulateur envoie le verdict ALD qu'il calcule
(`aldPathwayOf`) par `useAldResultReached`. Les deux conteneurs
exportent une fonction appelée une fois au démarrage, pas des instances, car rien
ne doit s'exécuter au chargement d'un module (QUAL-004). Les fichiers qui
assemblent (`container.ts`, `server.ts`, `app.ts`, `main.tsx`, les `index.ts`,
`use-cases-in-the-tree.ts`)
n'ont pas de suffixe.

**Pourquoi.** Changer de stockage ne doit toucher qu'un adaptateur. Si l'adaptateur
décidait seul qu'un renvoi est un doublon, la règle partirait avec lui. Le suffixe
dit au lecteur, avant d'ouvrir le fichier, de quel côté de la frontière il est.
Colonnes communes plus JSON : le journal sert au rejeu, pas à la lecture à l'œil, et
la table ne bouge pas quand le contrat gagne un champ.

**Conséquences.** Les use cases se testent entièrement sur l'adaptateur en mémoire.
L'adaptateur Grist n'a que des tests d'aller-retour. Une nouvelle variable de
configuration, `JOURNAL_GRIST_DOC_URL`, donne l'adresse du document
« Simulateur-Parcours ». Elle n'a pas de défaut : la collecte n'écrit dans Grist
que là où on la pose, en production. Ailleurs, staging compris, le serveur prend
`DiscardingJournal`, qui accepte les événements sans en garder aucun : la mémoire du
serveur ne grossit pas avec le trafic. Le test
d'architecture vérifie que les entités, use cases et ports n'importent qu'entre eux
et depuis `shared/`, et que seul `grist-journal.adapter.ts` importe `server/grist/`.
Le rattachement n'est pas encore découpé ainsi : il le sera sur ce modèle.

## Mises à jour

> **Mise à jour 2026-11-12, la mesure d'audience en clean architecture (#383).** Matomo
> suit le même découpage que le journal (ADR-0043) : une entité, un use case, un port et
> son adaptateur, un contexte React. Le choix du prescripteur devient un port partagé,
> demandé une fois au CMS pour Matomo et pour le journal. Plus aucun état global :
> le conteneur instancie Matomo quand il est activé, et sinon une mesure qui ne garde rien. Cela **étend**
> l'ADR-0043 à la mesure d'audience et **déplace** le référentiel de l'ADR-0010.

> **Mise à jour 2026-11-13, des hooks sans règles (#383, #414).** Les hooks de l'écran
> (`.hook.ts`) ne font plus que traduire un événement de l'écran en un appel de use
> case. Ce qui compte ou part descend dans les entités : `QuestionnaireRun` tait le
> début d'un questionnaire qui reprend et l'abandon d'un questionnaire fini, `Journey`
> ne garde rien d'une seed. Un use case par action, qui n'en appelle pas d'autre. Les
> contextes React deviennent un fichier d'assemblage sans suffixe. Cela **précise**
> l'ADR-0043 ; #414 étendra la règle au reste de l'écran.
