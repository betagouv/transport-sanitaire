// Les textes propres à `ISSUE_S3141` (#135) : la phrase de la permission et le
// motif administratif du modus. Des fonctions pures de la trace, sans React.
//
// L'éditeur les choisit sur Q2.8.5 (`permissionRepeated`) et sur l'ambulance.
// Les quatre phrases ne reprennent pas les motifs administratifs de la
// prescription médicale de transport (README de l'éditeur). Sans réponse à
// Q2.8.5, le catalogue ne dit pas quoi montrer : aucune phrase n'est choisie
// à sa place. La phrase déclare ce qu'elle lit des cibles
// (`ce-que-lit-un-texte.ts`) ; le motif n'en lit rien.

import type {
  AucunTexte,
  CatalogueResultats,
} from "../../../../../core/models/eligibilite/declarations/catalogue-resultats";
import { given } from "../../../../../core/models/eligibilite/question";
import { luPar, type TraceDe } from "../ce-que-lit-un-texte";
import type { ReponsesLues } from "../trace-du-resultat";

type IssueS3141 = CatalogueResultats["issues"]["ISSUE_S3141"];

/** Ce que lit la phrase de la permission : l'ambulance. */
export const LU_PAR_LA_PERMISSION = luPar({
  cibles: given.cibles("cible_mode_ambulance"),
});

/** La phrase qui dit pourquoi la permission ouvre le transport. */
export function phraseDeLaPermission(
  issue: IssueS3141,
  trace: TraceDe<typeof LU_PAR_LA_PERMISSION>,
): string | AucunTexte {
  if (trace.permissionRepeated === undefined) return undefined;
  const repetee = trace.permissionRepeated ? "R" : "U";
  const ambulance = trace.cibles.cible_mode_ambulance.isOui() ? "-B" : "";
  return texte(issue.permissionPhrases, `E-S3141-${repetee}${ambulance}`);
}

/** Le motif administratif du modus : une permission, ou plusieurs. */
export function motifDeLaPermission(
  issue: IssueS3141,
  trace: ReponsesLues,
): string | AucunTexte {
  if (trace.permissionRepeated === undefined) return undefined;
  const suffixe = trace.permissionRepeated ? "N" : "1";
  return texte(issue.permissionAdministrative, `MA-S3141-${suffixe}`);
}

// ---- implémentation ----

function texte(
  textes: readonly { id: string; text: string }[],
  id: string,
): string | AucunTexte {
  return textes.find((candidat) => candidat.id === id)?.text;
}
