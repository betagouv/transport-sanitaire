// Le second résultat du modèle de démonstration (R3) : la commande complétée.
// Sans boisson, il n'y a rien à compléter : R2 est le dernier écran.

import { SANS_COMMANDE } from "../../../core/models/fake/cibles/evaluation";
import { given } from "../../../core/models/fake/questions/question";
import type { ValueOf } from "../../../core/socle";
import type { ResultatProps } from "../../socle";
import { enUneLigne } from "./adresse";
import { bonDeCommande } from "./bon-de-commande";

/** Ce que R3 reçoit du socle : `R3.lit`. */
export type Lecture = ResultatProps<
  ValueOf<typeof LU_PAR_LA_COMMANDE_COMPLETEE>
>;

// La boisson commandée, que lisent le choix du bon, son titre et le bouton.
const COMMANDE = given.cible("commande");

// Ce que lit R3 : la commande, la quantité, l'adresse.
const LU_PAR_LA_COMMANDE_COMPLETEE = given.all({
  commande: COMMANDE,
  quantite: given
    .question("quantite")
    .answer()
    .compute(({ value }) => String(value)),
  adresse: given
    .question("adresse")
    .answer()
    .compute((adresse) =>
      adresse.hasAnswer() ? enUneLigne(adresse.value) : null,
    ),
});

export const R3 = {
  lit: LU_PAR_LA_COMMANDE_COMPLETEE,
  document: COMMANDE.compute((commande) =>
    commande.is(SANS_COMMANDE) ? null : bonDeCommande,
  ),
  titre: COMMANDE.compute(({ value }) => `Commande complétée : ${value}`),
  boutonDeDepart: COMMANDE.compute((commande) =>
    commande.is(SANS_COMMANDE) ? null : "Compléter la commande",
  ),
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
