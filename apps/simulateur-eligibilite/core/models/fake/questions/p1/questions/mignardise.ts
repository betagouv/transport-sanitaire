// La mignardise : une question déclarée sur deux pages, sous une seule réponse
// (ADR-29). Avec un café, elle se pose avec les accompagnements ; avec un thé
// au lait, au service. Sa place suivante ne la pose pas si elle s'est déjà
// posée.

import { given, question } from "../../question.ts";
import { ACCOMPAGNEMENTS } from "./accompagnements.ts";
import { BOISSON } from "./boisson.ts";

/** Sa première place, avec les accompagnements : pour un café. */
export const MIGNARDISE = mignardise().appliesWhen(
  given.question(BOISSON).answer().is("cafe"),
);

/** Sa place suivante, au service : pour un thé au lait. */
export const MIGNARDISE_AU_SERVICE = mignardise()
  .unlessAskedBefore()
  .appliesWhen(given.question(ACCOMPAGNEMENTS).answer().checked("lait"));

// ---- implémentation ----

// La question, sans les gardes de ses places.
function mignardise() {
  return question
    .singleChoice("mignardise", "Une mignardise avec ?")
    .options({
      speculoos: "Un spéculoos",
      chocolat: "Un carré de chocolat",
    })
    .hint(
      "Démontre : une question déclarée sur deux pages, sous une seule réponse. Avec un café, elle se pose ici ; avec un thé au lait, au service. Choisie au service, puis la boisson changée pour un café : elle revient sur cette page, déjà répondue, et le service ne la repose pas.",
    )
    .optional();
}
