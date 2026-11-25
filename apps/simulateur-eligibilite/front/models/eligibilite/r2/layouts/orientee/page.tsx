// La page des cinq issues orientées, sans fiche patient. Elle donne
// au socle le titre, l'introduction et la page du prescripteur, réduits aux
// sections que le catalogue montre, et le nom de la page, celui du gabarit de
// l'éditeur (TS1014-TERMINOLOGIE-PRESCRIPTEUR).

import type { ResultatR2 } from "../../../../../../core/models/eligibilite/r2/r2";
import type { FirstResult } from "../../../../../socle";
import { PageDuPrescripteur } from "./PageDuPrescripteur";

export function pageOrientee({
  page,
}: Extract<ResultatR2, { cas: "orientée" }>): FirstResult {
  return {
    title: page.titre,
    intro: page.introduction,
    body: <PageDuPrescripteur texte={page} />,
    label: "Résultat pour le prescripteur",
  };
}
