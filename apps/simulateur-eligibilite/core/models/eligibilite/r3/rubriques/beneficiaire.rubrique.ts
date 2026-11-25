// L'adresse du bénéficiaire : celle du domicile, quand le départ ou l'arrivée
// en est un (DOC-DOMICILE-ADRESSE-20261104). C'est l'adresse saisie en Q3.2
// ou Q3.3, jamais celle d'un assuré ni d'un établissement. Sans domicile au
// trajet, la cellule reste vide. Un trajet ne va pas du domicile au domicile.

import type { Extremite } from "../../questions/p3/lieux/lieux-du-trajet.types.ts";
import { given } from "../../questions/reponses.ts";
import { LieuxDuCerfa } from "./lieux-du-cerfa.service.ts";
import type { Rubrique } from "./rubrique.types.ts";

/** Le trajet ne passe pas par le domicile, ou son adresse manque. */
type SansDomicile = undefined;

export type Beneficiaire = {
  readonly beneficiaire_adresse?: string;
};

export const BENEFICIAIRE: Rubrique<Beneficiaire> = {
  beneficiaire_adresse: given
    .all({
      depart: adresseDuDomicile("depart"),
      arrivee: adresseDuDomicile("arrivee"),
    })
    .compute(({ depart, arrivee }) => depart ?? arrivee),
};

// ---- implémentation ----

// L'adresse de ce lieu en une ligne, s'il est le domicile.
function adresseDuDomicile(extremite: Extremite) {
  return given
    .all({
      domicile: LieuxDuCerfa.auDomicile(extremite),
      adresse: given
        .question(LieuxDuCerfa.QUESTIONS[extremite].adresse)
        .answer(),
    })
    .compute(({ domicile, adresse }): string | SansDomicile => {
      if (!domicile) return undefined;
      const parties = LieuxDuCerfa.adresseEnParties(adresse.value);
      return parties.length > 0 ? parties.join(", ") : undefined;
    });
}
