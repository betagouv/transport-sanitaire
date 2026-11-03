// Q2.14 : les deux groupes de l'Engagement maternité, l'éloignement puis le
// motif, sur la page de branche. Le motif lit aussi l'éloignement, sur la même
// page.

import { given, question } from "../../question.ts";
import { brancheDecisive } from "../conditions/branche.ts";
import { Q2_1 } from "./q2-1.ts";
import { Q2_2_1 } from "./q2-2-1.ts";

// Le groupe de l'éloignement se pose : Q2.1 dit la maternité, ou Q2.2.1 la
// signale.
const unEloignementAPoser = given
  .question(Q2_1)
  .answer()
  .is("13_MATERNITE")
  .or(given.question(Q2_2_1).answer().checked("4_MATERNITE_ELOIGNEE"))
  .and(brancheDecisive);

export const Q2_14_ELOIGNEMENT = question
  .multipleChoice(
    "Q2.14.eloignement",
    "Quelle situation d’éloignement concerne la patiente ?",
  )
  // Le premier groupe de Q2.14, `CONTRAT_Q214_GROUPES.json`, groupe
  // `eloignement`.
  .options({
    "1_PLUS_DE_QUARANTE_CINQ_MINUTES":
      "Sa résidence se situe à plus de 45 minutes de trajet motorisé, dans les conditions habituelles, de la maternité la plus proche adaptée à son état de santé.",
    "2_COMMUNE_DESIGNEE_PAR_L_ARS":
      "Sa commune bénéficie d’une éligibilité définie par l’Agence Régionale de Santé (ARS) en raison de circonstances pouvant entraîner un éloignement supérieur à 45 minutes à la date prévue d’accouchement, notamment les conditions climatiques ou de circulation.",
    "3_AUCUNE": "Aucune de ces conditions.",
  })
  .mattersWhile(unEloignementAPoser)
  .exclusive("3_AUCUNE");

// Le groupe du motif se pose comme l'éloignement, sauf quand celui-ci a déjà
// écarté le dispositif : le motif ne changerait plus rien.
const unMotifAPoser = unEloignementAPoser.and(
  given.question(Q2_14_ELOIGNEMENT).answer().checked("3_AUCUNE").not(),
);

export const Q2_14_MOTIF = question
  .multipleChoice("Q2.14.motif", "Quel motif concerne le déplacement évalué ?")
  // Le second groupe de Q2.14, `CONTRAT_Q214_GROUPES.json`, groupe `finalite`.
  .options({
    "1_EXAMEN_DU_HUITIEME_OU_NEUVIEME_MOIS":
      "Un examen médical obligatoire réalisé au cours du 8ᵉ ou du 9ᵉ mois de grossesse, dans une unité de gynécologie-obstétrique.",
    "2_HEBERGEMENT_ENGAGEMENT":
      "Un séjour dans un hébergement temporaire non médicalisé organisé dans le cadre du dispositif Engagement maternité.",
    "3_AUCUNE": "Aucune de ces conditions.",
  })
  .mattersWhile(unMotifAPoser)
  .exclusive("3_AUCUNE");
