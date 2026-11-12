// Q2.14 : les deux groupes de l'Engagement maternité, l'éloignement puis le
// motif, sur la page de branche. Le motif lit aussi l'éloignement, sur la même
// page. Avant eux, sous Q2.2.1, le déplacement évalué quand la maternité et un
// HTNM sont cochés ensemble (Q2.14.trajet, TS1018-04).
//
// Q2.2.1 découvre l'examen et l'hébergement, deux cases indépendantes
// (QST-MAT-SEPARATION, D-272). L'examen coché est déjà la finalité du
// déplacement : le motif ne se repose pas. L'hébergement seul ne prouve pas
// son organisation dans le dispositif : le motif ne propose alors que celle-ci.

import { given, question } from "../../question.ts";
import { brancheDecisive } from "../conditions/branche.ts";
import { Q2_2_1 } from "./q2-2-1.ts";

const situations = given.question(Q2_2_1).answer();
const unExamen = situations.checked("14_EXAMEN_MATERNITE");
const uneMaternite = unExamen.or(
  situations.checked("15_HEBERGEMENT_MATERNITE"),
);

// La maternité et un HTNM hors du dispositif, cochés ensemble, ne disent pas
// lequel des deux déplacements s'évalue : la question le demande, et deux
// déplacements font deux simulations (`CONTRAT_Q221_PROGRESSIF.json`,
// `qualification_maternite_htnm`).
export const Q2_14_TRAJET = question
  .singleChoice(
    "Q2.14.trajet",
    "Quel déplacement évaluez-vous dans cette simulation ?",
  )
  // Les options de `CONTRAT_REPONSES_CONDITIONNELLES.json`.
  .options({
    "1_ENGAGEMENT_MATERNITE": "Le déplacement lié à Engagement maternité",
    "2_HTNM_HORS_MATERNITE":
      "Le déplacement lié à un HTNM hors Engagement maternité",
    "3_DEUX_TRAJETS": "Il s’agit de deux déplacements différents",
  })
  .mattersWhile(uneMaternite.and(situations.checked("5_HTNM")))
  .option("3_DEUX_TRAJETS", (option) =>
    option.blocks("Ces deux trajets nécessitent deux simulations distinctes."),
  );

// Le groupe de l'éloignement se pose : Q2.2.1 signale l'examen ou
// l'hébergement de la maternité, et le déplacement évalué n'est pas celui du
// HTNM.
const unEloignementAPoser = uneMaternite
  .and(given.question(Q2_14_TRAJET).answer().is("2_HTNM_HORS_MATERNITE").not())
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

// Le groupe du motif se pose pour l'hébergement seul, sauf quand
// l'éloignement a déjà écarté le dispositif : le motif ne changerait plus rien.
const unMotifAPoser = unEloignementAPoser
  .and(unExamen.not())
  .and(given.question(Q2_14_ELOIGNEMENT).answer().checked("3_AUCUNE").not());

export const Q2_14_MOTIF = question
  .multipleChoice("Q2.14.motif", "Quel motif concerne le déplacement évalué ?")
  // Le second groupe de Q2.14, `CONTRAT_Q214_GROUPES.json`, groupe `finalite`,
  // tel qu'il se pose pour l'hébergement seul
  // (`whenAccommodationDiscoveredAndExamNotEstablished`). Son option
  // `examen_8_9` ne s'y propose pas : l'examen se coche en Q2.2.1.
  .options({
    "2_HEBERGEMENT_ENGAGEMENT":
      "Un séjour dans un hébergement temporaire non médicalisé organisé dans le cadre du dispositif Engagement maternité.",
    "3_AUCUNE": "Aucune de ces conditions.",
  })
  .mattersWhile(unMotifAPoser)
  .exclusive("3_AUCUNE");
