// L'adresse du bénéficiaire : celle du domicile, quand le départ ou l'arrivée
// en est un (DOC-DOMICILE-ADRESSE-20261104). C'est l'adresse saisie en Q3.2
// ou Q3.3, jamais celle d'un assuré ni d'un établissement. Sans domicile au
// trajet, la cellule reste vide. Un trajet ne va pas du domicile au domicile.

import {
  type Extremite,
  natureDu,
  projectionCerfa,
} from "../../../../../core/models/eligibilite/questions/p3/conditions/lieux-du-trajet";
import { Q3_2 } from "../../../../../core/models/eligibilite/questions/p3/questions/q3-2";
import { Q3_3 } from "../../../../../core/models/eligibilite/questions/p3/questions/q3-3";
import { given } from "../../../../../core/models/eligibilite/questions/reponses";
import type { Rubrique } from "./rubrique";
import { adresseEnParties } from "./trajet";

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

const LIEUX = { depart: Q3_2, arrivee: Q3_3 } as const;

// L'adresse de ce lieu en une ligne, s'il est le domicile.
function adresseDuDomicile(extremite: Extremite) {
  const questions = LIEUX[extremite];
  return given
    .all({
      nature: natureDu(extremite, questions.nature),
      adresse: given.question(questions.adresse).answer(),
    })
    .compute(({ nature, adresse }): string | undefined => {
      if (nature === undefined || projectionCerfa(nature) !== "DOMICILE")
        return undefined;
      const parties = adresseEnParties(adresse.value);
      return parties.length > 0 ? parties.join(", ") : undefined;
    });
}
