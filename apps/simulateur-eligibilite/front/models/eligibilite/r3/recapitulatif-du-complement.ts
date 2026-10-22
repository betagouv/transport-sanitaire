// Le récapitulatif de P3, que R3 affiche en attendant le PDF du cerfa (#157) :
// chaque question validée, sous son libellé du moment, avec sa réponse en
// toutes lettres. Un échafaudage : il part quand le cerfa se remplit.

import type { Cibles } from "../../../../core/models/eligibilite/declarations/cibles";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import { COMPLEMENT } from "../../../../core/models/eligibilite/p3/partie-3";
import type {
  Address,
  GivenAnswers,
  QuestionnairePart,
  ValidatedAnswers,
} from "../../../../core/socle";

/** Ce que R3 reçoit du socle : les réponses, les questions validées, les cibles. */
export type LectureDuComplement = {
  answers: GivenAnswers<Questions>;
  validated: ValidatedAnswers<Questions>;
  cibles: Cibles;
};

/** Une ligne du récapitulatif : la question, puis sa réponse. */
export type LigneDuRecapitulatif = { question: string; reponse: string };

export function recapitulatifDuComplement(
  lecture: LectureDuComplement,
): LigneDuRecapitulatif[] {
  const vu: Vu = [lecture.answers, lecture.cibles, lecture.validated];
  return COMPLEMENT.pages
    .flatMap((page) => page.questions)
    .flatMap((question) => {
      const validee = lecture.validated.question(question.id);
      if (!validee.isValidated() || !validee.hasAnswer()) return [];
      const libelle = question.labelFrom?.(...vu) ?? question.label;
      const reponse = enLettres(question, validee.value, vu);
      return [{ question: libelle, reponse }];
    });
}

// ---- implémentation ----

type Question = QuestionnairePart<
  Questions,
  Cibles
>["pages"][number]["questions"][number];
type Option = Extract<Question, { options: unknown }>["options"][number];
type Vu = [GivenAnswers<Questions>, Cibles, ValidatedAnswers<Questions>];

function enLettres(question: Question, reponse: unknown, vu: Vu): string {
  switch (question.kind) {
    case "single choice":
      return libelleDe([...question.options], reponse, vu);
    case "multiple choice": {
      const options = [...question.options, question.exclusiveOption];
      return (reponse as string[])
        .map((valeur) => libelleDe(options, valeur, vu))
        .join(", ");
    }
    case "number":
      return [(reponse as number).toLocaleString("fr-FR"), question.unit]
        .filter(Boolean)
        .join(" ");
    case "checkbox":
      return reponse ? "Oui" : "Non";
    case "date":
    case "datetime":
      return dateEnLettres(reponse as string);
    case "address":
      return adresseEnLettres(reponse as Address);
    default:
      return String(reponse);
  }
}

function libelleDe(
  options: readonly (Option | undefined)[],
  valeur: unknown,
  vu: Vu,
): string {
  const option = options.find((candidate) => candidate?.value === valeur);
  return option?.labelFrom?.(...vu) ?? option?.label ?? String(valeur);
}

// `2026-10-12` devient « 12/10/2026 », `2026-10-12T08:30` « 12/10/2026 à 08:30 ».
function dateEnLettres(date: string): string {
  const [jour = "", heure] = date.split("T");
  const enFrancais = jour.split("-").reverse().join("/");
  return heure ? `${enFrancais} à ${heure}` : enFrancais;
}

function adresseEnLettres(adresse: Address): string {
  const ville = [adresse.postalCode, adresse.city].filter(Boolean).join(" ");
  return [
    adresse.placeName,
    adresse.street,
    adresse.complement,
    ville,
    adresse.country,
  ]
    .filter(Boolean)
    .join(", ");
}
