// Q2.8.1 : la date d'hospitalisation d'un patient de moins de 20 ans, première
// des caractéristiques de sa permission, tout le lot sur une page (D-107).
// Chaque contrôle de dates se déclare sur la plus tardive des deux questions
// qu'il compare.

import { question } from "../../question.ts";
import { unMineurDeVingtAns } from "../conditions/permission.ts";

export const Q2_8_1 = question
  .date("Q2.8.1", "Depuis quelle date le patient est-il hospitalisé ?")
  .appliesWhen(unMineurDeVingtAns);
