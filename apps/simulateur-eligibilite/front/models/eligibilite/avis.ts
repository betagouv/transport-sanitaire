// L'invitation à donner son avis (COR-13 de la v10.1.3) : le questionnaire
// Grist de l'équipe, à l'adresse exacte, et son libellé, tous deux de
// `CONTRAT_SATISFACTION.json`. Le socle la place selon le besoin dit en Q0.1 :
// vérifier une éligibilité, ou aller jusqu'à la prescription. Q0.1 n'a pas
// d'effet sur l'éligibilité, et sans réponse, l'avis n'est pas proposé.

import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import type { Feedback } from "../../socle";

export const AVIS: Feedback<Questions> = {
  url: "https://grist.numerique.gouv.fr/o/transports-sanitaires/forms/5Pftvy64N7M7i1ZeP9zs3f/6",
  label: "Aidez notre équipe en donnant votre avis",
  intent: (answers) => {
    const besoin = answers.question("Q0.1");
    if (besoin.is("1_VERIFIER")) return "check";
    if (besoin.is("2_VERIFIER_ET_PRESCRIRE")) return "prescribe";
    return null;
  },
};
