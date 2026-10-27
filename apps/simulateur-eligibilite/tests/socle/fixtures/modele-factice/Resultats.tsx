// Les deux résultats du modèle factice : la commande, puis la commande
// complétée.

import type { FirstResult, ResultatProps } from "../../../../front/socle";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import { given } from "./questionnaire";

type Props = ResultatProps<Faits, Cibles>;

export function resultatDeLaCommande({ cibles }: Props): FirstResult {
  return {
    title: "Votre commande",
    body: <p className="fr-text--lead">Commande : {cibles.commande.value}</p>,
  };
}

export function CommandeCompletee({ read, cibles }: Props) {
  return (
    <p className="fr-text--lead">
      Commande : {cibles.commande.value},{" "}
      {String(read(given.question("quantite").answer()).value)} tasses
    </p>
  );
}
