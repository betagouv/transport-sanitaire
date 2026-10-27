// fait_trajet_etranger : le départ ou l'arrivée du trajet évalué est hors de
// France.
//
// L'étranger, proposé et écarté en Q2.2.1, le met à « non ». Sinon, Q2.2.5 le
// dit : une extrémité à l'étranger l'établit, le seul lieu des soins ne suffit
// pas.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const trajetEtranger: DeclarationDeFait = ({ validated }) => {
  const lieux = validated.question("Q2.2.5");
  const extremite = lieux
    .checkedBoxes()
    .some((lieu) => lieu !== "3_LIEU_DES_SOINS");
  const source = `Q2.2.5 : « ${lieux.value?.join(" », « ")} ».`;
  return unFait()
    .nonSi(
      validated.question("Q2.2.1").declined("2_ETRANGER"),
      "Q2.2.1 : « l'étranger » proposé, non coché.",
    )
    .ouiSi(lieux.hasAnswer() && extremite, source)
    .nonSi(lieux.hasAnswer(), source)
    .sinon(PAS_ENCORE_ETABLI);
};
