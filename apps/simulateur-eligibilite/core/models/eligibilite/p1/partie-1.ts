// P1 : l'autonomie et l'état de santé du patient, ce qui fait le mode de
// transport. Les options et leurs libellés viennent des déclarations.

import { Fait, page, type QuestionnairePart } from "../../../socle/index.ts";
import { AideDuPatient } from "../concepts/aide-du-patient.ts";
import { CriteresDuTransport } from "../concepts/criteres-du-transport.ts";
import type { Cibles } from "../declarations/cibles.ts";
import type { Faits } from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";
import { cible } from "../evaluation-des-regles.ts";
import { question } from "../question.ts";

type Partie<Cibles> = QuestionnairePart<Questions, Cibles>;

/**
 * Une cible du mode pour ces faits, pendant P1. Les règles ne donnent le mode
 * qu'une fois P1 complète : elle est tenue pour telle, le temps de la poser.
 */
export function cibleEnCoursDeP1<Nom extends keyof Cibles>(
  faits: Faits,
  nom: Nom,
): Cibles[Nom] {
  return cible({ ...faits, fait_p1_complete: Fait.oui("P1 en cours.") }, nom);
}

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
      option.offeredIf(({ validated }) =>
        CriteresDuTransport.of(validated).imposentLAmbulance(),
      ),
    )
    // Le partage ne concerne que le transport assis professionnel et le TPMR.
    // Ce sont les règles qui le disent.
    .option("6_PARTAGE_INCOMPATIBLE", (option) =>
      option.offeredIf(({ faits }) =>
        cibleEnCoursDeP1(faits, "cible_mode_tap_ou_tpmr").isOui(),
      ),
    ),
  question
    .singleChoice(
      "Q1.3.a",
      "La séance prévue est-elle une séance d’hémodialyse ?",
    )
    .askedIf(({ answers }) => answers.question("Q1.3").checked("5_DIALYSE")),
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
        .askedIf(({ answers }) =>
          AideDuPatient.of(answers).avecUnProfessionnel(),
        )
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
        .askedIf(({ answers }) => AideDuPatient.of(answers).sansProfessionnel())
        .dependsOn("Q1.1"),
    ),
  ],
};
