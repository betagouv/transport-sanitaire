// Q3.4 : les précisions du soin, et ses sous-questions, la justification d'un
// lieu éloigné (Q3.4.distance) et le centre de référence (Q3.4.a). Elles
// précisent le volet médical de la PMT et de la DAP : le S3141 n'en a pas.
// Rien de ce qu'elles recueillent ne requalifie P2.

import type {
  Answered,
  GivenAnswers,
  ReadByObject,
} from "../../../../../socle/index.ts";
import { Q1_3, Q1_3_A } from "../../p1/questions/q1-3.ts";
import { Q2_1, Q2_1_F, Q2_1_G } from "../../p2/questions/q2-1.ts";
import { given, question } from "../../question.ts";
import { SENS_CHOISI } from "../conditions/sens-du-trajet.ts";
import { pmtOuDap } from "../conditions/supports-du-complement.ts";

// Un retour seul ne va pas vers le centre de référence.
const unRetourSeul = SENS_CHOISI.compute((sens) => sens === "2_RETOUR");

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
  .options({
    "1_OUI": "Oui",
    "2_NON": "Non",
  })
  .hint(
    "Oui pour un aller, ou un aller-retour, vers ce centre. Une maladie rare ne suffit pas.",
  )
  // Un retour seul ne va pas vers le centre : Non, sans question.
  .mattersWhile(pmtOuDap.and(unRetourSeul.not()));

// ---- implémentation ----

const SEANCES = ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE", "5_DIALYSE"] as const;

/** Une question à choix rappelée : sa réponse se rappelle sous son libellé. */
type AChoix = Answered<string> & {
  readonly labels: Readonly<Record<string, string>>;
};

// Le motif de Q2.1, les faits qui le précisent, et les séances que P1 a
// prouvées. Q2.1.l n'est pas codée : il n'y a pas d'intitulé à rappeler.
// L'intitulé de chaque fait rappelé est le nôtre (D-122).
function recapitulatifDuSoin(reponses: GivenAnswers<ReadByObject>) {
  const lu = (rappelee: AChoix, intitule: string) => {
    const reponse = reponses.question(rappelee).value;
    return reponse
      ? [{ label: intitule, value: rappelee.labels[reponse] ?? reponse }]
      : [];
  };
  const seances = SEANCES.filter((seance) =>
    reponses.question(Q1_3).checked(seance),
  ).map((seance) => ({ label: "Séance", value: Q1_3.labels[seance] }));
  const lignes = [
    ...lu(Q2_1, "Motif"),
    ...lu(Q2_1_G, "Précision"),
    ...seances,
    ...lu(Q1_3_A, "Séance d’hémodialyse"),
    ...lu(Q2_1_F, "Séances et déplacement"),
  ];
  return lignes.length > 0 ? lignes : undefined;
}
