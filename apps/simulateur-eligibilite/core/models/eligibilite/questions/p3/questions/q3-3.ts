// Q3.3 : le lieu d'arrivée (`lieu.ts`). Il se choisit après le départ, dont
// il lit la catégorie, et que son adresse ne répète pas.

import { lieuDArrivee } from "./lieu.ts";
import { Q3_2 } from "./q3-2.ts";

export const Q3_3 = lieuDArrivee(
  {
    categorie: "Quel est le lieu d’arrivée ?",
    adresse: "Adresse du lieu d’arrivée",
    rappel: "Lieu d’arrivée",
  },
  Q3_2,
);
