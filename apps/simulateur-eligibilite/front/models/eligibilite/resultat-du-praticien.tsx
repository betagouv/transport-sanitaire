// Le résultat des cinq issues sans fiche patient (D-112). Il charge les textes
// de l'éditeur à la demande, calcule la trace des réponses, puis donne au
// socle le titre, l'introduction et la page du praticien.

import type { Answers, FirstResult } from "../../socle";
import { avecLeCatalogue } from "./avec-le-catalogue";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";
import { PageDuPraticien } from "./PageDuPraticien";
import { type IssueSansFiche, texteDuPraticien } from "./texte-du-praticien";
import { traceDuResultat } from "./trace-du-resultat";

type Props = {
  answers: Answers<Questions>;
  cibles: Cibles;
  issue: IssueSansFiche;
};

export function resultatDuPraticien({
  answers,
  cibles,
  issue,
}: Props): Promise<FirstResult> {
  return avecLeCatalogue((catalogue) => {
    const trace = traceDuResultat(answers, cibles);
    const texte = texteDuPraticien(catalogue, issue, trace);
    return {
      title: texte.titre,
      intro: texte.introduction,
      body: <PageDuPraticien texte={texte} />,
    };
  });
}
