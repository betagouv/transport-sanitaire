// Q3.4 : les précisions du soin, et ses sous-questions, la justification d'un
// lieu éloigné (Q3.4.distance) et le centre de référence (Q3.4.a). Elles
// précisent le volet médical de la PMT et de la DAP : le S3141 n'en a pas.
// Rien de ce qu'elles recueillent ne requalifie P2.

import type { GivenAnswers } from "../../../../../socle/index.ts";
import { OPTIONS, type Questions } from "../../catalogue/catalogue.ts";
import { given, question } from "../../question.ts";
import { pmtOuDap } from "../conditions/supports-du-complement.ts";

// Un retour seul ne va pas vers le centre de référence.
const unRetourSeul = given.question("Q3.1.2").answer().is("2_RETOUR");

const SEANCES = ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE", "5_DIALYSE"] as const;

// L'intitulé de chaque fait rappelé, le nôtre (D-122).
const PRECISIONS = {
  "Q2.1": "Motif",
  "Q2.1.g": "Précision",
  "Q1.3.a": "Séance d’hémodialyse",
  "Q2.1.f": "Séances et déplacement",
} as const;

// Le motif de Q2.1, les faits qui le précisent, et les séances que P1 a
// prouvées. Q2.1.l n'est pas codée : il n'y a pas d'intitulé à rappeler.
function recapitulatifDuSoin(reponses: GivenAnswers<Questions>) {
  const lu = (id: keyof typeof PRECISIONS) => {
    const reponse = reponses.question(id).value;
    const libelles: Readonly<Record<string, string>> = OPTIONS[id];
    return reponse
      ? [{ label: PRECISIONS[id], value: libelles[reponse] ?? reponse }]
      : [];
  };
  const seances = SEANCES.filter((seance) =>
    reponses.question("Q1.3").checked(seance),
  ).map((seance) => ({ label: "Séance", value: OPTIONS["Q1.3"][seance] }));
  const lignes = [
    ...lu("Q2.1"),
    ...lu("Q2.1.g"),
    ...seances,
    ...lu("Q1.3.a"),
    ...lu("Q2.1.f"),
  ];
  return lignes.length > 0 ? lignes : undefined;
}

// Le soin, tel que P2 l'a validé, se rappelle sans se redemander. Aucun code
// de nomenclature ne s'affiche.
export const Q3_4 = question
  .longText(
    "Q3.4",
    "Quelles précisions sur le soin et le trajet doivent figurer sur la prescription ?",
  )
  .hint(
    "Seulement ce qui manque encore à la prescription. Une précision qui change le soin ou le motif demande une nouvelle simulation.",
  )
  .optional()
  .mattersWhile(pmtOuDap)
  .reminderFrom(({ answers }) => recapitulatifDuSoin(answers));

export const Q3_4_DISTANCE = question
  .longText("Q3.4.distance", "Justification médicale du lieu de soins éloigné")
  .hint("Au-delà de 150 km, la demande d’accord préalable l’exige.")
  .mattersWhile(given.cible("cible_dap_motif_longue_distance").isOui());

export const Q3_4_A = question
  .singleChoice(
    "Q3.4.a",
    "Le transport à prescrire comprend-il un trajet vers un centre de référence pour une maladie rare ?",
  )
  .hint(
    "Oui pour un aller, ou un aller-retour, vers ce centre. Une maladie rare ne suffit pas.",
  )
  // Un retour seul ne va pas vers le centre : Non, sans question.
  .mattersWhile(pmtOuDap.and(unRetourSeul.not()));
