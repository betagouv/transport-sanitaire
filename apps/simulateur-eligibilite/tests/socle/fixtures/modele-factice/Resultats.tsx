// Les deux résultats du modèle factice : la commande, puis la commande
// complétée.

import type { FirstResult, ResultatProps } from "../../../../front/socle";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import { given } from "./questionnaire";

/** Le premier résultat ne lit rien des réponses : la commande suffit. */
export const RIEN_DES_REPONSES = given.all({});

/** Le second lit la quantité. */
export const LA_QUANTITE = given.all({
  quantite: given
    .question("quantite")
    .answer()
    .compute(({ value }) => String(value)),
});

export function resultatDeLaCommande({
  cibles,
}: ResultatProps<Faits, Cibles, object>): FirstResult {
  return {
    title: "Votre commande",
    body: <p className="fr-text--lead">Commande : {cibles.commande.value}</p>,
  };
}

export function CommandeCompletee({
  reading,
  cibles,
}: ResultatProps<Faits, Cibles, { readonly quantite: string }>) {
  return (
    <p className="fr-text--lead">
      Commande : {cibles.commande.value}, {reading.quantite} tasses
    </p>
  );
}
