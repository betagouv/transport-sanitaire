// Le résultat des cinq issues sans fiche patient (D-112). Il charge les textes
// de l'éditeur à la demande, calcule la trace des réponses, puis donne au
// socle le titre, l'introduction et la page du prescripteur, réduits aux
// sections que le catalogue montre, et le nom de la page, celui du gabarit de
// l'éditeur (TS1014-TERMINOLOGIE-PRESCRIPTEUR).

import type { FirstResult } from "../../../../socle";
import { avecLeCatalogue } from "../avec-le-catalogue";
import { type Lecture, traceDuResultat } from "../trace-du-resultat";
import { PageDuPrescripteur } from "./PageDuPrescripteur";
import {
  type IssueSansFiche,
  selonLAffichage,
  texteDuPrescripteur,
} from "./texte-du-prescripteur";

type Props = Lecture & { issue: IssueSansFiche };

export function resultatDuPrescripteur({
  issue,
  ...lecture
}: Props): Promise<FirstResult> {
  return avecLeCatalogue((catalogue) => {
    const trace = traceDuResultat(lecture);
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
  });
}
