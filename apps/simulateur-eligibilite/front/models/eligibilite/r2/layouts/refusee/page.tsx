// La page de l'issue refusée, `ISSUE_NON_ELIGIBLE` (#134). Elle donne au
// socle le titre du prescripteur, sa phrase d'introduction et la feuille du
// patient.

import type { FirstResult } from "../../../../../socle";
import type { TraceDe } from "../../components/ce-que-lit-un-bloc";
import type { CatalogueResultats } from "../../components/forme-du-catalogue";
import { pageDeLaFeuille } from "../../components/page-de-la-fiche";
import { FicheNegative } from "./FicheNegative";
import { type LU_PAR_LA_FICHE_NEGATIVE, texteDeLaFicheNegative } from "./texte";

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
