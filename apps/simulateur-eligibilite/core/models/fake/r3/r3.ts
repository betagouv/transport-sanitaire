// Le second résultat du modèle de démonstration (R3) : ce que dit la commande
// complétée. Sans boisson, il n'y a rien à compléter : R2 est le dernier écran.
// Son rendu et son bon de commande sont dans `front/models/fake/`.

import { SANS_COMMANDE } from "../cibles/evaluation.ts";
import { given } from "../questions/reponses.ts";
import { enUneLigne } from "./adresse.ts";

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
  /** Y a-t-il un bon de commande à compléter ? */
  aUnBon: COMMANDE.compute((commande) => !commande.is(SANS_COMMANDE)),
  titre: COMMANDE.compute(({ value }) => `Commande complétée : ${value}`),
  boutonDeDepart: COMMANDE.compute((commande) =>
    commande.is(SANS_COMMANDE) ? null : "Compléter la commande",
  ),
};
