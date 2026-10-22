// P1 : l'autonomie et l'état de santé du patient, ce qui fait le mode de
// transport. Les options et leurs libellés viennent des déclarations.

import type { QuestionnairePart } from "../../../socle";
import type { Questions } from "../declarations/questions";
import { question } from "../question";
import { modeDe } from "./mode-de-transport";
import { sansProfessionnel } from "./reponses";

type Partie<Cibles> = QuestionnairePart<Questions, Cibles>;

const PROFESSIONNEL = "3_AVEC_UN_PROFESSIONNEL";

// Les critères de Q1.2 qui imposent l'ambulance.
const CRITERES_D_AMBULANCE = [
  "7_ALLONGE",
  "8_BRANCARDAGE",
  "9_SURVEILLANCE",
  "10_OXYGENE",
  "11_ASEPSIE",
] as const;

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
const PAGE_DES_CAS_PARTICULIERS: Partie<undefined>["pages"][number] = {
  id: "P1/3",
  questions: [
    question.multipleChoice("Q1.3", {
      label:
        "Avant d’établir le mode de transport adéquat, sélectionnez tous les éventuels cas particuliers concernant le patient.",
      order: ORDRE_DES_CAS,
      exclusiveOption: "7_AUCUNE",
      options: {
        // La corpulence ne compte qu'avec un motif d'ambulance. Retiré en
        // Q1.2, il emporte la réponse.
        "1_FORTE_CORPULENCE": {
          offeredIf: ({ validated }) =>
            CRITERES_D_AMBULANCE.some((critere) =>
              validated.question("Q1.2").checked(critere),
            ),
        },
        // Le partage ne concerne que le transport assis professionnel et le
        // TPMR. Ce sont les règles qui disent le mode.
        "6_PARTAGE_INCOMPATIBLE": {
          offeredIf: ({ validated }) => {
            const mode = modeDe(validated);
            return mode === "TAP" || mode === "TPMR";
          },
        },
      },
    }),
    question.singleChoice("Q1.3.a", {
      label: "La séance prévue est-elle une séance d’hémodialyse ?",
      askedIf: ({ answers }) => answers.question("Q1.3").checked("5_DIALYSE"),
    }),
  ],
};

/** P1 : ce qui fait le mode de transport. Aucun résultat ne la suit seule. */
export const P1: Partie<undefined> = {
  id: "P1",
  title: "Autonomie et état de santé",
  pages: [
    {
      id: "P1/1",
      questions: [
        question.singleChoice("Q1.1", {
          label: "Concernant son déplacement, le patient :",
        }),
      ],
    },
    {
      id: "P1/2",
      questions: [
        question.multipleChoice("Q1.2", {
          label:
            "Quelles aides ou conditions particulières sont nécessaires pendant le transport ?",
          askedIf: ({ answers }) => answers.question("Q1.1").is(PROFESSIONNEL),
          dependsOn: ["Q1.1"],
          incompatibleOptions: [
            {
              values: ["6_FAUTEUIL_SANS_TRANSFERT", "7_ALLONGE"],
              explanation:
                "Le patient voyage dans son fauteuil ou allongé sur un brancard : une seule de ces deux positions pour un même trajet.",
            },
            {
              values: ["4_HYGIENE", "11_ASEPSIE"],
              explanation:
                "L’asepsie va au-delà des précautions d’hygiène : un seul de ces deux niveaux est retenu pour un même trajet.",
            },
          ],
        }),
      ],
    },
    PAGE_DES_CAS_PARTICULIERS,
    {
      id: "P1/4",
      questions: [
        question.singleChoice("Q1.4", {
          label:
            "Le patient pouvant réaliser le trajet sans intervention d’un professionnel, merci de préciser sa préférence en matière de transport.",
          // Le catalogue demande que le libellé précise « en toute autonomie »
          // ou « avec l’aide d’un proche », sans donner la phrase.
          labelFrom: ({ answers }) =>
            answers.question("Q1.1").is("2_AVEC_UN_PROCHE")
              ? "Le patient pouvant réaliser le trajet avec l’aide d’un proche, sans intervention d’un professionnel, merci de préciser sa préférence en matière de transport."
              : "Le patient pouvant réaliser le trajet en toute autonomie, sans intervention d’un professionnel, merci de préciser sa préférence en matière de transport.",
          askedIf: ({ answers }) => sansProfessionnel(answers.question("Q1.1")),
          dependsOn: ["Q1.1"],
        }),
      ],
    },
  ],
};
