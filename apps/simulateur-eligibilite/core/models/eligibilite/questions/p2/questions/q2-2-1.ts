// Q2.2.1 : les situations particulières du trajet. Ses précisions la suivent
// sur la même page, chacune dans son fichier : le cadre du séjour, la
// permission (a), qu'une HAD n'ouvre pas, et l'indication médicale d'un retour
// pénitentiaire. Puis Q2.2.1.b, les soins et rendez-vous, seule sur la page
// suivante (D-252) : les précisions du premier bloc peuvent déjà ôter tout
// effet à ses situations.
//
// Chaque bloc a sa réponse négative, qui ne nie que les propositions qu'il
// affiche (`CONTRAT_Q221_PROGRESSIF.json`). Le second se pose après n'importe
// quelle réponse au premier, même négative, et le graphe le saute quand plus
// rien ne peut en dépendre. Q2.2.1 se pose sur tous les parcours, même quand
// Q2.1 est sautée (D-98).
//
// Chaque situation de ces blocs ne se propose qu'ici : Q2.1 n'en dit plus
// aucune (QST-COLLECTE-UNIQUE, D-272).

import { Q1_3 } from "../../p1/questions/q1-3.ts";
import { given, question } from "../../question.ts";
import { incoherenceDeLieux } from "../conditions/conflit-de-lieux.ts";
import { Q2_1_G } from "./q2-1.ts";

// « Déjà hospitalisé » ne se propose pas pour le trajet qui ouvre le séjour
// (D-98).
const unSejourAProposer = given.question(Q2_1_G).answer().is("1_ENTREE").not();

// Un hébergement hors maternité ne va pas avec une situation de la maternité
// sur le même trajet (`CONTRAT_Q221_PROGRESSIF.json`).
const PAS_LE_MEME_TRAJET =
  "Un même trajet relève de l’Engagement maternité ou d’un hébergement temporaire non médicalisé, pas des deux. Pour deux trajets, faites une simulation par trajet.";

// La question, avant l'incohérence qui lit sa réponse.
const situations = question
  .multipleChoice(
    "Q2.2.1",
    "L’une de ces situations concerne-t-elle le transport du patient ?",
  )
  // Le premier bloc de `CONTRAT_Q221_PROGRESSIF.json` (v10.1.6). Les
  // situations venues de l'ancien Q2.2.1.b gardent leur numéro parmi les
  // treize du catalogue ; le séjour et l'étranger, leur identifiant d'avant.
  // L'examen et l'hébergement de la maternité, deux cases depuis la v10.1.7,
  // prennent 14 et 15 (QST-MAT-SEPARATION). La réponse négative, sans numéro
  // au catalogue, porte 0.
  .options({
    "1_HOSPITALISATION":
      "Hospitalisation en cours, y compris en Hospitalisation à Domicile (HAD).",
    "2_ETRANGER":
      "Au moins un lieu à l’étranger : départ, arrivée ou lieu de soins.",
    "14_EXAMEN_MATERNITE":
      "Examen obligatoire du 8ᵉ ou du 9ᵉ mois de grossesse en maternité.",
    "15_HEBERGEMENT_MATERNITE":
      "Hébergement temporaire prévu en raison de l’éloignement de la maternité.",
    "5_HTNM":
      "Hébergement temporaire non médicalisé lié aux soins, hors éloignement d’une maternité.",
    "10_RETOUR_PENITENTIAIRE": "Retour vers un établissement pénitentiaire.",
    "0_AUCUNE": "Non, aucune de ces situations",
  })
  .exclusive("0_AUCUNE")
  .option("1_HOSPITALISATION", (option) =>
    option.offeredWhen(unSejourAProposer),
  )
  .incompatible("14_EXAMEN_MATERNITE", "5_HTNM", PAS_LE_MEME_TRAJET)
  .incompatible("15_HEBERGEMENT_MATERNITE", "5_HTNM", PAS_LE_MEME_TRAJET);

// Un hébergement ou un retour pénitentiaire contredit un autre lieu déjà dit.
export const Q2_2_1 = situations.inconsistentWhen(
  ...incoherenceDeLieux("situations", {
    soins: Q1_3,
    sousType: Q2_1_G,
    situations,
  }),
);

// Une autre réponse validée au premier bloc efface celle du second, qui se
// repose s'il reste utile ; les autres réponses restent
// (NAV-Q221-PROGRESSIF-001).
export const Q2_2_1_B = question
  .multipleChoice(
    "Q2.2.1.b",
    "L’un de ces soins ou rendez-vous est-il concerné ?",
  )
  // Le second bloc de `CONTRAT_Q221_PROGRESSIF.json` (v10.1.6). Les options
  // gardent leur numéro parmi les treize du catalogue (S1) ; la réponse
  // négative, sans numéro, porte 0. Le centre de référence (8) n'en est plus
  // depuis la v10.1.2 : il se recueille en P3.
  .options({
    "1_ATMP": "Accident du travail ou maladie professionnelle.",
    "6_CAMSP":
      "Soins Centre d’Action Médico-Sociale Précoce (CAMSP) ou Centre Médico-Psycho-Pédagogique (CMPP), y compris les séances en ville organisées dans le parcours de l’enfant.",
    "7_SAMSAH":
      "Soins en Service d’Accompagnement Médico-Social pour Adultes Handicapés (SAMSAH).",
    "9_PENSION_MILITAIRE": "Soins liés à une pension militaire d’invalidité.",
    "13_CONVOCATION":
      "Convocation de contrôle, expertise ou rendez-vous chez un fournisseur d’appareillage.",
    "0_AUCUN": "Non, aucun.",
  })
  .exclusive("0_AUCUN")
  .dependsOn(Q2_2_1)
  .incompatible(
    "6_CAMSP",
    "7_SAMSAH",
    "Le Centre d’Action Médico-Sociale Précoce (CAMSP) ou le Centre Médico-Psycho-Pédagogique (CMPP) accueille un enfant, le Service d’Accompagnement Médico-Social pour Adultes Handicapés (SAMSAH) un adulte : un seul des deux pour un même trajet.",
  );
