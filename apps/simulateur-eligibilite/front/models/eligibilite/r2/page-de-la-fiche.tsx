// Le résultat d'une issue à fiche patient : le titre du prescripteur, la
// consigne de lui remettre la fiche, puis la fiche. Toute fiche à remettre au
// patient est une feuille, que le socle pose dans sa liseuse, sous ses logos.
// Son pied invite le patient à donner son avis, par courriel (TS1014-J01).

import type { CatalogueResultats } from "../../../../core/models/eligibilite/declarations/catalogue-resultats";
import type { FirstResult, Sheet } from "../../../socle";

// La phrase d'introduction est `patientSheetIntro` du catalogue (point 28).
type Catalogue = Pick<
  CatalogueResultats,
  "patientSheetIntro" | "patientFeedback"
>;

export function pageDeLaFeuille(
  { patientSheetIntro, patientFeedback }: Catalogue,
  titre: string,
  feuille: Sheet,
): FirstResult {
  return {
    title: titre,
    intro: patientSheetIntro,
    sheet: { ...feuille, footer: <AvisDuPatient {...patientFeedback} /> },
  };
}

// ---- implémentation ----

// Le texte du catalogue se termine par une espace : le courriel le suit.
function AvisDuPatient({ text, email }: Catalogue["patientFeedback"]) {
  return (
    <p>
      {text}
      <a href={`mailto:${email}`}>{email}</a>
    </p>
  );
}
