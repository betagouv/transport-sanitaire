// Le constructeur des faits du modèle : `fait("fait_permission")`, puis ses
// règles. Le nom est vérifié contre la liste des faits que les règles
// reçoivent.

import { faitsOf } from "../../socle";
import type { Faits } from "./declarations/faits";

/** Le constructeur d'un fait du modèle, par son nom. */
export const fait = faitsOf<Faits>();
