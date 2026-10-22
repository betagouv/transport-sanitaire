// P2 : l'éligibilité. La prestation (Q2.1), les situations particulières
// (Q2.2.1), le trajet (Q2.3), puis le transfert (Q2.5) et les exceptions de
// l'article 80 (Q2.6), dans `pages-du-transfert.ts`, la permission (Q2.7 et
// Q2.8), dans `pages-de-la-permission.ts`, et la convocation (Q2.10), dans
// `pages-de-la-convocation.ts`, puis la branche (Q2.12 à Q2.14), dans
// `pages-de-la-branche.ts`. Q2.4, Q2.9 et Q2.11 n'ont aucun écran.

import type { QuestionnairePart } from "../../../socle/index.ts";
import { OPTIONS, type Questions } from "../declarations/questions.ts";
import { type Context, question } from "../question.ts";
import { contextesAProposer, sejourAProposer } from "./contextes.ts";
import { PAGE_DE_LA_BRANCHE } from "./pages-de-la-branche.ts";
import { PAGE_DE_LA_CONVOCATION } from "./pages-de-la-convocation.ts";
import {
  PAGE_DE_LA_PERMISSION,
  PAGE_DE_LA_PERMISSION_DU_MINEUR,
} from "./pages-de-la-permission.ts";
import {
  PAGE_DES_EXCEPTIONS,
  PAGE_DU_TRANSFERT,
} from "./pages-du-transfert.ts";
import { motifDeP1, plusieursSeances } from "./prestation.ts";
import { dansLeCircuit, indicationAPoser } from "./retour-penitentiaire.ts";
import { urgenceAAfficher } from "./trajet.ts";

type Page = QuestionnairePart<Questions, undefined>["pages"][number];
type Contexte = Questions["Q2.2.1.b"][number];

// Q2.1 et ses sous-questions f, g et h, sur une seule page. Q2.1 se saute quand
// P1 prouve déjà un motif de transport ; Q2.1.f se pose quand même, si
// plusieurs séances sont cochées. La page s'affiche dès que l'une se pose
// (D-102).
const PAGE_DE_LA_PRESTATION: Page = {
  id: "P2/prestation",
  questions: [
    question.singleChoice("Q2.1", {
      label:
        "Quelle situation médicale ou quel événement motive ce déplacement ?",
      askedIf: ({ validated }) => !motifDeP1(validated),
      options: {
        // Une séance se coche en Q1.3 : elle ne se vote pas deux fois.
        "6_SEANCE": {
          offeredIf: ({ validated }) =>
            !validated
              .question("Q1.3")
              .value?.some((cas) =>
                ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE", "5_DIALYSE"].includes(
                  cas,
                ),
              ),
        },
      },
    }),
    question.singleChoice("Q2.1.f", {
      label:
        "Les séances sélectionnées motivent-elles le même déplacement vers le même lieu de soins ?",
      askedIf: ({ validated }) => plusieursSeances(validated),
      options: {
        "2_NON": {
          blocks:
            "Une simulation porte sur un seul déplacement. Corrigez les séances en Q1.3, puis faites une simulation par déplacement.",
        },
      },
    }),
    question.singleChoice("Q2.1.g", {
      label:
        "S’agit-il d’une entrée dans un établissement de santé, d’une sortie de cet établissement ou d’une admission en HAD (Hospitalisation à Domicile) à domicile ?",
      askedIf: ({ answers }) =>
        answers.question("Q2.1").is("8_HOSPITALISATION"),
      dependsOn: ["Q2.1"],
    }),
    question.singleChoice("Q2.1.h", {
      label:
        "La séance est-elle organisée par le CAMSP (Centre d’Action Médico-Sociale Précoce) ou le CMPP (Centre Médico-Psycho-Pédagogique), dans le parcours de l’enfant ?",
      askedIf: ({ answers }) => answers.question("Q2.1").is("10_CAMSP"),
      dependsOn: ["Q2.1"],
    }),
  ],
};

