// Q2.8.6 : la période de plusieurs permissions (Q2.8.5), et ses sous-questions
// a (la fréquence) et b (le patient reste mineur de 20 ans).

import { given, question } from "../../question.ts";
import { plusieursPermissions } from "../conditions/permission.ts";

// La période des permissions finit un jour avant la fin de la première. Le
// jour même est permis : la période se donne en jours, la permission en
// heures.
const periodeFinitAvantLaPremiere = given
  .question("Q2.8.6")
  .answer()
  .toDate()
  .isBefore(given.question("Q2.8.3").answer().toDate().startOfDay());

export const Q2_8_6 = question
  .date("Q2.8.6", "Jusqu’à quelle date ces permissions sont-elles prévues ?")
  .appliesWhen(plusieursPermissions)
  .dependsOn("Q2.8.5")
  .inconsistentWhen(
    periodeFinitAvantLaPremiere,
    "La période ne peut pas se terminer avant la fin de la première permission.",
  );

export const Q2_8_6_A = question
  .number(
    "Q2.8.6.a",
    "Une permission aller-retour est prévue toutes les combien de semaines ?",
  )
  .hint("1 = chaque semaine ; 2 = toutes les deux semaines.")
  .integer()
  .min(1)
  .unit("semaine(s)")
  .appliesWhen(plusieursPermissions)
  .dependsOn("Q2.8.5");

export const Q2_8_6_B = question
  .singleChoice(
    "Q2.8.6.b",
    "Le patient restera-t-il âgé de moins de 20 ans durant toute la période ?",
  )
  .appliesWhen(plusieursPermissions)
  .dependsOn("Q2.8.5")
  .option("2_NON", (option) =>
    option.blocks(
      "La période doit se terminer avant le vingtième anniversaire du patient. Raccourcissez-la, puis faites une autre simulation pour la période suivante.",
    ),
  );
