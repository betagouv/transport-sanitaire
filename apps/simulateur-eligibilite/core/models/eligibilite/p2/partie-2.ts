// P2 : l'éligibilité. La prestation (Q2.1), les situations particulières
// (Q2.2.1 et Q2.2.1.b), dans `pages-des-contextes.ts`, le trajet (Q2.3), puis
// le transfert (Q2.5) et les exceptions de l'article 80 (Q2.6), dans
// `pages-du-transfert.ts`, la permission (Q2.7 et Q2.8), dans
// `pages-de-la-permission.ts`, et la convocation (Q2.10), dans
// `pages-de-la-convocation.ts`, puis la branche (Q2.12 à Q2.14), dans
// `pages-de-la-branche.ts`. Q2.4, Q2.9 et Q2.11 n'ont aucun écran.

import { page, type QuestionnairePart } from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";
import { given, question } from "../question.ts";
import { PAGE_DE_LA_BRANCHE } from "./pages-de-la-branche.ts";
import { PAGE_DE_LA_CONVOCATION } from "./pages-de-la-convocation.ts";
import {
  PAGE_DE_LA_PERMISSION,
  PAGE_DE_LA_PERMISSION_DU_MINEUR,
} from "./pages-de-la-permission.ts";
import { PAGE_DES_CONTEXTES, PAGE_DES_SOINS } from "./pages-des-contextes.ts";
import {
  PAGE_DES_EXCEPTIONS,
  PAGE_DU_TRANSFERT,
} from "./pages-du-transfert.ts";
import { unMotifDeP1 } from "./prestation.ts";
import { dansLeCircuit } from "./retour-penitentiaire.ts";

// Les séances déclarées en Q1.3. Q2.1.f se pose dès que deux sont cochées,
// dialyse comprise, sans attendre l'hémodialyse confirmée (TS1014-L04, D-245).
const cas = given.question("Q1.3").answer();
const SEANCES = ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE", "5_DIALYSE"] as const;
const uneSeance = SEANCES.map((seance) => cas.checked(seance)).reduce(
  (une, autre) => une.or(autre),
);
const plusieursSeances = cas.compute(
  (cochees) => SEANCES.filter((seance) => cochees.checked(seance)).length >= 2,
);

const motif = given.question("Q2.1").answer();

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

// Q2.3 : le trajet évalué, sur une seule page. L'avion ou le bateau est une
// case seule sans titre, dans le bloc de la distance : décochée, elle répond
// « non » (D-239). La série se révèle sous la
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
      PAGE_DES_SOINS,
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
