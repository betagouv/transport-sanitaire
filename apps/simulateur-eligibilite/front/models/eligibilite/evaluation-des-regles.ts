// Des faits aux cibles : ce que les règles publicodes de l'éditeur en
// calculent, par le moteur de décision du socle.

import {
  publicodesEngine,
  type Rules,
} from "../../../core/socle/decision-engine/publicodes";
import { CIBLES, type Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import rules from "./rules/regles.json" with { type: "json" };

/** Toutes les cibles, et une seule cible, de faits donnés. */
export const { cibles, cible } = publicodesEngine<Faits, Cibles>(
  rules as Rules,
  CIBLES,
);
