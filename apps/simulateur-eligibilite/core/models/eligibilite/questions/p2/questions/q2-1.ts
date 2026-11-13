// Q2.1 : la prestation, ce qui motive le déplacement, et ses sous-questions f
// et g, sur une seule page. Q2.1 se saute quand P1 prouve déjà un motif de
// transport ; Q2.1.f se pose quand même, si plusieurs séances sont cochées.
// La page s'affiche dès que l'une se pose (D-102). Les faits que la page
// établit vivent sous `faits/`.
//
// Q2.1 ne propose que les neuf motifs généraux (QST-COLLECTE-UNIQUE, D-272).
// Les situations qu'elle proposait aussi ne se découvrent plus qu'à un
// endroit : les séances en Q1.3, le CAMSP et la convocation en Q2.2.1.b, la
// permission en Q2.2.1.a, l'examen et l'hébergement de la maternité en Q2.2.1.
// Ne pas les choisir ici ne nie aucune d'elles.

import { Q1_3 } from "../../p1/questions/q1-3.ts";
import { given, question } from "../../question.ts";
import { incoherenceDeLieux } from "../conditions/conflit-de-lieux.ts";

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
const cas = given.question(Q1_3).answer();
const SEANCES = ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE", "5_DIALYSE"] as const;
const plusieursSeances = cas.compute(
  (cochees) => SEANCES.filter((seance) => cochees.checked(seance)).length >= 2,
);

export const Q2_1 = question
  .singleChoice(
    "Q2.1",
    "Quelle situation médicale ou quel événement motive ce déplacement ?",
  )
  .options({
    // Sans le suivi de l'ALD : ce choix ne prouve pas le lien (QST-Q21-CONSULTATION).
    "1_CONSULTATION":
      "Consultation médicale de diagnostic, de traitement ou de suivi.",
    "2_DENTISTE_OU_SAGE_FEMME":
      "Consultation ou soin réalisé par un chirurgien-dentiste ou une sage-femme.",
    "3_IMAGERIE": "Examen d’imagerie ou autre acte médical technique.",
    "4_BIOLOGIE": "Analyse ou examen de biologie médicale.",
    "5_PARAMEDICAL":
      "Rééducation, orthophonie, soins infirmiers ou autre soin paramédical.",
    "7_PSYCHOLOGUE": "Séance de psychologue ou dispositif particulier.",
    "8_HOSPITALISATION":
      "Entrée ou sortie d’hospitalisation, ou admission en Hospitalisation à Domicile (HAD).",
    "9_TRANSFERT":
      "Transfert entre établissements, ou déplacement pour soin pendant l’hospitalisation.",
    // Une seule réponse générique, à la place de 14 et 15
    // (QST-Q21-AUTRE-MOTIF) : elle ne nie aucune situation cumulable.
    "14_AUTRE": "Autre motif de déplacement.",
  })
  .mattersWhile(unMotifDeP1.not());

export const Q2_1_F = question
  .singleChoice(
    "Q2.1.f",
    "Les séances sélectionnées motivent-elles le même déplacement vers le même lieu de soins ?",
  )
  .options({
    "1_OUI": "Oui, il s’agit du même déplacement et du même lieu",
    "2_NON": "Non, il s’agit de déplacements ou de lieux différents",
  })
  .appliesWhen(plusieursSeances)
  // Elle porte sur les séances cochées : d'autres séances, et sa réponse ne
  // vaut plus (NAV-SOUS-QUESTIONS-20261113, SQ-25).
  .dependsOn(Q1_3)
  .option("2_NON", (option) =>
    option.blocks(
      "Une simulation porte sur un seul déplacement. Corrigez les séances en Q1.3, puis faites une simulation par déplacement.",
    ),
  );

const sousType = question
  .singleChoice(
    "Q2.1.g",
    "S’agit-il d’une entrée dans un établissement de santé, d’une sortie de cet établissement ou d’une admission en Hospitalisation à Domicile (HAD) à domicile ?",
  )
  .options({
    "1_ENTREE": "Une entrée dans un établissement de santé",
    "2_SORTIE": "Une sortie de cet établissement",
    "3_ADMISSION_HAD":
      "Une admission en Hospitalisation à Domicile (HAD) à domicile",
  })
  .appliesWhen(given.question(Q2_1).answer().is("8_HOSPITALISATION"))
  .dependsOn(Q2_1);

export const Q2_1_G = sousType.inconsistentWhen(
  ...incoherenceDeLieux("sousType", {
    soins: Q1_3,
    sousType,
  }),
);
