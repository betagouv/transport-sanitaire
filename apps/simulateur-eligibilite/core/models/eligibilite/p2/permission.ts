// La permission : quand Q2.7 et Q2.8 se posent, et les faits que leurs pages
// établissent (D-107).
//
// Chaque fait suit `CONTRAT_REPONSES_FAITS.json` du paquet de l'éditeur. Q2.1
// ou Q2.2.1.a établissent la permission ; le séjour écarté, l'entrée en
// établissement ou la sortie vers la prison l'excluent. Une permission acquise
// écarte le transfert et le Centre 15, dès la question qui la pose. Sans
// permission, ni sa charge par le patient, ni la règle du mineur. Le cadre de
// Q2.8.4.a ne change aucun fait.

import {
  Fait,
  type PassesOn,
  regles,
  type ValidatedAnswers,
} from "../../../socle/index.ts";
import { Permission } from "../concepts/permission.ts";
import { Sejour } from "../concepts/sejour.ts";
import {
  type DeclarationsDeFaits,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";
import { sejourEcarte } from "./contextes.ts";
import {
  SORTIE_VERS_LA_PRISON,
  sortieVersLaPrison,
} from "./retour-penitentiaire.ts";

type Valides = ValidatedAnswers<Questions>;

/**
 * Les options adultes de Q2.7 se proposent-elles ? Pas si Q1.3 dit un patient
 * de moins de 18 ans : un fait acquis retire les choix qu'il contredit.
 */
export function optionsAdultesAProposer(validated: Valides): boolean {
  return !validated.question("Q1.3").checked("8_MINEUR_SOINS_CONTINUS");
}

/**
 * Une permission n'est ni un transfert ni un déplacement pour soins : la
 * question qui la pose a écarté l'option 9 de Q2.1 (choix unique), ou l'option
 * 2 de Q2.2.1.a. Q2.5 ne se pose pas alors ; si elle est validée, elle décide.
 */
export function permissionSansTransfert(validated: Valides): Fait | PassesOn {
  if (validated.question("Q2.5").isValidated()) return undefined;
  if (validated.question("Q2.1").is("11_PERMISSION"))
    return Fait.non(
      "Q2.1 : « 11_PERMISSION » ; une permission n'est ni un transfert ni un déplacement pour soins (option 9 écartée).",
    );
  if (validated.question("Q2.2.1.a").is("1_OUI"))
    return Fait.non(
      "Q2.2.1.a : « 1_OUI » ; une permission n'est ni un transfert ni un déplacement pour soins (option 2 écartée).",
    );
  return undefined;
}

/** La permission, sa charge par le patient et la règle du mineur. */
export const FAITS_DE_LA_PERMISSION: DeclarationsDeFaits = {
  // Le séjour coché, seule Q2.2.1.a dit la permission : elle ne se pose qu'alors.
  fait_permission: ({ validated }) =>
    regles()
      .nonSi(sortieVersLaPrison(validated), SORTIE_VERS_LA_PRISON)
      .nonSi(
        validated.question("Q2.2.1").hasAnswer() &&
          Sejour.of(validated).commenceAvecCeTrajet(),
        "Q2.1.g : « 1_ENTREE » ; aucun séjour en cours, donc aucune permission.",
      )
      .retient(sejourEcarte(validated))
      .selon(validated.question("Q2.2.1.a"), { "1_OUI": "oui", "2_NON": "non" })
      .selon(validated.question("Q2.1"), { "11_PERMISSION": "oui" })
      .sinon("Ni Q2.1, ni Q2.2.1 n'établissent encore de permission."),
  // Q2.7 ne se pose qu'avec une permission acquise.
  fait_permission_charge_patient: ({ validated, faits }) =>
    regles()
      .nonSi(faits.fait_permission.isNon(), SANS_PERMISSION)
      .retient(chargeDeQ27(validated))
      .sinon(PAS_ENCORE_ETABLI),
  fait_permission_mineur_admissible: ({ validated, faits }) =>
    regles()
      .nonSi(faits.fait_permission.isNon(), SANS_PERMISSION)
      .retient(admissibiliteDeQ27(validated))
      .sinon(PAS_ENCORE_ETABLI),
};

// ---- implémentation ----

const SANS_PERMISSION = "fait_permission vaut « non » : aucune permission.";

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

// Un patient de moins de 20 ans : l'autorisation de Q2.8.4 décide. Les dates,
// la durée, la fréquence et l'âge sont garantis par les blocages de la page.
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
