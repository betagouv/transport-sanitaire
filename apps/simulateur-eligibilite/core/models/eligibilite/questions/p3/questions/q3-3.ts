// Q3.3 : le lieu d'arrivée, en quatre questions (`lieu.ts`). Il se choisit
// après le départ, que son adresse ne répète pas.

import { questionsDuLieu } from "./lieu.ts";
import { Q3_2 } from "./q3-2.ts";

export const Q3_3 = questionsDuLieu(
  "arrivee",
  {
    nature: "Quel est le lieu d’arrivée ?",
    adresse: "Adresse du lieu d’arrivée",
    rappel: "Lieu d’arrivée",
  },
  Q3_2,
);
