// Q2.1 : la prestation, ce qui motive le déplacement, et ses sous-questions f
// et g, sur une seule page. Q2.1 se saute quand P1 prouve déjà un motif de
// transport ; Q2.1.f se pose quand même, si plusieurs séances sont cochées.
// La page s'affiche dès que l'une se pose (D-102). Les faits que la page
// établit vivent sous `faits/`.

import { given, question } from "../../question.ts";

/**
 * P1 prouve déjà un motif de transport : l'ambulance, une séance qualifiante,
 * une ALD à 100 % liée au soin, ou le mineur reconnu en soins continus. Q2.1
 * n'est alors pas posée (D-102), et son saut ne donne aucun « non ».
 */
const unMotifDeP1 = given
  .fait("fait_situation_soins_qualifiante")
  .isOui()
  .or(given.cible("cible_mode_ambulance").isOui())
  .or(given.cible("cible_ald_qualifiante").isOui())
  .or(given.cible("cible_mineur_soins_prolonges").isOui());

// Les séances déclarées en Q1.3. Q2.1.f se pose dès que deux sont cochées,
// dialyse comprise, sans attendre l'hémodialyse confirmée (TS1014-L04, D-245).
const cas = given.question("Q1.3").answer();
const SEANCES = ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE", "5_DIALYSE"] as const;
const uneSeance = SEANCES.map((seance) => cas.checked(seance)).reduce(
  (une, autre) => une.or(autre),
);
const plusieursSeances = cas.compute(
  (cochees) => SEANCES.filter((seance) => cochees.checked(seance)).length >= 2,
);

export const Q2_1 = question
  .singleChoice(
    "Q2.1",
    "Quelle situation médicale ou quel événement motive ce déplacement ?",
  )
  .mattersWhile(unMotifDeP1.not())
  // Une séance se coche en Q1.3 : elle ne se vote pas deux fois.
  .option("6_SEANCE", (option) => option.offeredWhen(uneSeance.not()));

export const Q2_1_F = question
  .singleChoice(
    "Q2.1.f",
    "Les séances sélectionnées motivent-elles le même déplacement vers le même lieu de soins ?",
  )
  .appliesWhen(plusieursSeances)
  .option("2_NON", (option) =>
    option.blocks(
      "Une simulation porte sur un seul déplacement. Corrigez les séances en Q1.3, puis faites une simulation par déplacement.",
    ),
  );

export const Q2_1_G = question
  .singleChoice(
    "Q2.1.g",
    "S’agit-il d’une entrée dans un établissement de santé, d’une sortie de cet établissement ou d’une admission en Hospitalisation à Domicile (HAD) à domicile ?",
  )
  .appliesWhen(given.question("Q2.1").answer().is("8_HOSPITALISATION"))
  .dependsOn("Q2.1");
