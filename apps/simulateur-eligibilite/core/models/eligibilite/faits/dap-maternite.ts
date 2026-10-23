// fait_dap_maternite : dispositif Engagement maternité qualifié avec DAP.
//
// Les deux groupes de Q2.14 (`CONTRAT_Q214_GROUPES.json`) : une condition
// cochée dans chacun établit le dispositif, « Aucune » dans l'un l'écarte. Un
// groupe sans réponse le laisse à la maternité signalée en Q2.2.1.b.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { regles } from "../../../socle/index.ts";
import { ContextesDuTrajet } from "../concepts/contextes-du-trajet.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const dapMaternite: DeclarationDeFait = ({ validated }) => {
  const eloignement = validated.question("Q2.14.eloignement");
  const motif = validated.question("Q2.14.motif");
  const conditions = [
    ...eloignement.checkedBoxes(),
    ...motif.checkedBoxes(),
  ].join(" », « ");
  return regles()
    .nonSi(
      eloignement.checked("3_AUCUNE"),
      "Q2.14 : aucun éloignement éligible.",
    )
    .nonSi(motif.checked("3_AUCUNE"), "Q2.14 : aucun motif éligible.")
    .ouiSi(
      eloignement.hasAnswer() && motif.hasAnswer(),
      `Q2.14 : « ${conditions} ».`,
    )
    .retient(ContextesDuTrajet.of(validated).situation("4_MATERNITE_ELOIGNEE"))
    .sinon(PAS_ENCORE_ETABLI);
};
