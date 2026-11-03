// fait_type_dialyse_non_verifiable : le type de la dialyse reste non vérifiable.
//
// Q1.3.a n'a plus que « Oui » et « Non » : y répondre le met à « non ». Q1.3
// validée sans dialyse en centre aussi. Le questionnaire ne propose plus de
// réponse inconnue : il ne vaut jamais « oui ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

export const typeDialyseNonVerifiable = unFait(
  "fait_type_dialyse_non_verifiable",
)
  .nonSi(given.question("Q1.3.a").answer().isPresent(), "Q1.3.a est répondue.")
  .nonSi(
    given
      .question("Q1.3")
      .answer()
      .isPresent()
      .and(given.question("Q1.3").answer().checked("5_DIALYSE").not()),
    "Q1.3 est validée sans dialyse en centre.",
  )
  .sinon("Q1.3 n'est pas encore validée.");
