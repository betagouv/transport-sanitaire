// P2 : l'éligibilité. La prestation (Q2.1), les situations particulières
// (Q2.2.1), le trajet (Q2.3), puis le transfert (Q2.5) et les exceptions de
// l'article 80 (Q2.6), dans `pages-du-transfert.ts`, la permission (Q2.7 et
// Q2.8), dans `pages-de-la-permission.ts`, et la convocation (Q2.10), dans
// `pages-de-la-convocation.ts`, puis la branche (Q2.12 à Q2.14), dans
// `pages-de-la-branche.ts`. Q2.4, Q2.9 et Q2.11 n'ont aucun écran.

import { page, type QuestionnairePart } from "../../../socle/index.ts";
import {
  OPTIONS,
  type Questions,
  RETIREE_SI_Q21,
} from "../declarations/questions.ts";
import { given, question } from "../question.ts";
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
import { unMotifDeP1 } from "./prestation.ts";
import { dansLeCircuit, uneIndicationAPoser } from "./retour-penitentiaire.ts";

type Contexte = Questions["Q2.2.1.b"][number];

// Les séances de Q1.3. Une dialyse ne compte parmi plusieurs que si Q1.3.a
// confirme l'hémodialyse (COR-17, D-131).
const cas = given.question("Q1.3").answer();
const chimiotherapie = cas.checked("3_CHIMIOTHERAPIE");
const radiotherapie = cas.checked("4_RADIOTHERAPIE");
const uneSeance = chimiotherapie.or(radiotherapie).or(cas.checked("5_DIALYSE"));
const hemodialyse = cas
  .checked("5_DIALYSE")
  .and(given.question("Q1.3.a").answer().is("1_OUI"));
const plusieursSeances = chimiotherapie
  .and(radiotherapie.or(hemodialyse))
  .or(radiotherapie.and(hemodialyse));

const motif = given.question("Q2.1").answer();
const groupe = given.question("Q2.2.1").answer();

// « Déjà hospitalisé » ne se propose ni après une permission indiquée en Q2.1,
// ni pour le trajet qui ouvre le séjour (D-98).
const unSejourAProposer = motif
  .is("11_PERMISSION")
  .not()
  .and(given.question("Q2.1.g").answer().is("1_ENTREE").not());

// Q2.1 et ses sous-questions f, g et h, sur une seule page. Q2.1 se saute quand
// P1 prouve déjà un motif de transport ; Q2.1.f se pose quand même, si
// plusieurs séances sont cochées. La page s'affiche dès que l'une se pose
// (D-102).
const PAGE_DE_LA_PRESTATION = page(
  "P2/prestation",
  question
    .singleChoice(
      "Q2.1",
      "Quelle situation médicale ou quel événement motive ce déplacement ?",
    )
    .mattersWhile(unMotifDeP1.not())
    // Une séance se coche en Q1.3 : elle ne se vote pas deux fois.
    .option("6_SEANCE", (option) => option.offeredWhen(uneSeance.not())),
  question
    .singleChoice(
      "Q2.1.f",
      "Les séances sélectionnées motivent-elles le même déplacement vers le même lieu de soins ?",
    )
    .appliesWhen(plusieursSeances)
    .option("2_NON", (option) =>
      option.blocks(
        "Une simulation porte sur un seul déplacement. Corrigez les séances en Q1.3, puis faites une simulation par déplacement.",
      ),
    ),
  question
    .singleChoice(
      "Q2.1.g",
      "S’agit-il d’une entrée dans un établissement de santé, d’une sortie de cet établissement ou d’une admission en Hospitalisation à Domicile (HAD) à domicile ?",
    )
    .appliesWhen(motif.is("8_HOSPITALISATION"))
    .dependsOn("Q2.1"),
  question
    .singleChoice(
      "Q2.1.h",
      "Cette séance en ville est-elle organisée dans le cadre du parcours de soins de l’enfant ?",
    )
    .appliesWhen(motif.is("10_CAMSP"))
    .dependsOn("Q2.1"),
);

