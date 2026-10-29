// L'indicateur de parcours ALD (#148, `SPECIFICATION_ALD_6_QUESTIONS.md`) : au
// plus six pages et six questions de P1 à R2. Seule l'ALD compte, pas le mineur
// en soins continus (D-229). Une issue caisse ne conclut pas sur le droit : son
// verdict est à part.

import { given } from "../../../core/models/eligibilite/question";
import type { AldIndicator } from "../../socle";

export const INDICATEUR_ALD: AldIndicator = {
  parts: ["P1", "P2"],
  limit: 6,
  counted: given.cible("cible_ald_qualifiante").isOui(),
  caisse: given.cible("cible_issue_id").is("ISSUE_CAISSE"),
};
