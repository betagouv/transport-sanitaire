// Le catalogue des faits du modèle de démonstration : un fichier par fait. Ce
// qui est commandé, en toutes lettres, et ce qu'on sait du lait et du citron.
// Les gardes les lisent, et la préconisation les donne aux règles.

import { FaitCatalogue } from "../../../socle/index.ts";
import { accompagnements } from "./accompagnements.ts";
import { boisson } from "./boisson.ts";
import { citron } from "./citron.ts";
import { lait } from "./lait.ts";
import { FAITS, type Faits } from "./noms.ts";

/** Les faits du modèle de démonstration, chacun déclaré une fois. */
// Annoté : les questions lisent ce catalogue, et ses faits lisent leurs
// réponses. Inféré, son type tournerait en rond.
export const CATALOGUE_DES_FAITS: FaitCatalogue<Faits> = new FaitCatalogue(
  FAITS,
  [boisson, accompagnements, lait, citron],
);
