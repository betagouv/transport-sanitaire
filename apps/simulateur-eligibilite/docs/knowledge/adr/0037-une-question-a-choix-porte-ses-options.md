# ADR-0037 - Une question à choix porte ses options (~~le catalogue `OPTIONS`~~)

> Statut : **décidé** · 2026-11-04 · Anciennement ADR-26 de `metier-et-ecran.md`

**Contexte.** Les options d'une question vivaient loin d'elle, dans
`questions/catalogue/`, et le constructeur les retrouvait d'après l'id. Lire
Q1.1 demandait deux fichiers, et le type des réponses (`Questions`) se
déclarait à part, avant les questions. Une question appartient à sa
déclaration : ses options aussi.

**Décision.** Une question à choix déclare ses options :
`question.singleChoice("Q1.1", "…").options({ "1_SEUL": "…" })`. Elles disent
le type de sa réponse (`AnswerOf<typeof Q1_1>`). Le type `Questions` du modèle
se tire de ses parties (`AnswersOf`, `questions/reponses.ts`) ; les
déclarations, qui le précèdent, lisent les questions par leur objet
(`ReadByObject`) : `given.question(Q1_2)`, `dependsOn(Q1_1)`,
`shownUnder(Q1_3, "2_ALD")`. Le front, les tests et les seeds lisent par id ou
par objet (D-261).

| Option | Pour | Contre |
|---|---|---|
| garder le catalogue, le ranger près des parties | rien à changer au socle | la question ne dit toujours pas ses options |
| les options dans la question, `Questions` toujours déclaré à part | les déclarations lisent par id | le type redit chaque option, deux sources à tenir |
| les options dans la question, `Questions` tiré des parties | une seule source ; une question se lit dans son fichier | les déclarations importent les questions qu'elles lisent |

La troisième, choisie par Simon.

**Conséquences.** Une condition qui lit une question importe son objet : elle
vit après elle, dans son fichier, ou dans un fichier de `conditions/` que la
question n'importe pas. Sinon les deux modules s'importent l'un l'autre, et la
question lue vaut `undefined` au chargement (R-12). Q2.2.1 donne un fichier à
chacune de ses précisions, et le circuit du retour pénitentiaire suit
Q2.2.1.indication dans le sien. Une question qui se lit elle-même se déclare
en deux temps : `const expedition = question.address(…)`, puis
`export const EXPEDITION = expedition.inconsistentWhen(factureRepetee, …)`.
Les libellés des options se lisent sur la question (`Q1_3.labels`). Aucun écran
ne change.

## Mises à jour

> **Mise à jour 2026-11-03, les options dans leur question (#336).** L'ADR-0037
> donne à chaque question à choix ses options, et le catalogue disparaît.
> L'ADR-0020 est précisé : la sorte vient toujours du constructeur, les options
> ne viennent plus du catalogue. Décision de Simon, au journal D-261.
