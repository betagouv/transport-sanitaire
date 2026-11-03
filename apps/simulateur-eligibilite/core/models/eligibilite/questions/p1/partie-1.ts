// P1 : l'autonomie et l'état de santé du patient, ce qui fait le mode de
// transport. Ses pages, dans l'ordre, faites de ses questions (`questions/`).

import { page, type QuestionnairePart } from "../../../../socle/index.ts";
import type { Questions } from "../catalogue/catalogue.ts";
import { Q1_1 } from "./questions/q1-1.ts";
import { Q1_2 } from "./questions/q1-2.ts";
import { Q1_3, Q1_3_A, Q1_3_B } from "./questions/q1-3.ts";
import { Q1_4 } from "./questions/q1-4.ts";

/** P1 : ce qui fait le mode de transport. Aucun résultat ne la suit seule. */
export const P1: QuestionnairePart<Questions, undefined> = {
  id: "P1",
  title: "Autonomie et état de santé",
  pages: [
    page("P1/1", Q1_1),
    page("P1/2", Q1_2),
    page("P1/3", Q1_3, Q1_3_B, Q1_3_A),
    page("P1/4", Q1_4),
  ],
};
