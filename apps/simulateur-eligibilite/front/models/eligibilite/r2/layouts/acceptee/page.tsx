// La page des issues acceptées : `ISSUE_PMT` et `ISSUE_S3141` (#135),
// `ISSUE_DAP_SANS_URGENCE` et `ISSUE_DAP_URGENCE_ATTESTEE` (#136). Elle donne
// au socle le titre du prescripteur, sa phrase d'introduction et la feuille du
// patient.

import type { FirstResult } from "../../../../../socle";
import type { TraceDe } from "../../components/ce-que-lit-un-bloc";
import type { CatalogueResultats } from "../../components/forme-du-catalogue";
import { pageDeLaFeuille } from "../../components/page-de-la-fiche";
import { FichePositive } from "./FichePositive";
import type { IssueAcceptee } from "./issues";
import { type LU_PAR_LA_FICHE_POSITIVE, texteDeLaFichePositive } from "./texte";

export function pageAcceptee(
  catalogue: CatalogueResultats,
  trace: TraceDe<typeof LU_PAR_LA_FICHE_POSITIVE>,
  issue: IssueAcceptee,
): FirstResult {
  const texte = texteDeLaFichePositive(catalogue, trace, issue);
  if (!texte) return SANS_MODE;
  return pageDeLaFeuille(catalogue, texte.titreDuPrescripteur, {
    title: texte.titreDuPatient,
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
