// La commande : la partie de démonstration qui décide. Ses pages, dans
// l'ordre, faites de ses questions (`questions/`).

import { page } from "../../../../socle/index.ts";
import { ACCOMPAGNEMENTS } from "./questions/accompagnements.question.ts";
import { BOISSON } from "./questions/boisson.question.ts";
import {
  MIGNARDISE,
  MIGNARDISE_AU_SERVICE,
} from "./questions/mignardise.question.ts";
import {
  QUELLE_PREPARATION,
  SERVICE,
  SOUS_VERRE,
} from "./questions/service.question.ts";

/** Modifiable tant que le résultat n'est pas verrouillé. */
export const COMMANDE = {
  id: "commande",
  title: "Questionnaire de démonstration",
  pages: [
    page("boisson", BOISSON),
    page("accompagnements", ACCOMPAGNEMENTS, MIGNARDISE),
    page(
      "service",
      SERVICE,
      QUELLE_PREPARATION,
      SOUS_VERRE,
      MIGNARDISE_AU_SERVICE,
    ),
  ],
} as const;
