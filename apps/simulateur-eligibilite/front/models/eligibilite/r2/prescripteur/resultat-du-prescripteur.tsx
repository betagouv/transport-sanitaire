// Le résultat des cinq issues sans fiche patient (D-112). Il charge les textes
// de l'éditeur à la demande, calcule la trace des réponses, puis donne au
// socle le titre, l'introduction et la page du prescripteur.

import type { FirstResult } from "../../../../socle";
import { avecLeCatalogue } from "../avec-le-catalogue";
import { type Lecture, traceDuResultat } from "../trace-du-resultat";
import { PageDuPrescripteur } from "./PageDuPrescripteur";
import {
  type IssueSansFiche,
  texteDuPrescripteur,
} from "./texte-du-prescripteur";

type Props = Lecture & { issue: IssueSansFiche };

export function resultatDuPrescripteur({
  issue,
  ...lecture
}: Props): Promise<FirstResult> {
  return avecLeCatalogue((catalogue) => {
    const trace = traceDuResultat(lecture);
    const texte = texteDuPrescripteur(catalogue, issue, trace);
    return {
      title: texte.titre,
      intro: texte.introduction,
      body: <PageDuPrescripteur texte={texte} />,
    };
  });
}
