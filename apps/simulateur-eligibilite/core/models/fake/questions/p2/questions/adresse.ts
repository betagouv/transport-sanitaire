// L'adresse : des champs séparés, en France ou à l'étranger.

import { question } from "../../question.ts";
import { FACTURATION } from "./facturation.ts";

export const ADRESSE = question
  .address("adresse", "À quelle adresse ?")
  .hint(
    "Démontre : une adresse en champs séparés, avec le nom du lieu. En France, le code postal fait cinq chiffres. À l'étranger, d'après la page précédente, le pays est attendu, et le code postal est libre et facultatif. Chaque champ fautif porte son message. Revenir changer la page précédente garde l'adresse : elle se relit dans le nouveau mode.",
  )
  .withPlaceName()
  .abroadIf(({ answers }) => answers.question(FACTURATION).is("etranger"));
