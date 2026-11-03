// Le lieu : un choix unique en liste déroulante.

import { question } from "../../question.ts";

export const LIEU = question
  .singleChoice("lieu", "Où la servir ?")
  .dropdown()
  .hint(
    "Démontre : un choix unique en liste déroulante. La page garde son bouton.",
  );
