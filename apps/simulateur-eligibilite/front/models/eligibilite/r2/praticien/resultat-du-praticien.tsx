// Le résultat des cinq issues sans fiche patient (D-112). Il charge les textes
// de l'éditeur à la demande, calcule la trace des réponses, puis donne au
// socle le titre, l'introduction et la page du praticien.

import type { FirstResult } from "../../../../socle";
import { avecLeCatalogue } from "../avec-le-catalogue";
import { type ReponsesEtCibles, traceDuResultat } from "../trace-du-resultat";
import { PageDuPraticien } from "./PageDuPraticien";
import { type IssueSansFiche, texteDuPraticien } from "./texte-du-praticien";

type Props = ReponsesEtCibles & { issue: IssueSansFiche };

export function resultatDuPraticien({
  issue,
  ...reponses
}: Props): Promise<FirstResult> {
  return avecLeCatalogue((catalogue) => {
    const trace = traceDuResultat(reponses);
    const texte = texteDuPraticien(catalogue, issue, trace);
    return {
      title: texte.titre,
      intro: texte.introduction,
      body: <PageDuPraticien texte={texte} />,
    };
  });
}
