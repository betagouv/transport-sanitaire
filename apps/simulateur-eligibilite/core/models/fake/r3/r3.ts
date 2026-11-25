// Le second résultat du modèle de démonstration (R3) : ce que dit la commande
// complétée. Sans boisson, il n'y a rien à compléter : R2 est le dernier écran.
// Son rendu et son bon de commande sont dans `front/models/fake/`.

import { SANS_COMMANDE } from "../cibles/evaluation.ts";
import { given } from "../questions/reponses.ts";
import { enUneLigne } from "./adresse.ts";
import {
  type BonDeCommande,
  VERS_LE_BON_DE_COMMANDE,
} from "./bon-de-commande.ts";

/** Les documents du modèle : un bon de commande, et son DTO. */
export type DtosDesDocuments = { readonly "bon-de-commande": BonDeCommande };

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
  /** Les valeurs du bon de commande. */
  valeurs: { "bon-de-commande": VERS_LE_BON_DE_COMMANDE },
  /** Le document à compléter : le bon de commande, s'il y a une boisson. */
  document: COMMANDE.compute((commande): "bon-de-commande" | null =>
    commande.is(SANS_COMMANDE) ? null : "bon-de-commande",
  ),
  titre: COMMANDE.compute(({ value }) => `Commande complétée : ${value}`),
  boutonDeDepart: COMMANDE.compute((commande) =>
    commande.is(SANS_COMMANDE) ? null : "Compléter la commande",
  ),
};
