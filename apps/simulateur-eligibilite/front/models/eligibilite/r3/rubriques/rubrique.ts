// Une rubrique : des cellules que plusieurs cerfa partagent, et le calcul de
// chacune. Elle ne connaît aucun gabarit. Chaque cerfa prend les rubriques
// qu'il a, en tout ou en partie, et dit dans quel champ va chaque cellule : un
// cerfa qui change ou disparaît ne touche ni les rubriques ni les autres.
//
// Une cellule porte le nom que lui donne l'éditeur (`mapping_documents.json`).
// Une case vaut `true` cochée. Une valeur inconnue vaut `undefined` et laisse
// sa cellule vide : elle ne coche jamais « Non ».
//
// Une rubrique lit les questions validées : une réponse restée d'une question
// qui ne se pose plus, après un retour en arrière, ne s'écrit pas.

import type { Cibles } from "../../../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../../../core/models/eligibilite/declarations/faits";
import type { Questions } from "../../../../../core/models/eligibilite/declarations/questions";
import type { CerfaInput } from "../../../../socle";

/** Ce que le simulateur sait au moment de remplir le cerfa. */
export type Donnees = CerfaInput<Questions, Faits, Cibles>;

/** Le calcul de chaque cellule d'une rubrique. */
export type Rubrique<Cellules> = {
  readonly [Cellule in keyof Cellules]-?: (
    donnees: Donnees,
  ) => Cellules[Cellule];
};
