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
// rien ne peut en dépendre. Ce que Q2.1 indique déjà est retiré, sans rappel
// (D-98, TS1012-01). Q2.2.1 se pose sur tous les parcours, même quand Q2.1
// est sautée (D-98).

import { given, question } from "../../question.ts";
import { Q2_1, Q2_1_G } from "./q2-1.ts";

const motif = given.question(Q2_1).answer();

// « Déjà hospitalisé » ne se propose ni après une permission indiquée en Q2.1,
// ni pour le trajet qui ouvre le séjour (D-98).
const unSejourAProposer = motif
  .is("11_PERMISSION")
  .not()
  .and(given.question(Q2_1_G).answer().is("1_ENTREE").not());

// Q2.1 = 13 dit déjà l'Engagement maternité : ni la maternité éloignée, ni
// l'hébergement hors maternité ne se proposent alors.
const pasLaMaternite = motif.is("13_MATERNITE").not();

export const Q2_2_1 = question
  .multipleChoice(
    "Q2.2.1",
    "L’une de ces situations concerne-t-elle le transport du patient ?",
  )
  // Le premier bloc de `CONTRAT_Q221_PROGRESSIF.json` (v10.1.6). Les
  // situations venues de l'ancien Q2.2.1.b gardent leur numéro parmi les
  // treize du catalogue ; le séjour et l'étranger, leur identifiant d'avant.
  // La réponse négative, sans numéro au catalogue, porte 0.
  .options({
    "1_HOSPITALISATION":
      "Hospitalisation en cours, y compris en Hospitalisation à Domicile (HAD).",
    "2_ETRANGER":
      "Au moins un lieu à l’étranger : départ, arrivée ou lieu de soins.",
    "4_MATERNITE_ELOIGNEE":
      "Examen obligatoire du 8ᵉ ou 9ᵉ mois de grossesse en maternité, ou hébergement temporaire lié à l’éloignement de la maternité.",
    "5_HTNM":
      "Hébergement temporaire non médicalisé lié aux soins, hors éloignement d’une maternité.",
    "10_RETOUR_PENITENTIAIRE": "Retour vers un établissement pénitentiaire.",
    "0_AUCUNE": "Non, aucune de ces situations",
  })
  .exclusive("0_AUCUNE")
  .option("1_HOSPITALISATION", (option) =>
    option.offeredWhen(unSejourAProposer),
  )
  .option("4_MATERNITE_ELOIGNEE", (option) =>
    option.offeredWhen(pasLaMaternite),
  )
  .option("5_HTNM", (option) => option.offeredWhen(pasLaMaternite))
  .incompatible(
    "4_MATERNITE_ELOIGNEE",
    "5_HTNM",
    "Un même hébergement relève de l’Engagement maternité ou d’un hébergement temporaire non médicalisé, pas des deux. Pour deux hébergements, faites une simulation par trajet.",
  );

// Q2.1 retire le CAMSP et la convocation qu'elle indique déjà. Une autre
// réponse validée au premier bloc efface celle du second, qui se repose s'il
// reste utile ; les autres réponses restent (NAV-Q221-PROGRESSIF-001).
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
  .option("6_CAMSP", (option) => option.offeredWhen(motif.is("10_CAMSP").not()))
  .option("13_CONVOCATION", (option) =>
    option.offeredWhen(motif.is("12_CONVOCATION").not()),
  )
  .incompatible(
    "6_CAMSP",
    "7_SAMSAH",
    "Le Centre d’Action Médico-Sociale Précoce (CAMSP) ou le Centre Médico-Psycho-Pédagogique (CMPP) accueille un enfant, le Service d’Accompagnement Médico-Social pour Adultes Handicapés (SAMSAH) un adulte : un seul des deux pour un même trajet.",
  );
