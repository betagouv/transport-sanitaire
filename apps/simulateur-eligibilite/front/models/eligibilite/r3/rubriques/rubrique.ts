// Une rubrique : des cellules que plusieurs cerfa partagent, et le calcul de
// chacune. Elle ne connaît aucun gabarit. Chaque cerfa prend les rubriques
// qu'il a, en tout ou en partie, et dit dans quel champ va chaque cellule : un
// cerfa qui change ou disparaît ne touche ni les rubriques ni les autres.
//
// Une cellule porte le nom que lui donne l'éditeur (`mapping_documents.json`).
// Une case vaut `true` cochée. Une valeur inconnue vaut `undefined` et laisse
// sa cellule vide : elle ne coche jamais « Non ».
//
// Une cellule est une valeur du modèle (`given`), lue sur les questions
// validées : une réponse restée d'une question qui ne se pose plus, après un
// retour en arrière, ne s'écrit pas. Son jour est celui de la complétion.

import type { Value } from "../../../../../core/socle";

/** La valeur de chaque cellule d'une rubrique. */
export type Rubrique<Cellules> = {
  readonly [Cellule in keyof Cellules]-?: Value<Cellules[Cellule]>;
};
