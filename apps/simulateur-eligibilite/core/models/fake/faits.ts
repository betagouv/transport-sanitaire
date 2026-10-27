// Les faits du modèle de démonstration : ce qui est commandé, en toutes
// lettres, et ce qu'on sait du lait et du citron. Les gardes les lisent, et la
// préconisation les donne aux règles.

import { FaitCatalogue, givenOf, unFait } from "../../socle/index.ts";
import { FAITS, type Faits } from "./declarations/faits.ts";
import type { Questions } from "./declarations/questions.ts";

const BOISSONS: Record<Questions["boisson"], string | null> = {
  the: "thé",
  cafe: "café",
  rien: null,
};

const ACCOMPAGNEMENTS: Record<string, string | undefined> = {
  lait: "lait",
  sucre: "sucre",
  citron: "citron",
  "citron-a-voir": "peut-être du citron",
};

// Ce que les faits lisent. `given` ne vient pas de `question.ts` : un fait ne
// lit pas de cible.
const given = givenOf<Questions, Faits>();
const BOISSON = given.question("boisson").answer();
const AVEC = given.question("accompagnements").answer();

const RIEN_COMMANDE = "Rien n'est commandé.";
const PAS_ENCORE_VALIDES = "Les accompagnements ne sont pas encore validés.";

// Ce qu'on sait d'un accompagnement. Coché, il est demandé. Proposé sans être
// coché, il est refusé. Une option qui ne s'est pas proposée n'a pas été
// refusée : elle ne vaut « non » que si la boisson l'exclut.
const LAIT = unFait("lait")
  .nonSi(BOISSON.is("rien"), RIEN_COMMANDE)
  .ouiSi(AVEC.checked("lait"))
  .nonSiEcartee(AVEC, "lait")
  .nonSi(
    AVEC.isValidated().and(AVEC.offered("lait").not()),
    "« lait » ne se sert pas avec cette boisson.",
  )
  .sinon(PAS_ENCORE_VALIDES);

const CITRON = unFait("citron")
  .nonSi(BOISSON.is("rien"), RIEN_COMMANDE)
  .inconnuSi(
    AVEC.checked("citron-a-voir"),
    "« Peut-être du citron » : à décider au service.",
  )
  .ouiSi(AVEC.checked("citron"))
  .nonSiEcartee(AVEC, "citron")
  .nonSi(
    AVEC.isValidated().and(AVEC.offered("citron").not()),
    "« citron » ne se sert pas avec cette boisson.",
  )
  .sinon(PAS_ENCORE_VALIDES);

/** Les faits du modèle de démonstration, chacun déclaré une fois. */
export const CATALOGUE_DES_FAITS = new FaitCatalogue<Faits>(FAITS, [
  unFait("boisson").vaut(
    BOISSON.compute((boisson) =>
      boisson.hasAnswer() ? BOISSONS[boisson.value] : null,
    ),
  ),
  unFait("accompagnements").vaut(
    AVEC.compute((avec) =>
      avec.checkedBoxes().flatMap((item) => ACCOMPAGNEMENTS[item] ?? []),
    ),
  ),
  LAIT,
  CITRON,
]);
