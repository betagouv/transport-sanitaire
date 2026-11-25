// La page de l'issue refusée, `ISSUE_NON_ELIGIBLE`. Elle donne au
// socle le titre du prescripteur, sa phrase d'introduction, la feuille du
// patient. Une fiche négative ne restitue aucune portion du trajet.

import type { ResultatR2 } from "../../../../../../core/models/eligibilite/r2/r2";
import type { FirstResult } from "../../../../../socle";
import { pageDeLaFeuille } from "../../components/page-de-la-fiche";
import { FicheNegative } from "./FicheNegative";

export function pageRefusee({
  fiche,
  feuille,
}: Extract<ResultatR2, { cas: "refusée" }>): FirstResult {
  const page = pageDeLaFeuille(feuille, fiche.titreDuPrescripteur, {
    title: fiche.titreDuPatient,
    intro: fiche.raison,
    body: <FicheNegative texte={fiche} />,
  });
  // Le titre du prescripteur dit le refus, en rouge foncé (TS1014-J05).
  return { ...page, tone: "refusal" };
}
