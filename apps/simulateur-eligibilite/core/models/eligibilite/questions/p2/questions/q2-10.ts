// Q2.10 : la convocation, après la permission, pour la catégorie, et sur la
// même page, pour l'appareillage, l'agrément du fournisseur (Q2.10.a) et
// l'appareillage concerné (Q2.10.b) (D-108). Son fait vit sous `faits/`.
//
// Q2.10 se pose quand Q2.1 dit une convocation, ou que Q2.2.1.b en signale une
// (option 13). Elle n'est jamais reproposée si Q2.1 l'a déjà dite : Q2.2.1.b la
// retire. Sans l'une ni l'autre, elle ne se pose pas : la convocation proposée
// et écartée en Q2.2.1.b vaut déjà « non ».

import { given, question } from "../../question.ts";
import { Q2_1 } from "./q2-1.ts";
import { Q2_2_1_B } from "./q2-2-1.ts";

const uneConvocationAnnoncee = given
  .question(Q2_1)
  .answer()
  .is("12_CONVOCATION")
  .or(given.question(Q2_2_1_B).answer().checked("13_CONVOCATION"));

export const Q2_10 = question
  .singleChoice(
    "Q2.10",
    "Quelle convocation, quel avis d’audience ou quel appareillage motive ce trajet ?",
  )
  .options({
    "1_CONTROLE_MEDICAL":
      "Convocation au contrôle médical de l’Assurance Maladie.",
    "2_EXPERT_JURIDICTION":
      "Convocation par un médecin-expert ou consultant désigné par une juridiction compétente.",
    "3_AUDIENCE_CONSULTATION":
      "Audience de cette juridiction comportant une consultation clinique.",
    "4_EXPERT_CONTESTATION":
      "Consultation d’un expert désigné pour une contestation médicale.",
    "5_COMMISSION_RECOURS":
      "Convocation d’une commission médicale de recours amiable ou du médecin désigné par elle.",
    "6_APPAREILLAGE": "Déplacement chez un fournisseur d’appareillage.",
    "7_AUCUNE": "Aucune de ces situations.",
  })
  .appliesWhen(uneConvocationAnnoncee);

// Q2.10 dit un appareillage : Q2.10.a et Q2.10.b se posent ensemble.
const unAppareillage = given.question(Q2_10).answer().is("6_APPAREILLAGE");

export const Q2_10_A = question
  .singleChoice(
    "Q2.10.a",
    "Le fournisseur est-il agréé pour cet appareillage ?",
  )
  // Pour l'option 6 de Q2.10. Chaque réponse finit par un point (TS1016-08).
  .options({
    "1_OUI": "Oui.",
    "2_NON": "Non.",
    "3_NE_PEUX_PAS_VERIFIER": "Je ne peux pas le vérifier.",
  })
  .appliesWhen(unAppareillage)
  .dependsOn(Q2_10);

export const Q2_10_B = question
  .singleChoice("Q2.10.b", "Sélectionnez l’appareillage concerné")
  // Pour l'option 6 de Q2.10.
  .options({
    "1_PROTHESE_OCULAIRE_FACIALE": "Prothèse oculaire ou faciale.",
    "2_PODO_ORTHESE": "Podo-orthèse.",
    "3_ORTHOPROTHESE": "Orthoprothèse.",
    "4_AUTRE": "Un autre appareillage.",
    "5_NE_PEUX_PAS_PRECISER": "Je ne peux pas le vérifier.",
  })
  .appliesWhen(unAppareillage)
  .dependsOn(Q2_10);
