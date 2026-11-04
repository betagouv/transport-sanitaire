// La commande : la partie de démonstration qui décide. Ses pages, dans
// l'ordre, faites de ses questions (`questions/`).

import { page } from "../../../../socle/index.ts";
import { ACCOMPAGNEMENTS } from "./questions/accompagnements.ts";
import { BOISSON } from "./questions/boisson.ts";
import { QUELLE_PREPARATION, SERVICE } from "./questions/service.ts";

/** Modifiable tant que le résultat n'est pas verrouillé. */
export const COMMANDE = {
  id: "commande",
  title: "Questionnaire de démonstration",
  pages: [
    page("boisson", BOISSON),
    page("accompagnements", ACCOMPAGNEMENTS),
    page("service", SERVICE, QUELLE_PREPARATION),
  ],
} as const;
