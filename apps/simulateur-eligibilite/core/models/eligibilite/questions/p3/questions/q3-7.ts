// Q3.7 : l'exonération du ticket modérateur. Le cerfa n'a qu'une case
// Oui / Non. Les cas aident à la cocher. Ils ne se proposent que dans un
// contexte hospitalier, chacun pour les supports dont la notice le cite. Aucun
// cas n'est encore acquis en P2 : « Aucun » n'a rien d'autre à préserver que
// les cases de cette page.

import { given, question } from "../../question.ts";
import {
  avecUnDocument,
  uneDap,
} from "../conditions/supports-du-complement.ts";

export const Q3_7 = question
  .multipleChoice(
    "Q3.7",
    "Un cas particulier d’exonération du ticket modérateur doit-il être reporté ?",
  )
  .hint(
    "Cochez un cas seulement si sa condition propre est vérifiée : un motif d’hospitalisation ne suffit pas.",
  )
  .mattersWhile(
    avecUnDocument.and(
      given.cible("cible_hospitalisation_ou_seances_assimilees").isOui(),
    ),
  )
  // La notice de la DAP n'a ni l'urgence hospitalière, ni la HAD ou la
  // radiothérapie. Elle seule a le traitement mieux adapté.
  .option("3_URGENCE_HOSPITALIERE", (option) =>
    option.offeredWhen(uneDap.not()),
  )
  .option("4_HAD_OU_RADIOTHERAPIE", (option) =>
    option.offeredWhen(uneDap.not()),
  )
  .option("6_TRAITEMENT_MIEUX_ADAPTE", (option) => option.offeredWhen(uneDap))
  .exclusive("7_AUCUN");
