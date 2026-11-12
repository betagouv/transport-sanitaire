// fait_finalite_soins_longue_distance : déplacement nécessaire pour recevoir des
// soins ou passer un examen approprié.
//
// Une preuve du même trajet l'établit : un soin ou un examen en Q2.1 (1 à 5),
// une entrée, une sortie ou une admission en HAD (Q2.1.g), un soin lié à l'ALD
// (Q1.3.b), ou une seule séance en Q1.3. Un psychologue, un transfert ou
// « Autre motif » ne prouvent rien : le fait reste inconnu, et les règles
// disent si la question doit se poser.
//
// Il suit `CONTRAT_REPONSES_FAITS.json` et `finalite-longue-distance.mjs`
// (QST-FINALITE-LONGUE-DISTANCE).

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

const SOINS = given.question("Q1.3").answer();
const SEANCES = ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE", "5_DIALYSE"] as const;
const UNE_SEULE_SEANCE = SOINS.compute(
  (cochees) => SEANCES.filter((seance) => cochees.checked(seance)).length === 1,
);

export const finaliteSoinsLongueDistance = unFait(
  "fait_finalite_soins_longue_distance",
)
  .ouiSi(
    given
      .question("Q2.1")
      .answer()
      .isOneOf(
        "1_CONSULTATION",
        "2_DENTISTE_OU_SAGE_FEMME",
        "3_IMAGERIE",
        "4_BIOLOGIE",
        "5_PARAMEDICAL",
      ),
    "Un soin ou un examen motive ce déplacement.",
  )
  .ouiSi(
    given
      .question("Q2.1.g")
      .answer()
      .isOneOf("1_ENTREE", "2_SORTIE", "3_ADMISSION_HAD"),
    "Un segment de soin établi.",
  )
  .ouiSi(
    SOINS.checked("2_ALD").and(
      given.question("Q1.3.b").answer().is("1_LIEN_DIRECT"),
    ),
    "Un soin ou un examen lié à l'ALD.",
  )
  .ouiSi(UNE_SEULE_SEANCE, "Une séance motive ce déplacement.")
  .sinon("Aucune réponse ne prouve la finalité de soins.");
