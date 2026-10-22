// Le récapitulatif de P3, que R3 affiche tant que les documents se téléchargent
// vierges : chaque question validée, sous son libellé du moment, avec sa réponse
// en toutes lettres. Un échafaudage : il part quand les documents se remplissent
// (#161).

import type { Cibles } from "../../../../core/models/eligibilite/declarations/cibles";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import { COMPLEMENT } from "../../../../core/models/eligibilite/p3/partie-3";
import {
  type Address,
  type Answers,
  type AskedQuestion,
  type GivenAnswers,
  Questionnaire,
} from "../../../../core/socle";

/** Ce que R3 reçoit du socle : les réponses, et les cibles figées au verrou. */
export type LectureDuComplement = {
  answers: GivenAnswers<Questions>;
  cibles: Cibles;
};

/** Une ligne du récapitulatif : la question, puis sa réponse. */
export type LigneDuRecapitulatif = { question: string; reponse: string };

// P3 se relit comme elle s'est affichée : ses pages, avec les réponses d'avant
// le verrou et les cibles figées. Chaque question s'y lit sous son libellé du
// moment, et ses options aussi.
export function recapitulatifDuComplement({
  answers,
  cibles,
}: LectureDuComplement): LigneDuRecapitulatif[] {
  const lecture = new Questionnaire<Questions>(COMPLEMENT.pages).readWith(
    answers,
    cibles,
  );
  const validees: Answers = lecture.validated.answers();
  return lecture.askedPages().flatMap((page) =>
    lecture.questionsOn(page).flatMap((question) => {
      const reponse = validees[question.id];
      if (reponse === undefined) return [];
      return [
        { question: question.label, reponse: enLettres(question, reponse) },
      ];
    }),
  );
}

// ---- implémentation ----

function enLettres(question: AskedQuestion, reponse: unknown): string {
  switch (question.kind) {
    case "single choice":
      return libelleDe(question.options, reponse);
    case "multiple choice": {
      const { options, exclusiveOption } = question;
      return (reponse as string[])
        .map((valeur) => libelleDe([...options, exclusiveOption], valeur))
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
  options: readonly ({ value: string; label: string } | undefined)[],
  valeur: unknown,
): string {
  const option = options.find((candidate) => candidate?.value === valeur);
  return option?.label ?? String(valeur);
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
