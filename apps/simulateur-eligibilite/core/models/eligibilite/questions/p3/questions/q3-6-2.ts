// Q3.6.2 : un accident causé par un tiers. Les trois supports ont cette case.

import { question } from "../../question.ts";
import { avecUnDocument } from "../conditions/supports-du-complement.ts";

export const Q3_6_2 = question
  .singleChoice(
    "Q3.6.2",
    "Ce transport est-il en rapport avec un accident causé par un tiers ?",
  )
  .options({
    "1_OUI": "Oui",
    "2_NON": "Non",
  })
  .mattersWhile(avecUnDocument);
