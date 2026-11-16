# ADR-0020 - Une question se déclare par son constructeur (~~objet littéral~~)

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-9 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Une question s'écrivait en objet littéral. Elle redisait sa sorte
(`kind: "single choice"`), que son id disait déjà par le catalogue. Elle
recopiait ses options pour en régler une seule. Ses conditions recevaient trois
arguments positionnels, et le moteur lisait l'objet par des fonctions libres.
Rien n'empêchait un `min` sur un texte.

**Décision.** Un constructeur par sorte (`question.singleChoice(id, libellé)`,
`question.number(…)`, `question.address(…)`…), lié ~~au catalogue~~ du modèle par
`questionsOf`. La sorte vient du constructeur~~, les options du catalogue,
d'après l'id~~ ; la question porte ses options (ADR-0037). Chaque réglage s'écrit sur sa ligne et donne une copie : une
déclaration ne change jamais, et deux déclarations tirées d'une même base ne se
touchent pas. Une sorte n'a que ses réglages : `min` n'existe pas sur un texte,
au typage comme à l'exécution.

Le moteur ne reçoit plus que des questions qui savent se poser. `Question`
devient une interface : son id, sa sorte, ses dépendances (`dependencies`), et
`askedIn(vues, antérieures)`, qui donne la question posée. Les fonctions libres
qui lisaient l'objet (`askedIn`, `dependenciesOf`, `optionsFrom`)
disparaissent.

| Option | Pour | Contre |
|---|---|---|
| garder l'objet littéral, typé plus strictement | rien à porter | la sorte et les options restent redites |
| un constructeur qui donne un objet littéral | la sorte et les options viennent du catalogue | le moteur lit toujours un objet par des fonctions libres |
| un constructeur qui donne une question déclarée, qui sait se poser | la question porte ses règles ; le typage refuse un réglage d'une autre sorte | une classe par sorte à tenir |

La troisième. Une union transitoire a laissé les deux formes coexister le temps
de porter les modèles, puis la voie littérale a disparu avec le test
d'architecture qui la refusait : le typage la refuse.

**Conséquences.** Les déclarations s'évaluent au chargement du module. Une
constante lue par une déclaration doit la précéder dans le fichier : déclarée
plus bas, elle casse le chargement (R-5). `Page` et `QuestionnairePart` ne
prennent plus les faits en paramètre de type : ils restent dans la question.

## Mises à jour

> **Mise à jour 2026-11-03, les options dans leur question (#336).** L'ADR-0037
> donne à chaque question à choix ses options, et le catalogue disparaît.
> L'ADR-0020 est précisé : la sorte vient toujours du constructeur, les options
> ne viennent plus du catalogue. Décision de Simon, au journal D-261.
