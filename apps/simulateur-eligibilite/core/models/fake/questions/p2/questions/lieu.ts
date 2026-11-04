// Le lieu : un choix unique en liste déroulante.

import { question } from "../../question.ts";

export const LIEU = question
  .singleChoice("lieu", "Où la servir ?")
  .options({
    salle: "En salle",
    terrasse: "En terrasse",
    comptoir: "Au comptoir",
  })
  .dropdown()
  .hint(
    "Démontre : un choix unique en liste déroulante. La page garde son bouton.",
  );
