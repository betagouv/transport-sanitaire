// Les deux résultats du modèle factice : la commande, puis la commande
// complétée.

import type { GivenAnswers } from "../../../../core/socle";
import type { FirstResult } from "../../../../front/socle";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";

type Props = { answers: GivenAnswers<Questions>; cibles: Cibles };

export function resultatDeLaCommande({ cibles }: Props): FirstResult {
  return {
    title: "Votre commande",
    body: <p className="fr-text--lead">Commande : {cibles.commande}</p>,
  };
}

export function CommandeCompletee({ answers, cibles }: Props) {
  return (
    <p className="fr-text--lead">
      Commande : {cibles.commande}, {String(answers.question("quantite").value)}{" "}
      tasses
    </p>
  );
}
