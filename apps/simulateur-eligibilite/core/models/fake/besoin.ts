// Le besoin du modèle de démonstration : on vient goûter un thé, et commander
// un café. L'avis suit : sous le premier résultat pour un thé, sous le second
// pour un café. Sans boisson, rien ne se complète : il suit le premier
// résultat.

import { given } from "./questions/reponses.ts";

export const BESOIN = given
  .question("boisson")
  .answer()
  .is("cafe")
  .compute((cafe) => (cafe ? "prescribe" : "check"));
