// Le transfert et l'article 80 : quand Q2.5 et Q2.6 se posent, et les faits
// que leurs pages établissent (D-106).
//
// Chaque fait suit `CONTRAT_REPONSES_FAITS.json` et `CONTRAT_NEGATIONS_PROUVEES.json`
// du paquet de l'éditeur. Sans Q2.6 validée, les huit exceptions restent
// absentes. Une exception proposée vaut « oui » cochée, « non » sinon. Une
// exception qui ne s'est pas proposée prend un prédicat structurel, tracé dans
// sa provenance.
//
// Le transfert et le Centre 15 reprennent, dans l'ordre, ce qui les écarte :
// le départ d'une entrée simple (Q2.13), la sortie vers la prison, la
// permission, puis ce que Q2.5 et Q2.6 établissent, et enfin le séjour écarté.

import {
  Fait,
  type GivenAnswer,
  regles,
  type ValidatedAnswers,
} from "../../../socle/index.ts";
import {
  type DeclarationsDeFaits,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";
import { departDUneEntreeSimple } from "./branche.ts";
import { sejourEcarte } from "./contextes.ts";
import { permissionSansTransfert } from "./permission.ts";
import {
  SORTIE_VERS_LA_PRISON,
  sortieVersLaPrison,
} from "./retour-penitentiaire.ts";

type Valides = ValidatedAnswers<Questions>;
type Exception = Questions["Q2.6"][number];
type TypeDuTransfert = Questions["Q2.6.a"];

/**
 * Q2.5 se pose-t-elle ? Q2.1 dit un transfert, ou Q2.2.1.a écarte la
 * permission : un déplacement pendant l'hospitalisation, au type à préciser.
 * Une sortie définitive vers la prison n'en est pas un (TS1012-04).
 */
export function transfertAPoser(validated: Valides): boolean {
  return (
    (validated.question("Q2.1").is("9_TRANSFERT") ||
      validated.question("Q2.2.1.a").is("2_NON")) &&
    !sortieVersLaPrison(validated)
  );
}

/** Q2.5 dit-elle un transfert entre établissements ? Q2.6.a se pose alors. */
export function typeAPoser(validated: Valides): boolean {
  return validated.question("Q2.5").is("1_TRANSFERT");
}

/**
 * Le champ I de l'article 80 est-il ouvert ? Un transfert, un autre
 * déplacement pendant un séjour coché, ou une admission en HAD que Q2.1.g
 * établit : Q2.6 se pose alors.
 */
export function champIOuvert(validated: Valides): boolean {
  const deplacement = validated.question("Q2.5");
  return (
    deplacement.is("1_TRANSFERT") ||
    (deplacement.is("2_AUTRE_DEPLACEMENT") && sejourCoche(validated)) ||
    admissionHad(validated)
  );
}

/**
 * Une exception de Q2.6 se propose-t-elle ? `type` est la réponse en cours de
 * Q2.6.a, sur la page. Q2.6 s'ouvre directement, sans Q2.5, pour une admission
 * en HAD : les options 2, 3 et 8 ne s'y proposent pas.
 */
export function exceptionAProposer(
  exception: Exception,
  type: GivenAnswer<TypeDuTransfert>,
  validated: Valides,
): boolean {
  const transfert = typeAPoser(validated);
  switch (exception) {
    case "2_ADMISSION_SANS_SEJOUR":
      return transfert && type.is("1_DEFINITIF") && !sejourCoche(validated);
    case "3_CENTRE_QUINZE":
      return transfert;
    case "4_AIR_MER":
      return validated.question("Q2.3.2").isNot(true);
    case "8_RADIOTHERAPIE":
      return (
        (transfert && type.is("2_PROVISOIRE")) ||
        validated.question("Q2.5").is("2_AUTRE_DEPLACEMENT")
      );
    default:
      return true;
  }
}

/**
 * L'hospitalisation qu'établit le transfert : un séjour coché avant un
 * transfert entre établissements, ou un autre déplacement pendant le séjour.
 * Un transfert depuis les urgences n'établit pas de séjour.
 */
export function hospitalisationDuTransfert(
  validated: Valides,
): Fait | undefined {
  const deplacement = validated.question("Q2.5");
  if (deplacement.is("1_TRANSFERT") && sejourCoche(validated))
    return Fait.oui("Q2.2.1 : séjour coché, Q2.5 : « 1_TRANSFERT ».");
  if (deplacement.is("2_AUTRE_DEPLACEMENT"))
    return Fait.oui("Q2.5 : « 2_AUTRE_DEPLACEMENT ».");
  return undefined;
}

/** Les faits que les pages du transfert et des exceptions établissent. */
export const FAITS_DU_TRANSFERT: DeclarationsDeFaits = {
  fait_transfert_article80: ({ validated }) => transfert(validated),
  fait_centre15_interetablissements: ({ validated }) => centre15(validated),
  fait_appel_centre15: ({ validated }) =>
    regles().retient(centre15DeQ26(validated)).sinon(PAS_ENCORE_ETABLI),
  fait_exception_article80_admission_sans_sejour: ({ validated }) =>
    exception(validated, "2_ADMISSION_SANS_SEJOUR"),
  fait_exception_article80_air_mer: ({ validated }) =>
    exception(validated, "4_AIR_MER"),
  fait_exception_article80_had_intercurrent: ({ validated }) =>
    exception(validated, "5_HAD"),
  fait_exception_article80_usld: ({ validated }) =>
    exception(validated, "6_USLD"),
  fait_exception_article80_ehpad: ({ validated }) =>
    exception(validated, "7_EHPAD"),
  fait_exception_article80_radiotherapie: ({ validated }) =>
    exception(validated, "8_RADIOTHERAPIE"),
  fait_exception_article80_dialyse_domicile: ({ validated }) =>
    exception(validated, "9_DIALYSE_A_DOMICILE"),
  fait_exception_article80_admission_had: ({ validated }) =>
    exception(validated, "10_ADMISSION_HAD"),
};

// ---- implémentation ----

/** Le séjour est-il coché en Q2.2.1 (« déjà hospitalisé ») ? */
function sejourCoche(validated: Valides): boolean {
  return validated.question("Q2.2.1").checked("1_HOSPITALISATION");
}

// Q2.1.g établit une admission en HAD à domicile : Q2.6 s'ouvre sans Q2.5.
function admissionHad(validated: Valides): boolean {
  return validated.question("Q2.1.g").is("3_ADMISSION_HAD");
}

// Le transfert de l'article 80 : Q2.5 l'établit, comme une admission en HAD
// ou un autre déplacement une fois Q2.6 validée.
function transfert(validated: Valides): Fait {
  const depart = departDUneEntreeSimple(validated);
  const deplacement = validated.question("Q2.5");
  const q26 = validated.question("Q2.6").hasAnswer();
  return regles()
    .nonSi(
      depart !== undefined,
      `Q2.13 : « ${depart} » ; une entrée simple est hors du champ du I de D.162-17.`,
    )
    .nonSi(sortieVersLaPrison(validated), SORTIE_VERS_LA_PRISON)
    .retient(permissionSansTransfert(validated))
    .ouiSi(
      admissionHad(validated) && q26,
      "Q2.1.g : « 3_ADMISSION_HAD », Q2.6 validée.",
    )
    .ouiSi(deplacement.is("1_TRANSFERT"), "Q2.5 : « 1_TRANSFERT ».")
    .ouiSi(
      deplacement.is("2_AUTRE_DEPLACEMENT") && q26,
      "Q2.5 et Q2.6 : déplacement provisoire pendant le séjour.",
    )
    .retient(sejourEcarte(validated))
    .sinon(PAS_ENCORE_ETABLI);
}

// Le Centre 15 entre établissements : l'option 3 de Q2.6 le dit. Un transfert
// entre établissements attend Q2.6 ; un autre déplacement n'en est pas un.
function centre15(validated: Valides): Fait {
  const depart = departDUneEntreeSimple(validated);
  const deplacement = validated.question("Q2.5");
  return regles()
    .nonSi(
      depart !== undefined,
      `Q2.13 : « ${depart} » ; aucun transfert entre établissements.`,
    )
    .nonSi(sortieVersLaPrison(validated), SORTIE_VERS_LA_PRISON)
    .retient(permissionSansTransfert(validated))
    .retient(centre15DeQ26(validated))
    .inconnuSi(
      deplacement.is("1_TRANSFERT"),
      "Q2.5 : transfert entre établissements ; Q2.6 dira si le Centre 15 l'a demandé.",
    )
    .nonSi(
      deplacement.is("2_AUTRE_DEPLACEMENT"),
      "Q2.5 : « 2_AUTRE_DEPLACEMENT ». Ce n'est pas un transfert entre établissements.",
    )
    .retient(sejourEcarte(validated))
    .sinon(PAS_ENCORE_ETABLI);
}

// L'option 3 de Q2.6 : le Centre 15 a-t-il demandé le transport ? Non
// proposée, elle ne dit rien.
function centre15DeQ26(validated: Valides): Fait | undefined {
  const exceptions = validated.question("Q2.6");
  return exceptions.hasAnswer()
    ? exceptions.faitOf("3_CENTRE_QUINZE")
    : undefined;
}

// Les exceptions qui ont un fait. L'option 3 n'en a pas : elle établit le
// Centre 15, et « Aucune » n'établit rien.
type ExceptionDuFait = Exclude<Exception, "3_CENTRE_QUINZE" | "11_AUCUNE">;

// Une exception, définie une fois Q2.6 validée : proposée, la case décide ;
// sinon, son prédicat structurel.
function exception(validated: Valides, option: ExceptionDuFait): Fait {
  const exceptions = validated.question("Q2.6");
  if (!exceptions.hasAnswer()) return Fait.inconnu(PAS_ENCORE_ETABLI);
  return exceptions.faitOf(option) ?? structurel(option, validated);
}

// Ce qu'une exception vaut quand Q2.6 ne l'a pas proposée.
function structurel(exception: ExceptionDuFait, validated: Valides): Fait {
  switch (exception) {
    case "2_ADMISSION_SANS_SEJOUR":
      return Fait.non(
        `Q2.6 : « ${exception} » ne s'est pas proposée : ${raisonSansAdmission(validated)}.`,
      );
    case "4_AIR_MER":
      return Fait.oui("Q2.3.2 : ligne régulière, réutilisée sans revote.");
    case "8_RADIOTHERAPIE":
      return Fait.non(
        `Q2.6 : « ${exception} » ne s'est pas proposée : ${raisonSansRadiotherapie(validated)}.`,
      );
    default:
      return Fait.inconnu(`Q2.6 : « ${exception} » ne s'est pas proposée.`);
  }
}

function raisonSansAdmission(validated: Valides): string {
  if (sejourCoche(validated)) return "un séjour initial est coché en Q2.2.1";
  if (validated.question("Q2.5").is("2_AUTRE_DEPLACEMENT"))
    return "Q2.5 : autre déplacement, pas un transfert";
  if (validated.question("Q2.6.a").is("2_PROVISOIRE"))
    return "Q2.6.a : transfert provisoire, avec retour à l'établissement d'origine";
  return "une admission en HAD n'est pas un transfert entre établissements";
}

function raisonSansRadiotherapie(validated: Valides): string {
  return validated.question("Q2.6.a").is("1_DEFINITIF")
    ? "Q2.6.a : transfert définitif"
    : "une admission en HAD n'est pas un transfert provisoire";
}
