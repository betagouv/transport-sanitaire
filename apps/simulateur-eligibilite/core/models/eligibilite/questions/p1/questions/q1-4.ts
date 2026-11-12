// Q1.4 : la préférence du patient qui voyage sans professionnel (Q1.1).

import { given, question } from "../../question.ts";
import { Q1_1 } from "./q1-1.ts";

const sansProfessionnel = given
  .question(Q1_1)
  .answer()
  .isOneOf("1_SEUL", "2_AVEC_UN_PROCHE");

const REMBOURSEMENT =
  "Remboursement en moins d’une semaine via le compte ameli, si le service est disponible.";

export const Q1_4 = question
  .singleChoice(
    "Q1.4",
    "Le patient pouvant réaliser le trajet sans intervention d’un professionnel, merci de préciser sa préférence en matière de transport.",
  )
  .options({
    "1_VEHICULE_PERSONNEL": "Véhicule personnel.",
    "2_TRANSPORTS_EN_COMMUN": "Transports en commun terrestres.",
  })
  // Le catalogue demande que le libellé précise « en toute autonomie »
  // ou « avec l’aide d’un proche », sans donner la phrase.
  .labelFrom(({ answers }) =>
    answers.question(Q1_1).is("2_AVEC_UN_PROCHE")
      ? "Le patient pouvant réaliser le trajet avec l’aide d’un proche, sans intervention d’un professionnel, merci de préciser sa préférence en matière de transport."
      : "Le patient pouvant réaliser le trajet en toute autonomie, sans intervention d’un professionnel, merci de préciser sa préférence en matière de transport.",
  )
  // Sous chaque choix, son sous-titre, une phrase par ligne (module 02,
  // « Sous-titres des choix de transport », TS1018-10). Il n'informe que.
  .option("1_VEHICULE_PERSONNEL", (option) =>
    option.description(
      [
        "Véhicule du patient ou celui d’un proche.",
        "Prise en charge sur la base de 0,30 €/km, plus les frais de parking et de péage sur justificatifs.",
        REMBOURSEMENT,
      ].join("\n"),
    ),
  )
  .option("2_TRANSPORTS_EN_COMMUN", (option) =>
    option.description(
      [
        "Prise en charge sur la base du prix du ticket de transport en commun ou du billet de train en 2e classe.",
        REMBOURSEMENT,
      ].join("\n"),
    ),
  )
  .appliesWhen(sansProfessionnel)
  .dependsOn(Q1_1);
