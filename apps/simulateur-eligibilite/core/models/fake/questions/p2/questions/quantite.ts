// La quantité : un rappel en valeurs, un nombre entier borné avec son unité.

import type { AnswerOf } from "../../../../../socle/index.ts";
import { SERVICE } from "../../p1/questions/service.ts";
import { question } from "../../question.ts";

// Les façons de servir, telles qu'on les relit une fois la commande figée.
const SERVICES: Record<AnswerOf<typeof SERVICE>[number], string> = {
  chaude: "très chaude",
  glacee: "glacée",
  "grande-tasse": "dans une grande tasse",
  preparation: "avec une préparation particulière",
  rien: "rien de particulier",
};

export const QUANTITE = question
  .number("quantite", "Combien de tasses ?")
  .reminderFrom(({ answers, cibles: { commande } }) => [
    { label: "Commande", value: String(commande.value) },
    {
      label: "Service",
      value: answers
        .question(SERVICE)
        .checkedBoxes()
        .map((value) => SERVICES[value])
        .join(", "),
    },
  ])
  .hint(
    "Démontre : un rappel en valeurs au-dessus du champ (la commande et le service, figés au verrou : ils se lisent, ils ne se modifient plus), un nombre entier, borné, avec son unité. Une décimale est refusée.",
  )
  .min(1)
  .integer()
  .unit("tasses");
