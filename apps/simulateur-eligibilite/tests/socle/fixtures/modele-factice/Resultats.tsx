// Les deux résultats du modèle factice : la commande, puis la commande
// complétée.

import type { ValueOf } from "../../../../core/socle";
import type { FirstResult, ResultatProps } from "../../../../front/socle";
import { given } from "./questionnaire";

/** Le premier résultat ne lit que la commande. */
export const LA_COMMANDE = given.all({ commande: given.cible("commande") });

/** Le second lit la commande et la quantité. */
export const LA_QUANTITE = given.all({
  commande: given.cible("commande"),
  quantite: given
    .question("quantite")
    .answer()
    .compute(({ value }) => String(value)),
});

export function resultatDeLaCommande({
  reading,
}: ResultatProps<ValueOf<typeof LA_COMMANDE>>): FirstResult {
  return {
    title: "Votre commande",
    body: <p className="fr-text--lead">Commande : {reading.commande.value}</p>,
  };
}

export function CommandeCompletee({
  reading,
}: ResultatProps<ValueOf<typeof LA_QUANTITE>>) {
  return (
    <p className="fr-text--lead">
      Commande : {reading.commande.value}, {reading.quantite} tasses
    </p>
  );
}
