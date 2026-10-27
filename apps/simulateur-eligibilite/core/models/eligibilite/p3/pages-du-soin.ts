// Les pages du soin (Q3.4, Q3.4.a) et de l'urgence (Q3.5). Elles précisent le
// volet médical de la PMT et de la DAP : le S3141 n'en a pas. Rien de ce
// qu'elles recueillent ne requalifie P2.

import { type GivenAnswers, page } from "../../../socle/index.ts";
import { OPTIONS, type Questions } from "../declarations/questions.ts";
import { given, question } from "../question.ts";
import { pmtOuDap } from "./supports-du-complement.ts";

// Un retour seul ne va pas vers le centre de référence.
const unRetourSeul = given.question("Q3.1.2").answer().is("2_RETOUR");

// `cible_urgence_autre` manque tant que l'appel au Centre 15 n'est pas un fait :
// l'urgence attestée suffit alors, puisque l'appel n'est pas établi.
const autre = given.cible("cible_urgence_autre");
const uneAutreUrgence = autre
  .isOui()
  .or(
    autre
      .isInconnue()
      .or(autre.isSansObjet())
      .and(given.cible("cible_urgence_attestee").isOui())
      .and(given.cible("cible_urgence_appel15").isOui().not()),
  );

// Le soin, tel que P2 l'a validé, se rappelle sans se redemander. Aucun code
// de nomenclature ne s'affiche.
export const PAGE_DU_SOIN = page(
  "P3/soin",
  question
    .longText(
      "Q3.4",
      "Quelles précisions sur le soin et le trajet doivent figurer sur la prescription ?",
    )
    .hint(
      "Seulement ce qui manque encore à la prescription. Une précision qui change le soin ou le motif demande une nouvelle simulation.",
    )
    .optional()
    .mattersWhile(pmtOuDap)
    .reminderFrom(({ answers }) => recapitulatifDuSoin(answers)),
  question
    .longText(
      "Q3.4.distance",
      "Justification médicale du lieu de soins éloigné",
    )
    .hint("Au-delà de 150 km, la demande d’accord préalable l’exige.")
    .mattersWhile(given.cible("cible_dap_motif_longue_distance").isOui()),
  question
    .singleChoice(
      "Q3.4.a",
      "Le transport à prescrire comprend-il un trajet vers un centre de référence pour une maladie rare ?",
    )
    .hint(
      "Oui pour un aller, ou un aller-retour, vers ce centre. Une maladie rare ne suffit pas.",
    )
    // Un retour seul ne va pas vers le centre : Non, sans question.
    .mattersWhile(pmtOuDap.and(unRetourSeul.not())),
);

// L'urgence se précise seulement si les règles l'ont retenue, hors appel au
// Centre 15 (`cible_urgence_autre`). Elle ne se repose pas, et sa précision ne
// change rien à l'issue. La référence du Centre 15 ne se demande pas : un
// appel au Centre 15 entre établissements va toujours à la caisse, sans
// document à compléter.
export const PAGE_DE_L_URGENCE = page(
  "P3/urgence",
  question
    .longText(
      "Q3.5",
      "Quelle précision faut-il apporter sur l’urgence déjà attestée ?",
    )
    .hint("La nature de l’urgence médicale attestée.")
    .mattersWhile(pmtOuDap.and(uneAutreUrgence)),
);

// ---- implémentation ----

const SEANCES = ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE", "5_DIALYSE"] as const;

// L'intitulé de chaque fait rappelé, le nôtre (D-122).
const PRECISIONS = {
  "Q2.1": "Motif",
  "Q2.1.g": "Précision",
  "Q2.1.h": "Séance dans le parcours de l’enfant",
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
    ...lu("Q2.1.h"),
    ...seances,
    ...lu("Q1.3.a"),
    ...lu("Q2.1.f"),
  ];
  return lignes.length > 0 ? lignes : undefined;
}
