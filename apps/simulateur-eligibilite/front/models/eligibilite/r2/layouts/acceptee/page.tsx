// La page des issues acceptées : `ISSUE_PMT` et `ISSUE_S3141`,
// `ISSUE_DAP_SANS_URGENCE` et `ISSUE_DAP_URGENCE_ATTESTEE`. Elle donne
// au socle le titre du prescripteur, sa phrase d'introduction, la feuille du
// patient.

import type { AcceptedIssueId } from "../../../../../../core/models/eligibilite/cibles/issue.vo";
import {
  type LU_PAR_LA_FICHE_POSITIVE,
  texteDeLaFichePositive,
} from "../../../../../../core/models/eligibilite/r2/acceptee/texte";
import type { TraceDe } from "../../../../../../core/models/eligibilite/r2/blocs/ce-que-lit-un-bloc";
import type { CatalogueResultats } from "../../../../../../core/models/eligibilite/r2/blocs/forme-du-catalogue";
import type { FirstResult } from "../../../../../socle";
import { pageDeLaFeuille } from "../../components/page-de-la-fiche";
import { FichePositive } from "./FichePositive";

export function pageAcceptee(
  catalogue: CatalogueResultats,
  trace: TraceDe<typeof LU_PAR_LA_FICHE_POSITIVE>,
  issue: AcceptedIssueId,
): FirstResult {
  const texte = texteDeLaFichePositive(catalogue, trace, issue);
  if (!texte) return SANS_MODE;
  return pageDeLaFeuille(catalogue, texte.titreDuPrescripteur, {
    title: texte.titreDuPatient,
    preamble: texte.modeDuTrajet && <p>{texte.modeDuTrajet}</p>,
    intro: texte.raison,
    body: <FichePositive texte={texte} />,
  });
}

// ---- implémentation ----

// Sans mode, les règles n'ont pas pu choisir le transport : un fait dont elles
// dépendent est absent. Rien n'est alors à compléter.
const SANS_MODE: FirstResult = {
  title: "Le mode de transport n’a pas pu être choisi",
  terminal: true,
  body: (
    <p>
      Les réponses données ne suffisent pas à choisir le mode de transport : le
      questionnaire n’est pas complet.
    </p>
  ),
};
