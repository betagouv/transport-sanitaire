# ADR-0035 - Le socle saute une question que le graphe dit sans effet

> Statut : **décidé** · 2026-10-28 · Anciennement ADR-24 de `metier-et-ecran.md`

**Contexte.** Une question se posait dès que ses gardes tenaient. Une garde
`mattersWhile` disait à la main qu'une réponse comptait encore, et en oubliait
souvent : un patient seul en SAMSAH répondait à Q2.3.1, Q2.3.2 et Q2.3.3, alors
que la caisse est son issue quelle que soit la distance. Les gardes, les faits,
R2 et R3 savaient ce qu'ils lisent (ARCH-008) : on pouvait dire, sans
exécuter, ce qu'une réponse change.

**Décision.** Le graphe des règles se compile au build, en un diagramme de
décision versionné (`regles.graphe.json`, D-216). Ce que change une question
se lit, de proche en proche, dans ce que lisent les faits et les gardes
(D-217, D-218). R2 et R3 déclarent ce qu'ils lisent, par branche (D-219,
D-224). Le socle ne pose alors une question que si elle compte (`Relevance`) :

| Elle compte si | Décision | Exemple |
|---|---|---|
| ce que montre le résultat dépend d'elle, dans une branche encore possible | D-220 | Q2.3.2 pour une PMT : l'avion change le document |
| elle change la garde d'une question qui reste, peut encore se poser et compte | D-221, D-223 | Q2.1.g, que lit la garde de Q2.5 |
| elle porte une incohérence, ou se déclare toujours posée | D-222 | Q3.1.3 |

Les faits des questions validées sont figés, ceux des questions qui restent et
ceux qu'impose la décision sont libres : le graphe restreint aux faits figés ne
teste plus que ce qui peut encore changer. Une question qui ne peut plus se
poser ne compte pas, mais le socle ne le dit que quand sa garde est jouée
d'avance (`askability.ts`). Après le verrou, les cibles sont figées : seul
compte ce qui lit la question telle quelle. Une question sautée garde sa
réponse absente, jamais « non » (COR-02). La complétude de P1 et de P2 suit le
même filtrage : une question sautée n'attend pas sa réponse.

| Option | Pour | Contre |
|---|---|---|
| des `mattersWhile` écrits à la main | rien à calculer | ils s'oublient, et se périment à chaque livraison |
| exécuter les règles sur chaque réponse possible | exact | une combinaison par question qui reste |
| le graphe restreint, et les gardes lues à côté | aucune liste écrite ; les branches s'ouvrent seules | le graphe ne voit pas les gardes : leur cascade se calcule à part |
| le questionnaire entier dans le graphe | une seule lecture | des gardes opaques à traduire en nœuds |

La troisième, choisie par Simon. La quatrième reste une piste : elle
remplacerait le calcul à part de ce qui peut encore se poser (D-223).

**Conséquences.** Le SAMSAH, la pension militaire et l'HTNM ne posent plus la
distance ; les seeds gardent leurs cibles et leurs questions, que
`questions-posees-par-seed.test.ts` liste. Une question que rien ne lit n'est
plus posée : elle sort, ou se déclare `alwaysAsked` en attendant l'éditeur.
Une lecture du résultat qui ne se déclare pas dans sa branche fait poser des
questions pour rien. Une lecture coûte environ 60 ms à froid par seed, 4 ms
ensuite (R-10).

Les `mattersWhile` restent tous, et s'ajoutent au graphe (D-227). Les règles
lisent les réponses sans regarder les gardes : seule une garde sait qu'une
question ne se pose pas. Coupée seule, chacune laisse le graphe poser sa
question dans au moins un des 53 parcours mesurés. Pour `issue-pmt`, la garde
cache Q2.13.depart, que lisent les cases « départ » du cerfa. Q2.1 et
Q2.13.depart cachent une réponse qui changerait l'issue ou le cerfa : elles
remontent à l'éditeur.

## Risques

| Id | Risque | Mesure |
|---|---|---|
| R-10 | Le filtrage coûte environ 60 ms à froid par lecture, dix fois une lecture sans lui | des caches par place ; à mesurer à l'écran sur un poste lent |
| R-11 | Une lecture du résultat déclarée hors de sa branche fait poser des questions pour rien | `questions-posees-par-seed.test.ts` liste les questions de chaque seed |

## Mises à jour

> **Mise à jour 2026-10-28, le filtrage par le graphe (#255).** L'ADR-0035 écrit
> la phase 2 de #196 : le graphe des règles compilé au build, ce que lit
> chaque morceau du résultat, et le socle qui saute une question dont la
> réponse ne change rien de ce que montre le résultat. Chaque précision de R2 se lit sous les issues de son texte. Décisions de
> Simon, au journal D-216 à D-226.

> **Mise à jour 2026-10-28, le tri des gardes d'utilité (#256).** Le graphe ne
> remplace aucun `mattersWhile` : ils restent tous (ADR-0035, conséquences). La
> dernière phrase de la règle ARCH-008 ne vaut plus. Décision de Simon, au journal D-227.
