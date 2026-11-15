// La page des cinq issues orientées, sans fiche patient (D-112). Elle donne
// au socle le titre, l'introduction et la page du prescripteur, réduits aux
// sections que le catalogue montre, et le nom de la page, celui du gabarit de
// l'éditeur (TS1014-TERMINOLOGIE-PRESCRIPTEUR). Le journal des parcours reçoit
// ses scénarios, et aucune portion du trajet : la page n'en restitue pas.

import type { OrientedIssueId } from "../../../../../../core/models/eligibilite/cibles/issue.vo";
import type { FirstResult } from "../../../../../socle";
import type { TraceDe } from "../../components/ce-que-lit-un-bloc";
import type { CatalogueResultats } from "../../components/forme-du-catalogue";
import { identifiantsDes } from "../../components/motif";
import { PageDuPrescripteur } from "./PageDuPrescripteur";
import {
  type LU_PAR_LE_PRESCRIPTEUR,
  selonLAffichage,
  texteDuPrescripteur,
} from "./texte";

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
    motifs: texte.motifs && identifiantsDes(texte.motifs),
    portions: [],
  };
}
