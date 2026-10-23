// fait_permission_charge_patient : permission à charge du patient prouvée.
//
// Q2.7 ne se pose qu'avec une permission acquise : sans elle, il vaut « non ».
// Un adulte à sa charge l'établit quand l'établissement le confirme (Q2.7.a).
// La charge patient ne vaut que pour 20 ans ou plus.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

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

export const permissionChargePatient: DeclarationDeFait = ({
  validated,
  faits,
}) =>
  regles()
    .nonSi(faits.fait_permission.isNon(), SANS_PERMISSION)
    .retient(chargeDeQ27(validated))
    .sinon(PAS_ENCORE_ETABLI);

// ---- implémentation ----

type Valides = ValidatedAnswers<Questions>;

// La charge que Q2.7 établit : celle d'un adulte à sa charge, que Q2.7.a
// confirme. Q2.7 sans réponse n'établit rien.
function chargeDeQ27(validated: Valides): Fait | PassesOn {
  const tranche = validated.question("Q2.7");
  if (!tranche.hasAnswer()) return undefined;
  const source = `Q2.7 : « ${tranche.value} ».`;
  const permission = Permission.of(validated);
  if (permission.estDUnMineurDeVingtAns())
    return Fait.non(
      `${source} La charge patient ne vaut que pour 20 ans ou plus.`,
    );
  return permission.estAChargeDuPatient()
    ? chargeDuPatient(validated)
    : Fait.non(source);
}

// Un adulte à sa charge : l'établissement confirme, ou ne peut pas le vérifier.
function chargeDuPatient(validated: Valides): Fait {
  const confirmation = validated.question("Q2.7.a").value;
  const source = `Q2.7.a : « ${confirmation} ».`;
  switch (confirmation) {
    case "1_OUI":
      return Fait.oui(source);
    case "2_NON":
      return Fait.non(source);
    case "3_NE_SAIT_PAS":
      return Fait.inconnu(`${source} À vérifier.`);
    default:
      return Fait.inconnu(
        "Q2.7 : « 4_ADULTE_A_SA_CHARGE » ; Q2.7.a attend sa réponse.",
      );
  }
}
