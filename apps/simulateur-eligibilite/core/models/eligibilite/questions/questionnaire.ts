// Le questionnaire du modèle : ses parties, dans l'ordre du catalogue de
// l'éditeur.

import { page } from "../../../socle/index.ts";
import { P1 } from "./p1/partie-1.ts";
import { P2 } from "./p2/partie-2.ts";
import { question } from "./question.ts";

/** P0 : le besoin du prescripteur. */
const P0 = {
  id: "P0",
  title: "Mon besoin",
  pages: [
    page(
      "P0/1",
      question
        .singleChoice("Q0.1", "Quel est votre besoin ?")
        .options({
          "1_VERIFIER": "Vérifier une éligibilité",
          "2_VERIFIER_ET_PRESCRIRE":
            "Vérifier et prescrire si la situation le permet",
        })
        .boldLabels()
        .option("1_VERIFIER", (option) =>
          option.description("Environ 3 minutes"),
        )
        .option("2_VERIFIER_ET_PRESCRIRE", (option) =>
          option.description("Environ 10 minutes"),
        ),
    ),
  ],
};

/** P0 à P2 : modifiables tant que le résultat n'est pas verrouillé. */
export const PARTS = [P0, P1, P2];
