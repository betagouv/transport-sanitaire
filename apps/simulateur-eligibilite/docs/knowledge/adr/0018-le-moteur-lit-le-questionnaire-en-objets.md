# ADR-0018 - Le moteur lit le questionnaire en objets (~~fonctions libres~~)

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-7 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** Le moteur exposait des fonctions libres sur `(pages, answers,
cibles)` : les pages posées, les questions d'une page, les validées, la
complétude, la validation d'une page. Chacune refaisait la lecture complète,
gardes et faits compris, et l'écran d'une page la faisait cinq fois. Les
rappels avaient deux formes : le modèle les écrivait sur un objet, le moteur
les appelait avec trois arguments, et un adaptateur traduisait d'après une
liste de noms tenue à la main.

**Décision.** Deux objets. `Questionnaire` porte les pages, dans l'ordre.
`questionnaire.readWith(answers, cibles)` donne une `Reading`, calculée une
fois à sa construction : pages et questions posées, questions validées,
complétude, page où l'on rouvre, page suivante. Une lecture ne change pas :
valider une page (`commit`) donne de nouvelles réponses, qu'on relit. Tous
les rappels reçoivent le même contexte, `{ answers, validated, cibles,
faits }`, où les faits ne se calculent qu'à la lecture. L'adaptateur
disparaît. Le hook de l'écran ne garde que l'état (page ouverte, brouillon) et
demande le reste à la lecture.

**Conséquences.** Une page fait deux lectures : les réponses validées, qui
disent les pages, et les mêmes avec le brouillon, qui disent ce que la page
pose. La trace de debug garde la forme brute des validées
(`ValidatedAnswers.toJSON`).
