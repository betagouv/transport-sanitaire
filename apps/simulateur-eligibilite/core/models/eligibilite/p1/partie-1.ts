// P1 : l'autonomie et l'état de santé du patient, ce qui fait le mode de
// transport. Les options et leurs libellés viennent des déclarations.

import { page, type QuestionnairePart } from "../../../socle/index.ts";
import { AideDuPatient } from "../concepts/aide-du-patient.ts";
import type { Questions } from "../declarations/questions.ts";
import { given, question } from "../question.ts";

type Partie<Cibles> = QuestionnairePart<Questions, Cibles>;

// Q1.1 : un professionnel intervient pendant le transport, ou non.
const aide = given.question("Q1.1").answer();
const avecUnProfessionnel = aide.is("3_AVEC_UN_PROFESSIONNEL");
const sansProfessionnel = aide.isOneOf("1_SEUL", "2_AVEC_UN_PROCHE");

// Les critères de Q1.2 qui imposent l'ambulance.
const CRITERES_D_AMBULANCE = [
  "7_ALLONGE",
  "8_BRANCARDAGE",
  "9_SURVEILLANCE",
  "10_OXYGENE",
  "11_ASEPSIE",
] as const satisfies readonly Questions["Q1.2"][number][];

const unCritereDAmbulance = given
  .question("Q1.2")
  .answer()
  .compute((criteres) =>
    CRITERES_D_AMBULANCE.some((critere) => criteres.checked(critere)),
  );

// Le partage ne concerne que le transport assis professionnel et le TPMR. Les
// règles ne donnent le mode qu'une fois P1 complète : Q1.3 est la dernière
// question qui le fait, on la tient donc pour complète le temps de la poser.
const unModePartageable = given
  .cible("cible_mode_tap_ou_tpmr")
  .assuming("fait_p1_complete")
  .isOui();

// L'ordre d'écran de Q1.3, que son contrat fixe : le mineur suit l'ALD. Les
// slugs gardent le numéro du catalogue, et « Aucune » ferme la liste.
const ORDRE_DES_CAS = [
  "1_FORTE_CORPULENCE",
  "2_ALD",
  "8_MINEUR_SOINS_CONTINUS",
  "3_CHIMIOTHERAPIE",
  "4_RADIOTHERAPIE",
  "5_DIALYSE",
  "6_PARTAGE_INCOMPATIBLE",
] satisfies readonly Questions["Q1.3"][number][];

// Q1.3, et Q1.3.a sur la même page quand une dialyse est cochée. Décocher la
// dialyse retire Q1.3.a, et sa réponse avec elle.
const PAGE_DES_CAS_PARTICULIERS = page(
  "P1/3",
  question
    .multipleChoice(
      "Q1.3",
      "Avant d’établir le mode de transport adéquat, sélectionnez tous les éventuels cas particuliers concernant le patient.",
    )
    .order(...ORDRE_DES_CAS)
    .exclusive("7_AUCUNE")
    // La corpulence ne compte qu'avec un motif d'ambulance. Retiré en Q1.2, il
    // emporte la réponse.
    .option("1_FORTE_CORPULENCE", (option) =>
      option.offeredWhen(unCritereDAmbulance),
    )
    .option("6_PARTAGE_INCOMPATIBLE", (option) =>
      option.offeredWhen(unModePartageable),
    ),
  question
    .singleChoice(
      "Q1.3.a",
      "La séance prévue est-elle une séance d’hémodialyse ?",
    )
    .appliesWhen(given.question("Q1.3").answer().checked("5_DIALYSE")),
);

/** P1 : ce qui fait le mode de transport. Aucun résultat ne la suit seule. */
export const P1: Partie<undefined> = {
  id: "P1",
  title: "Autonomie et état de santé",
  pages: [
    page(
      "P1/1",
      question.singleChoice("Q1.1", "Concernant son déplacement, le patient :"),
    ),
    page(
      "P1/2",
      question
        .multipleChoice(
          "Q1.2",
          "Quelles aides ou conditions particulières sont nécessaires pendant le transport ?",
        )
        .appliesWhen(avecUnProfessionnel)
        .dependsOn("Q1.1")
        .incompatible(
          "6_FAUTEUIL_SANS_TRANSFERT",
          "7_ALLONGE",
          "Le patient voyage dans son fauteuil ou allongé sur un brancard : une seule de ces deux positions pour un même trajet.",
        )
        .incompatible(
          "4_HYGIENE",
          "11_ASEPSIE",
          "L’asepsie va au-delà des précautions d’hygiène : un seul de ces deux niveaux est retenu pour un même trajet.",
        ),
    ),
    PAGE_DES_CAS_PARTICULIERS,
    page(
      "P1/4",
      question
        .singleChoice(
          "Q1.4",
          "Le patient pouvant réaliser le trajet sans intervention d’un professionnel, merci de préciser sa préférence en matière de transport.",
        )
        // Le catalogue demande que le libellé précise « en toute autonomie »
        // ou « avec l’aide d’un proche », sans donner la phrase.
        .labelFrom(({ answers }) =>
          AideDuPatient.of(answers).avecUnProche()
            ? "Le patient pouvant réaliser le trajet avec l’aide d’un proche, sans intervention d’un professionnel, merci de préciser sa préférence en matière de transport."
            : "Le patient pouvant réaliser le trajet en toute autonomie, sans intervention d’un professionnel, merci de préciser sa préférence en matière de transport.",
        )
        .appliesWhen(sansProfessionnel)
        .dependsOn("Q1.1"),
    ),
  ],
};
