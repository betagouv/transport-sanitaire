// fait_permission_mineur_admissible : permission moins de 20 ans répondant à
// R.322-10-8.
//
// Sans permission, il vaut « non ». Q2.7 dit un patient de moins de 20 ans,
// et l'autorisation de Q2.8.4 décide. Les dates, la durée, la fréquence et
// l'âge sont garantis par les blocages de la page. Le cadre de Q2.8.4.a ne
// change aucun fait.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import {
  Fait,
  type PassesOn,
  regles,
  type ValidatedAnswers,
} from "../../../socle/index.ts";
import { Permission } from "../concepts/permission.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
  SANS_PERMISSION,
} from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";

export const permissionMineurAdmissible: DeclarationDeFait = ({
  validated,
  faits,
}) =>
  regles()
    .nonSi(faits.fait_permission.isNon(), SANS_PERMISSION)
    .retient(admissibiliteDeQ27(validated))
    .sinon(PAS_ENCORE_ETABLI);

// ---- implémentation ----

type Valides = ValidatedAnswers<Questions>;

// L'admissibilité que Q2.7 établit : celle d'un patient de moins de 20 ans,
// que Q2.8.4 décide. Avant Q2.8.4, rien.
function admissibiliteDeQ27(validated: Valides): Fait | PassesOn {
  const tranche = validated.question("Q2.7");
  if (!tranche.hasAnswer()) return undefined;
  if (!Permission.of(validated).estDUnMineurDeVingtAns())
    return Fait.non(
      `Q2.7 : « ${tranche.value} ». L'admissibilité ne vaut que pour moins de 20 ans.`,
    );
  return validated.question("Q2.8.4").isValidated()
    ? admissibilite(validated)
    : undefined;
}

// Un patient de moins de 20 ans : l'autorisation de Q2.8.4 décide.
function admissibilite(validated: Valides): Fait {
  const autorisation = validated.question("Q2.8.4").value;
  const source = `Q2.8.4 : « ${autorisation} ».`;
  switch (autorisation) {
    case "1_OUI":
      return Fait.oui(source);
    case "2_NON":
      return Fait.non(`${source} Permission non autorisée selon R.1112-56.`);
    case "3_NE_SAIT_PAS":
      return Fait.inconnu(`${source} À vérifier.`);
    default:
      return Fait.inconnu("Q2.8.4 attend sa réponse.");
  }
}
