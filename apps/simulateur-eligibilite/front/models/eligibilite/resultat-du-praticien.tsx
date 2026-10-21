// Le résultat des cinq issues sans fiche patient (D-112). Il charge les textes
// de l'éditeur à la demande (900 ko, hors du chunk d'entrée), calcule la
// trace des réponses, puis donne au socle le titre, l'introduction et la page
// du praticien.

import type { Answers, FirstResult } from "../../socle";
import { catalogueDeLaSession } from "./catalogue-resultats";
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

export async function resultatDuPraticien({
  answers,
  cibles,
  issue,
}: Props): Promise<FirstResult> {
  const chargement = await catalogueDeLaSession();
  if ("echec" in chargement) return CHARGEMENT_EN_ECHEC;
  const trace = traceDuResultat(answers, cibles);
  const texte = texteDuPraticien(chargement.catalogue, issue, trace);
  return {
    title: texte.titre,
    intro: texte.introduction,
    body: <PageDuPraticien texte={texte} />,
  };
}

// ---- implémentation ----

const CHARGEMENT_EN_ECHEC: FirstResult = {
  title: "Le résultat n’a pas pu être affiché",
  body: (
    <p role="alert">
      Les textes du résultat n’ont pas pu être chargés. Rechargez la page.
    </p>
  ),
};
