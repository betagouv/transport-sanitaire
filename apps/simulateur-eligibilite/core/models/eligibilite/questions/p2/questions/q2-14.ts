// Q2.14 : les deux groupes de l'Engagement maternité, l'éloignement puis le
// motif, sur la page de branche. Le motif lit aussi l'éloignement, sur la même
// page.

import { given, question } from "../../question.ts";
import { brancheDecisive } from "../conditions/branche.ts";

// Le groupe de l'éloignement se pose : Q2.1 dit la maternité, ou Q2.2.1 la
// signale.
const unEloignementAPoser = given
  .question("Q2.1")
  .answer()
  .is("13_MATERNITE")
  .or(given.question("Q2.2.1").answer().checked("4_MATERNITE_ELOIGNEE"))
  .and(brancheDecisive);

// Le groupe du motif se pose comme l'éloignement, sauf quand celui-ci a déjà
// écarté le dispositif : le motif ne changerait plus rien.
const unMotifAPoser = unEloignementAPoser.and(
  given.question("Q2.14.eloignement").answer().checked("3_AUCUNE").not(),
);

export const Q2_14_ELOIGNEMENT = question
  .multipleChoice(
    "Q2.14.eloignement",
    "Quelle situation d’éloignement concerne la patiente ?",
  )
  .mattersWhile(unEloignementAPoser)
  .exclusive("3_AUCUNE");

export const Q2_14_MOTIF = question
  .multipleChoice("Q2.14.motif", "Quel motif concerne le déplacement évalué ?")
  .mattersWhile(unMotifAPoser)
  .exclusive("3_AUCUNE");
