// fait_htnm_segment_verifie : règle exacte du segment HTNM vérifiée.
//
// Hors Engagement maternité, aucune règle du segment d'un HTNM n'est vérifiée :
// un HTNM coché en Q2.2.1.b le met à « non », et la caisse tranche.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { ContextesDuTrajet } from "../concepts/contextes-du-trajet.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const htnmSegmentVerifie: DeclarationDeFait = ({ validated }) => {
  const htnm = ContextesDuTrajet.of(validated).situation("5_HTNM");
  return unFait()
    .nonSi(
      htnm?.isOui() === true,
      `${htnm?.provenance} Le segment du HTNM hors Engagement n'est pas vérifié.`,
    )
    .sinon(PAS_ENCORE_ETABLI);
};
