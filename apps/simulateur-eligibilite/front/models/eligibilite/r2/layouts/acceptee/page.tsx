// La page des issues acceptées : `ISSUE_PMT` et `ISSUE_S3141`,
// `ISSUE_DAP_SANS_URGENCE` et `ISSUE_DAP_URGENCE_ATTESTEE`. Elle donne
// au socle le titre du prescripteur, sa phrase d'introduction, la feuille du
// patient.

import type { ResultatR2 } from "../../../../../../core/models/eligibilite/r2/r2";
import type { FirstResult } from "../../../../../socle";
import { pageDeLaFeuille } from "../../components/page-de-la-fiche";
import { FichePositive } from "./FichePositive";

export function pageAcceptee({
  fiche,
  feuille,
}: Extract<ResultatR2, { cas: "acceptée" }>): FirstResult {
  return pageDeLaFeuille(feuille, fiche.titreDuPrescripteur, {
    title: fiche.titreDuPatient,
    preamble: fiche.modeDuTrajet && <p>{fiche.modeDuTrajet}</p>,
    intro: fiche.raison,
    body: <FichePositive texte={fiche} />,
  });
}
