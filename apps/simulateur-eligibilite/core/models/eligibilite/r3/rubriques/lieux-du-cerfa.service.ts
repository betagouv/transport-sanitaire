// Ce que les rubriques du cerfa lisent des deux lieux du trajet : les
// questions de chaque lieu, sa case du domicile, son adresse en parties.
// `trajet.rubrique.ts` et `beneficiaire.rubrique.ts` s'y appuient.

import type {
  AddressData,
  Reading,
  Unanswered,
} from "../../../../socle/index.ts";
import type { Extremite } from "../../questions/p3/conditions/lieux-du-trajet.ts";
import { Q3_2 } from "../../questions/p3/questions/q3-2.question.ts";
import { Q3_3 } from "../../questions/p3/questions/q3-3.question.ts";

export class LieuxDuCerfa {
  /** Les questions de chaque lieu. */
  static readonly QUESTIONS = { depart: Q3_2, arrivee: Q3_3 } as const;

  /** La case du domicile. Sans catégorie, aucune rubrique ne reçoit le lieu. */
  static auDomicile(extremite: Extremite): Reading<boolean> {
    return LieuxDuCerfa.QUESTIONS[extremite].categorieDuLieu.compute(
      (categorie) => categorie === "1_DOMICILE",
    );
  }

  /**
   * Les parties saisies de l'adresse. Le code postal et la commune vont
   * ensemble, comme sur une enveloppe.
   */
  static adresseEnParties(adresse: AddressData | Unanswered): string[] {
    if (adresse === undefined) return [];
    const ville = [adresse.postalCode, adresse.city].filter(Boolean).join(" ");
    return [
      adresse.placeName,
      adresse.street,
      adresse.complement,
      ville,
      adresse.country,
    ].filter((partie): partie is string => Boolean(partie));
  }
}
