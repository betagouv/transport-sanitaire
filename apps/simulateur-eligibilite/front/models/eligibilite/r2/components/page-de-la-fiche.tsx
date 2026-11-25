// Le résultat d'une issue à fiche patient : le titre du prescripteur, la
// consigne de lui remettre la fiche, puis la fiche. Toute fiche à remettre au
// patient est une feuille, que le socle pose dans sa liseuse, sous ses logos.
// Son pied invite le patient à donner son avis, par courriel (TS1014-J01).

import type { FeuilleDuPatient } from "../../../../../core/models/eligibilite/r2/r2";
import type { FirstResult, Sheet } from "../../../../socle";

export function pageDeLaFeuille(
  { introduction, avis }: FeuilleDuPatient,
  titre: string,
  feuille: Sheet,
): FirstResult {
  return {
    title: titre,
    intro: introduction,
    sheet: { ...feuille, footer: <AvisDuPatient {...avis} /> },
  };
}

// ---- implémentation ----

// Le texte de l'avis se termine par une espace : le courriel le suit.
function AvisDuPatient({ texte, courriel }: FeuilleDuPatient["avis"]) {
  return (
    <p>
      {texte}
      <a href={`mailto:${courriel}`}>{courriel}</a>
    </p>
  );
}
