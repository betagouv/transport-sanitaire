// P2 : l'éligibilité. Ses pages, dans l'ordre, faites de ses questions
// (`questions/`). Q2.4, Q2.9 et Q2.11 n'ont aucun écran. Un retour
// pénitentiaire hors du circuit de prescription s'arrête aux contextes
// (`questions/q2-2-1-indication.ts`).

import { page } from "../../../../socle/index.ts";
import { Q2_1, Q2_1_F, Q2_1_G } from "./questions/q2-1.ts";
import { Q2_2_1, Q2_2_1_B } from "./questions/q2-2-1.ts";
import { Q2_2_1_A } from "./questions/q2-2-1-a.ts";
import { Q2_2_1_CADRE } from "./questions/q2-2-1-cadre.ts";
import {
  dansLeCircuit,
  Q2_2_1_INDICATION,
} from "./questions/q2-2-1-indication.ts";
import { Q2_2_5 } from "./questions/q2-2-5.ts";
import { Q2_3_1 } from "./questions/q2-3-1.ts";
import { Q2_3_1_FINALITE } from "./questions/q2-3-1-finalite.ts";
import { Q2_3_2 } from "./questions/q2-3-2.ts";
import { Q2_3_3 } from "./questions/q2-3-3.ts";
import { Q2_3_4 } from "./questions/q2-3-4.ts";
import { Q2_5 } from "./questions/q2-5.ts";
import { Q2_6, Q2_6_A } from "./questions/q2-6.ts";
import { Q2_7, Q2_7_A } from "./questions/q2-7.ts";
import { Q2_8_1 } from "./questions/q2-8-1.ts";
import { Q2_8_2 } from "./questions/q2-8-2.ts";
import { Q2_8_3 } from "./questions/q2-8-3.ts";
import { Q2_8_4 } from "./questions/q2-8-4.ts";
import { Q2_8_5 } from "./questions/q2-8-5.ts";
import { Q2_8_6, Q2_8_6_A, Q2_8_6_B } from "./questions/q2-8-6.ts";
import { Q2_8_DUREE_48H } from "./questions/q2-8-duree-48h.ts";
import { Q2_10, Q2_10_A, Q2_10_B } from "./questions/q2-10.ts";
import { Q2_13_DEPART, Q2_13_SENS } from "./questions/q2-13.ts";
import { Q2_14_ELOIGNEMENT, Q2_14_MOTIF } from "./questions/q2-14.ts";

/** P2 : l'éligibilité. */
export const P2 = {
  id: "P2",
  title: "Éligibilité",
  pages: [
    page("P2/prestation", Q2_1, Q2_1_F, Q2_1_G),
    page(
      "P2/contextes",
      Q2_2_1,
      Q2_2_1_CADRE,
      Q2_2_1_A,
      Q2_2_1_INDICATION,
      Q2_2_5,
    ),
    // Hors du circuit de prescription, plus rien ne se pose.
    ...[
      page("P2/soins", Q2_2_1_B),
      page("P2/trajet", Q2_3_1, Q2_3_2, Q2_3_3, Q2_3_1_FINALITE, Q2_3_4),
      page("P2/transfert", Q2_5),
      // Les exceptions suivent la permission : celle d'un adulte autorisée
      // les pose aussi (D-283).
      page("P2/permission", Q2_7, Q2_7_A),
      page("P2/exceptions", Q2_6_A, Q2_6),
      page(
        "P2/permission-mineur",
        Q2_8_1,
        Q2_8_2,
        Q2_8_3,
        Q2_8_DUREE_48H,
        Q2_8_4,
        Q2_8_5,
        Q2_8_6,
        Q2_8_6_A,
        Q2_8_6_B,
      ),
      page("P2/convocation", Q2_10, Q2_10_A, Q2_10_B),
      // La page de branche ne s'affiche que si l'une de ses questions se pose
      // (D-110). Le sens y suit le départ, qu'il lit. La finalité au-delà de
      // 150 km et l'urgence y ont leur place suivante : elles s'y posent si le
      // trajet ne les a pas posées (ADR-29).
      page(
        "P2/branche",
        Q2_13_DEPART,
        Q2_13_SENS,
        Q2_14_ELOIGNEMENT,
        Q2_14_MOTIF,
        Q2_3_1_FINALITE.unlessAskedBefore(),
        Q2_3_4.unlessAskedBefore(),
      ),
    ].map((suivante) => suivante.appliesWhen(dansLeCircuit)),
  ],
};
