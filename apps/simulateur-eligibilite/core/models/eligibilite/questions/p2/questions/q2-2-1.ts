// Q2.2.1 : les situations particulières du trajet, et ses précisions sur la
// même page : le cadre du séjour, la permission (a), qu'une HAD n'ouvre pas,
// et l'indication médicale d'un retour pénitentiaire, chacune sous la
// situation qui l'ouvre. Puis Q2.2.1.b, les soins et rendez-vous, seule sur la
// page suivante (D-252) : les précisions du premier bloc peuvent déjà rendre
// ses situations sans effet.
//
// Chaque bloc a sa réponse négative, qui ne nie que les propositions qu'il
// affiche (`CONTRAT_Q221_PROGRESSIF.json`). Le second se pose après n'importe
// quelle réponse au premier, même négative, et le graphe le saute quand plus
// rien ne peut en dépendre. Ce que Q2.1 indique déjà est retiré, sans rappel
// (D-98, TS1012-01). Q2.2.1 se pose sur tous les parcours, même quand Q2.1
// est sautée (D-98).

import { given, question } from "../../question.ts";
import { uneIndicationAPoser } from "../conditions/retour-penitentiaire.ts";
import {
  unCadreAPoser,
  unSejourEnEtablissement,
} from "../conditions/sejour.ts";

const motif = given.question("Q2.1").answer();

// « Déjà hospitalisé » ne se propose ni après une permission indiquée en Q2.1,
// ni pour le trajet qui ouvre le séjour (D-98).
const unSejourAProposer = motif
  .is("11_PERMISSION")
  .not()
  .and(given.question("Q2.1.g").answer().is("1_ENTREE").not());

// Q2.1 = 13 dit déjà l'Engagement maternité : ni la maternité éloignée, ni
// l'hébergement hors maternité ne se proposent alors.
const pasLaMaternite = motif.is("13_MATERNITE").not();

export const Q2_2_1 = question
  .multipleChoice(
    "Q2.2.1",
    "L’une de ces situations concerne-t-elle le transport du patient ?",
  )
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

export const Q2_2_1_CADRE = question
  .singleChoice(
    "Q2.2.1.cadre",
    "Dans quel cadre le patient est-il actuellement hospitalisé ?",
  )
  .appliesWhen(unCadreAPoser);

export const Q2_2_1_A = question
  .singleChoice(
    "Q2.2.1.a",
    "Ce trajet correspond-il à une permission temporaire de sortie de l’hôpital ?",
  )
  .appliesWhen(unSejourEnEtablissement);

export const Q2_2_1_INDICATION = question
  .singleChoice(
    "Q2.2.1.indication",
    "Ce retour nécessite-t-il un transport pour raison médicale, indépendamment des contraintes d’escorte pénitentiaire ?",
  )
  .appliesWhen(uneIndicationAPoser)
  // Une modification clinique invalide la qualification (point 33).
  .dependsOn("Q1.1", "Q1.2", "Q1.3");

// Q2.1 retire le CAMSP et la convocation qu'elle indique déjà.
export const Q2_2_1_B = question
  .multipleChoice(
    "Q2.2.1.b",
    "L’un de ces soins ou rendez-vous est-il concerné ?",
  )
  .exclusive("0_AUCUN")
  .option("6_CAMSP", (option) => option.offeredWhen(motif.is("10_CAMSP").not()))
  .option("13_CONVOCATION", (option) =>
    option.offeredWhen(motif.is("12_CONVOCATION").not()),
  )
  .incompatible(
    "6_CAMSP",
    "7_SAMSAH",
    "Le Centre d’Action Médico-Sociale Précoce (CAMSP) ou le Centre Médico-Psycho-Pédagogique (CMPP) accueille un enfant, le Service d’Accompagnement Médico-Social pour Adultes Handicapés (SAMSAH) un adulte : un seul des deux pour un même trajet.",
  );
