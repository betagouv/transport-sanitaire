// La page des cinq issues orientées, sans fiche patient. Elle donne
// au socle le titre, l'introduction et la page du prescripteur, réduits aux
// sections que le catalogue montre, et le nom de la page, celui du gabarit de
// l'éditeur (TS1014-TERMINOLOGIE-PRESCRIPTEUR).

import type { OrientedIssueId } from "../../../../../../core/models/eligibilite/cibles/issue.vo";
import type { TraceDe } from "../../../../../../core/models/eligibilite/r2/blocs/ce-que-lit-un-bloc";
import type { CatalogueResultats } from "../../../../../../core/models/eligibilite/r2/blocs/forme-du-catalogue";
import {
  type LU_PAR_LE_PRESCRIPTEUR,
  selonLAffichage,
  texteDuPrescripteur,
} from "../../../../../../core/models/eligibilite/r2/orientee/texte";
import type { FirstResult } from "../../../../../socle";
import { PageDuPrescripteur } from "./PageDuPrescripteur";

export function pageOrientee(
  catalogue: CatalogueResultats,
  trace: TraceDe<typeof LU_PAR_LE_PRESCRIPTEUR>,
  issue: OrientedIssueId,
): FirstResult {
  const texte = selonLAffichage(
    texteDuPrescripteur(catalogue, issue, trace),
    catalogue.issues[issue],
  );
  return {
    title: texte.titre,
    intro: texte.introduction,
    body: <PageDuPrescripteur texte={texte} />,
    label: "Résultat pour le prescripteur",
  };
}