// Q2.2.1.b : chaque situation ne se propose que si Q2.1 ne l'indique pas déjà
// (D-98).
const CONTEXTES = Object.keys(OPTIONS["Q2.2.1.b"]) as Contexte[];
const AUTRES_CADRES = CONTEXTES.reduce(
  (declaree, contexte) =>
    declaree.option(contexte, (option) =>
      option.offeredWhen(
        motif.isOneOf(...(RETIREE_SI_Q21[contexte] ?? [])).not(),
      ),
    ),
  question
    .multipleChoice(
      "Q2.2.1.b",
      "Laquelle ou lesquelles de ces situations concernent aussi ce trajet ?",
    )
    .appliesWhen(groupe.checked("3_AUTRE_CADRE"))
    .incompatible(
      "4_MATERNITE_ELOIGNEE",
      "5_HTNM",
      "Un même hébergement relève de l’Engagement maternité ou d’un hébergement temporaire non médicalisé, pas des deux. Pour deux hébergements, faites une simulation par trajet.",
    )
    .incompatible(
      "6_CAMSP",
      "7_SAMSAH",
      "Le Centre d’Action Médico-Sociale Précoce (CAMSP) ou le Centre Médico-Psycho-Pédagogique (CMPP) accueille un enfant, le Service d’Accompagnement Médico-Social pour Adultes Handicapés (SAMSAH) un adulte : un seul des deux pour un même trajet.",
    ),
);

// Q2.2.1 et ses précisions sur une seule page : la permission (a), l'autre
// cadre (b), l'indication médicale d'un retour pénitentiaire et l'étranger
// (Q2.2.5), chacune sous le groupe qui l'ouvre. Elle se pose sur tous les
// parcours, même quand Q2.1 est sautée (D-98). Ce que Q2.1 indique déjà est
// retiré, sans rappel (TS1012-01).
const PAGE_DES_CONTEXTES = page(
  "P2/contextes",
  question
    .multipleChoice(
      "Q2.2.1",
      "L’une de ces situations correspond-elle aussi au trajet à réaliser ?",
    )
    .exclusive("4_AUCUNE")
    .option("1_HOSPITALISATION", (option) =>
      option.offeredWhen(unSejourAProposer),
    )
    .option("3_AUTRE_CADRE", (option) =>
      option
        .description(
          "Accident du travail ou maladie professionnelle, convocation ou appareillage, pension militaire, soins ou hébergement dans un dispositif particulier, retour vers un établissement pénitentiaire.",
        )
        .helpFrom(({ validated }) => ({
          label: "Voir les situations concernées",
          items: CONTEXTES.filter(
            (contexte) =>
              !RETIREE_SI_Q21[contexte]?.some(
                (retire) => validated.question("Q2.1").value === retire,
              ),
          ).map((contexte) => OPTIONS["Q2.2.1.b"][contexte]),
        })),
    ),
  question
    .singleChoice(
      "Q2.2.1.a",
      "Ce trajet correspond-il à une permission temporaire de sortie de l’hôpital ?",
    )
    .appliesWhen(groupe.checked("1_HOSPITALISATION")),
  AUTRES_CADRES,
  question
    .singleChoice(
      "Q2.2.1.indication",
      "Ce retour nécessite-t-il un transport pour raison médicale, indépendamment des contraintes d’escorte pénitentiaire ?",
    )
    .appliesWhen(uneIndicationAPoser)
    // Une modification clinique invalide la qualification (point 33).
    .dependsOn("Q1.1", "Q1.2", "Q1.3"),
  question
    .multipleChoice(
      "Q2.2.5",
      "Sélectionnez la ou les adresses situées à l’étranger",
    )
    .appliesWhen(groupe.checked("2_ETRANGER")),
);

// Q2.3 : le trajet évalué, sur une seule page. L'avion ou le bateau est une
// case seule : décochée, elle répond « non ». La série se révèle sous la
// distance quand le trajet dépasse 50 km, et l'urgence quand la garde de
// l'éditeur le dit (`cible_question_urgence_a_afficher`).
const PAGE_DU_TRAJET = page(
  "P2/trajet",
  question.singleChoice(
    "Q2.3.1",
    "Quelle distance sépare les lieux de départ et d’arrivée ?",
  ),
  question.checkbox(
    "Q2.3.2",
    "Une partie du trajet se fera en avion ou en bateau de ligne régulière.",
    "Oui, une partie du trajet se fera en avion ou en bateau de ligne régulière.",
  ),
  question
    .singleChoice(
      "Q2.3.3",
      "Pour le même traitement, prévoyez-vous de prescrire au moins 4 transports de plus de 50 km chacun sur une période de 2 mois ?",
    )
    .hint("Un aller-retour compte pour deux transports.")
    .mattersWhile(given.fait("fait_distance_plus_50").isOui()),
  question
    .singleChoice("Q2.3.4", "Attestez-vous que ce transport est urgent ?")
    // La garde de l'éditeur, sur les faits des questions posées avant elle.
    .mattersWhile(given.cible("cible_question_urgence_a_afficher").isOui()),
);

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
    ].map((suivante) => suivante.appliesWhen(dansLeCircuit)),
  ],
};
