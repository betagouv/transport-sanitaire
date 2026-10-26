// L'accident causé par un tiers (Q3.6.2) et sa date (Q3.6.3). Sans réponse,
// ni Oui ni Non ne se coche.

import { uneRubrique } from "./rubrique";

export type Accident = {
  readonly tiers_oui: boolean;
  readonly tiers_non: boolean;
  /** `AAAA-MM-JJ`. */
  readonly tiers_date?: string;
};

export const ACCIDENT = uneRubrique("Accident")
  .lit("Q3.6.2", "Q3.6.3")
  .cellules<Accident>({
    tiers_oui: ({ validated }) => validated.question("Q3.6.2").is("1_OUI"),
    tiers_non: ({ validated }) => validated.question("Q3.6.2").is("2_NON"),
    tiers_date: ({ validated }) => validated.question("Q3.6.3").value,
  });
