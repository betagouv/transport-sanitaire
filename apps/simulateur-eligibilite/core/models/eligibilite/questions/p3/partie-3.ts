// P3 : les informations qui complètent le cerfa, après le verrou. Elle ne
// décide plus : ses réponses ne touchent ni aux faits ni aux cibles de R2.
// Ses pages, dans l'ordre, faites de ses questions (`questions/`).
//
// Chaque question ne se pose que si le support de l'issue, figé au verrou, la
// réclame (`CATALOGUE_COMPLET_QUESTIONS.md`, « Partie 3 »,
// `conditions/supports-du-complement.ts`).

import { afterLock, page } from "../../../../socle/index.ts";
import { Q3_1_1 } from "./questions/q3-1-1.ts";
import { Q3_1_2 } from "./questions/q3-1-2.ts";
import { Q3_1_3 } from "./questions/q3-1-3.ts";
import { Q3_2 } from "./questions/q3-2.ts";
import { Q3_3 } from "./questions/q3-3.ts";
import { Q3_4, Q3_4_A, Q3_4_DISTANCE } from "./questions/q3-4.ts";
import { Q3_5 } from "./questions/q3-5.ts";
import { Q3_6_1 } from "./questions/q3-6-1.ts";
import { Q3_6_2 } from "./questions/q3-6-2.ts";
import { Q3_6_3 } from "./questions/q3-6-3.ts";
import { Q3_7 } from "./questions/q3-7.ts";
import {
  Q3_8_HEBERGEMENT_ADRESSE,
  Q3_8_HEBERGEMENT_NOM,
  Q3_8_MATERNITE_ADRESSE,
  Q3_8_MATERNITE_NOM,
  Q3_8_NIVEAU,
} from "./questions/q3-8.ts";

/** P3, posée après le verrou : elle complète le cerfa, elle ne décide plus. */
export const COMPLEMENT = afterLock({
  id: "P3",
  title: "Informations permettant de compléter la prescription",
  pages: [
    // Le sens vient d'abord, puis le nombre, que le sens dit.
    page("P3/trajet", Q3_1_2, Q3_1_1, Q3_1_3),
    page("P3/depart", Q3_2.nature, Q3_2.nom, Q3_2.precision, Q3_2.adresse),
    page("P3/arrivee", Q3_3.nature, Q3_3.nom, Q3_3.precision, Q3_3.adresse),
    page("P3/soin", Q3_4, Q3_4_DISTANCE, Q3_4_A),
    page("P3/urgence", Q3_5),
    page("P3/evenements", Q3_6_1, Q3_6_2, Q3_6_3),
    page("P3/exoneration", Q3_7),
    page(
      "P3/maternite",
      Q3_8_MATERNITE_NOM,
      Q3_8_MATERNITE_ADRESSE,
      Q3_8_NIVEAU,
      Q3_8_HEBERGEMENT_NOM,
      Q3_8_HEBERGEMENT_ADRESSE,
    ),
  ],
});