// Q2.2.1 et ses précisions sur une seule page : la permission (a), l'autre
// cadre (b), l'indication médicale d'un retour pénitentiaire et l'étranger
// (Q2.2.5), chacune sous le groupe qui l'ouvre. Elle se pose sur tous les
// parcours, même quand Q2.1 est sautée (D-98). Ce que Q2.1 indique déjà est
// retiré, sans rappel (TS1012-01).
const PAGE_DES_CONTEXTES: Page = {
  id: "P2/contextes",
  questions: [
    question.multipleChoice("Q2.2.1", {
      label:
        "L’une de ces situations correspond-elle aussi au trajet à réaliser ?",
      exclusiveOption: "4_AUCUNE",
      options: {
        "1_HOSPITALISATION": {
          offeredIf: ({ validated }) => sejourAProposer(validated),
        },
        "3_AUTRE_CADRE": {
          description:
            "Accident du travail ou maladie professionnelle, convocation ou appareillage, pension militaire, soins ou hébergement dans un dispositif particulier, retour vers un établissement pénitentiaire.",
          helpFrom: ({ validated }) => ({
            label: "Voir les situations concernées",
            items: contextesAProposer(validated).map(
              (contexte) => OPTIONS["Q2.2.1.b"][contexte],
            ),
          }),
        },
      },
    }),
    question.singleChoice("Q2.2.1.a", {
      label:
        "Ce trajet correspond-il à une permission temporaire de sortie de l’hôpital ?",
      askedIf: ({ answers }) =>
        answers.question("Q2.2.1").checked("1_HOSPITALISATION"),
    }),
    question.multipleChoice("Q2.2.1.b", {
      label:
        "Laquelle ou lesquelles de ces situations concernent aussi ce trajet ?",
      askedIf: ({ answers }) =>
        answers.question("Q2.2.1").checked("3_AUTRE_CADRE"),
      // Chaque situation ne se propose que si Q2.1 ne l'indique pas déjà.
      options: Object.fromEntries(
        (Object.keys(OPTIONS["Q2.2.1.b"]) as Contexte[]).map((contexte) => [
          contexte,
          {
            offeredIf: ({ validated }: Context) =>
              contextesAProposer(validated).includes(contexte),
          },
        ]),
      ),
      incompatibleOptions: [
        {
          values: ["4_MATERNITE_ELOIGNEE", "5_HTNM"],
          explanation:
            "Un même hébergement relève de l’Engagement maternité ou d’un hébergement temporaire non médicalisé, pas des deux. Pour deux hébergements, faites une simulation par trajet.",
        },
        {
          values: ["6_CAMSP", "7_SAMSAH"],
          explanation:
            "Le CAMSP (Centre d’Action Médico-Sociale Précoce) ou le CMPP (Centre Médico-Psycho-Pédagogique) accueille un enfant, le SAMSAH (Service d’Accompagnement Médico-Social pour Adultes Handicapés) un adulte : un seul des deux pour un même trajet.",
        },
      ],
    }),
    question.singleChoice("Q2.2.1.indication", {
      label:
        "Ce retour nécessite-t-il un transport pour raison médicale, indépendamment des contraintes d’escorte pénitentiaire ?",
      askedIf: ({ answers, validated }) => indicationAPoser(answers, validated),
      // Une modification clinique invalide la qualification (point 33).
      dependsOn: ["Q1.1", "Q1.2", "Q1.3"],
    }),
    question.multipleChoice("Q2.2.5", {
      label: "Quel lieu lié à ce transport se trouve à l’étranger ?",
      askedIf: ({ answers }) =>
        answers.question("Q2.2.1").checked("2_ETRANGER"),
    }),
  ],
};

// Q2.3 : le trajet évalué, sur une seule page. L'avion ou le bateau est une
// case seule : décochée, elle répond « non ». La série se révèle sous la
// distance quand le trajet dépasse 50 km, et l'urgence quand la garde de
// l'éditeur le dit (`cible_question_urgence_a_afficher`).
const PAGE_DU_TRAJET: Page = {
  id: "P2/trajet",
  questions: [
    question.singleChoice("Q2.3.1", {
      label:
        "Quelle distance parcourra le patient pour le trajet dans le sens évalué ?",
    }),
    question.checkbox("Q2.3.2", {
      label:
        "Une partie du trajet se fera en avion ou en bateau de ligne régulière.",
      box: "Oui, une partie du trajet se fera en avion ou en bateau de ligne régulière.",
    }),
    question.singleChoice("Q2.3.3", {
      label:
        "Dans les deux mois à compter du premier transport, au moins quatre transports de plus de 50 km chacun sont-ils prescrits au titre du même traitement ?",
      hint: "Un aller-retour compte pour deux transports.",
      askedIf: ({ faits }) => faits.fait_distance_plus_50.value === true,
    }),
    question.singleChoice("Q2.3.4", {
      label:
        "Le médecin prescripteur atteste-t-il que ce transport est urgent ?",
      askedIf: ({ validated }) => urgenceAAfficher(validated),
    }),
  ],
};

/** P2 : l'éligibilité. */
export const P2: QuestionnairePart<Questions, undefined> = {
  id: "P2",
  title: "Éligibilité",
  pages: [
    PAGE_DE_LA_PRESTATION,
    PAGE_DES_CONTEXTES,
    // Un retour pénitentiaire hors du circuit de prescription s'arrête là.
    ...[
      PAGE_DU_TRAJET,
      PAGE_DU_TRANSFERT,
      PAGE_DES_EXCEPTIONS,
      PAGE_DE_LA_PERMISSION,
      PAGE_DE_LA_PERMISSION_DU_MINEUR,
      PAGE_DE_LA_CONVOCATION,
      PAGE_DE_LA_BRANCHE,
    ].map(dansLeCircuit),
  ],
};
