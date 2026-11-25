// La page de l'issue refusée, `ISSUE_NON_ELIGIBLE`. Elle donne au
// socle le titre du prescripteur, sa phrase d'introduction, la feuille du
// patient. Une fiche négative ne restitue aucune portion du trajet.

import type { TraceDe } from "../../../../../../core/models/eligibilite/r2/blocs/ce-que-lit-un-bloc";
import type { CatalogueResultats } from "../../../../../../core/models/eligibilite/r2/blocs/forme-du-catalogue";
import {
  type LU_PAR_LA_FICHE_NEGATIVE,
  texteDeLaFicheNegative,
} from "../../../../../../core/models/eligibilite/r2/refusee/texte";
import type { FirstResult } from "../../../../../socle";
import { pageDeLaFeuille } from "../../components/page-de-la-fiche";
import { FicheNegative } from "./FicheNegative";

export function pageRefusee(
  catalogue: CatalogueResultats,
  trace: TraceDe<typeof LU_PAR_LA_FICHE_NEGATIVE>,
): FirstResult {
  const texte = texteDeLaFicheNegative(catalogue, trace);
  const page = pageDeLaFeuille(catalogue, texte.titreDuPrescripteur, {
    title: texte.titreDuPatient,
    intro: texte.raison,
    body: <FicheNegative texte={texte} />,
  });
  // Le titre du prescripteur dit le refus, en rouge foncé (TS1014-J05).
  return { ...page, tone: "refusal" };
}
