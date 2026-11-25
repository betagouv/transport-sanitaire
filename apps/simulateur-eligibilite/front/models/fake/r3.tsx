// Le second résultat du modèle de démonstration (R3) à l'écran : la commande
// complétée, et son bon de commande. Ce que R3 dit est du métier :
// `core/models/fake/r3/r3.ts`.

import { R3 as METIER } from "../../../core/models/fake/r3/r3";
import type { ValueOf } from "../../../core/socle";
import type { ResultatProps } from "../../socle";
import { bonDeCommande } from "./bon-de-commande";

/** Ce que R3 reçoit du socle : `R3.lit`. */
export type Lecture = ResultatProps<ValueOf<typeof METIER.lit>>;

export const R3 = {
  lit: METIER.lit,
  document: METIER.aUnBon.compute((aUnBon) => (aUnBon ? bonDeCommande : null)),
  titre: METIER.titre,
  boutonDeDepart: METIER.boutonDeDepart,
  Page: CommandeCompletee,
};

// ---- implémentation ----

function CommandeCompletee({ reading }: Lecture) {
  return (
    <>
      <p className="fr-text--lead">
        Commande : {reading.commande.value}, {reading.quantite} tasses
      </p>
      {reading.adresse && <p>Facture à envoyer : {reading.adresse}</p>}
      <p>
        Le bon de commande est prêt à être imprimé. Il doit encore être signé
        avant d'être envoyé.
      </p>
    </>
  );
}
