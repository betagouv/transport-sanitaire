// Des faits aux cibles : ce que les règles publicodes de l'éditeur en
// calculent, par le moteur de décision du socle.

import {
  PublicodesDecisionEngine,
  type Rules,
} from "../../../socle/decision-engine/publicodes-decision-engine.adapter.ts";
import type { Faits } from "../faits/noms.ts";
import rules from "../rules/regles.json" with { type: "json" };
import { CIBLES, type Cibles } from "./noms.ts";

/**
 * Toutes les cibles, une seule cible, et les cibles lues à la demande, de
 * faits donnés.
 */
export const decisionEngine = new PublicodesDecisionEngine<Faits, Cibles>(
  rules as Rules,
  CIBLES,
);
