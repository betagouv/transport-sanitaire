# ADR-0035 - Le socle saute une question que le graphe dit sans effet

> Statut : **décidé** · 2026-10-28

> **Révisé le 2026-11-25.** La pertinence n'est plus calculée à l'écran
> (`front/socle/model.factory.ts`) mais dans le métier : `CoreModelFactory`
> (`core/socle/model.factory.ts`) la construit d'après le graphe et ce que
> lisent les résultats, que `CoreModel` porte désormais (R2, le choix du
> document, son titre, son libellé de départ, le besoin). `core/models/<nom>/index.ts`
> l'appelle : sous Node, le métier seul saute les mêmes questions que l'écran.
> La règle ci-dessous ne change pas. Voir ARCH-001 et ARCH-002.

**Contexte.** Une question se posait dès que ses gardes tenaient. Une garde
`mattersWhile` disait à la main qu'une réponse comptait encore, et en oubliait
souvent : un patient seul en SAMSAH répondait à Q2.3.1, Q2.3.2 et Q2.3.3, alors
que la caisse est son issue quelle que soit la distance. Les gardes, les faits,
R2 et R3 savaient ce qu'ils lisent (ARCH-008) : on pouvait dire, sans
exécuter, ce qu'une réponse change.

**Décision.** Le graphe des règles se compile au build, en un diagramme de
décision versionné (`regles.graphe.json`). Ce que change une question
se lit, de proche en proche, dans ce que lisent les faits et les gardes.
R2 et R3 déclarent ce qu'ils lisent, par branche. Le socle ne pose alors une
question que si elle compte (`Relevance`) :

| Elle compte si | Exemple |
|---|---|
| ce que montre le résultat dépend d'elle, dans une branche encore possible | Q2.3.2 pour une PMT : l'avion change le document |
| elle change la garde d'une question qui reste, peut encore se poser et compte | Q2.1.g, que lit la garde de Q2.5 |
| elle porte une incohérence, ou se déclare toujours posée | Q3.1.3 |

Les faits des questions validées sont figés, ceux des questions qui restent et
ceux qu'impose la décision sont libres : le graphe restreint aux faits figés ne
teste plus que ce qui peut encore changer. Une question qui ne peut plus se
poser ne compte pas, mais le socle ne le dit que quand sa garde est jouée
d'avance (`askability.service.ts`). Après le verrou, les cibles sont figées : seul
compte ce qui lit la question telle quelle. Une question sautée garde sa
réponse absente, jamais « non ». La complétude de P1 et de P2 suit le
même filtrage : une question sautée n'attend pas sa réponse.

| Option | Pour | Contre |
|---|---|---|
| des `mattersWhile` écrits à la main | rien à calculer | ils s'oublient, et se périment à chaque livraison |
| exécuter les règles sur chaque réponse possible | exact | une combinaison par question qui reste |
| le graphe restreint, et les gardes lues à côté | aucune liste écrite ; les branches s'ouvrent seules | le graphe ne voit pas les gardes : leur cascade se calcule à part |
| le questionnaire entier dans le graphe | une seule lecture | des gardes opaques à traduire en nœuds |

La troisième, choisie par le porteur. La quatrième reste une piste : elle
remplacerait le calcul à part de ce qui peut encore se poser.

**Conséquences.** Le SAMSAH, la pension militaire et l'HTNM ne posent plus la
distance ; les seeds gardent leurs cibles et leurs questions, que
`questions-posees-par-seed.test.ts` liste. Une question que rien ne lit n'est
plus posée : elle sort, ou se déclare `alwaysAsked` en attendant l'éditeur.
Une lecture du résultat qui ne se déclare pas dans sa branche fait poser des
questions pour rien. Une lecture coûte environ 60 ms à froid par seed, 4 ms
ensuite (R-10).

Les `mattersWhile` restent tous, et s'ajoutent au graphe. Les règles
lisent les réponses sans regarder les gardes : seule une garde sait qu'une
question ne se pose pas. Coupée seule, chacune laisse le graphe poser sa
question dans au moins un des parcours mesurés. Pour `issue-pmt`, la garde
cache Q2.13.depart, que lisent les cases « départ » du cerfa. Q2.1 et
Q2.13.depart cachent une réponse qui changerait l'issue ou le cerfa : elles
remontent à l'éditeur.

## Risques

| Id | Risque | Mesure |
|---|---|---|
| R-10 | Le filtrage coûte environ 60 ms à froid par lecture, dix fois une lecture sans lui | des caches par place ; à mesurer à l'écran sur un poste lent |
| R-11 | Une lecture du résultat déclarée hors de sa branche fait poser des questions pour rien | `questions-posees-par-seed.test.ts` liste les questions de chaque seed |
