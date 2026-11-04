// Q2.8.2 : le début de la première permission. Il ne précède ni
// l'hospitalisation (Q2.8.1), ni son 14e jour.

import { given, question } from "../../question.ts";
import { unMineurDeVingtAns } from "../conditions/permission.ts";
import { Q2_8_1 } from "./q2-8-1.ts";

// La question, avant les règles qui lisent sa réponse.
const declaree = question.datetime(
  "Q2.8.2",
  "Quand commence la première permission ?",
);

/** La première permission commence au 14e jour d'hospitalisation, ou après. */
const PREMIER_JOUR_AUTORISE = 14;

const hospitalisation = given.question(Q2_8_1).answer().toDate();
const debut = given.question(declaree).answer().toDate();

// La première permission commence avant le jour de l'hospitalisation.
const commenceAvantLHospitalisation = debut.isBefore(hospitalisation);

// Elle commence avant le 14e jour d'hospitalisation. Le jour de
// l'hospitalisation est le jour 1 : le 14e jour, à minuit, est permis.
const commenceAvantLeQuatorziemeJour = debut.isBefore(
  hospitalisation.plusDays(PREMIER_JOUR_AUTORISE - 1),
);

export const Q2_8_2 = declaree
  .appliesWhen(unMineurDeVingtAns)
  .inconsistentWhen(
    commenceAvantLHospitalisation,
    "La permission ne peut pas commencer avant le début de l’hospitalisation.",
  )
  .inconsistentWhen(
    commenceAvantLeQuatorziemeJour,
    "La première permission doit commencer au 14e jour d’hospitalisation ou après.",
  );
