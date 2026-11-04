// Q2.1 : la prestation, ce qui motive le déplacement, et ses sous-questions f
// et g, sur une seule page. Q2.1 se saute quand P1 prouve déjà un motif de
// transport ; Q2.1.f se pose quand même, si plusieurs séances sont cochées.
// La page s'affiche dès que l'une se pose (D-102). Les faits que la page
// établit vivent sous `faits/`.

import { Q1_3 } from "../../p1/questions/q1-3.ts";
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
const cas = given.question(Q1_3).answer();
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
  .options({
    "1_CONSULTATION":
      "Consultation médicale de diagnostic, de traitement ou de suivi, dont suivi de l’Affection Longue Durée (ALD).",
    "2_DENTISTE_OU_SAGE_FEMME":
      "Consultation ou soin réalisé par un chirurgien-dentiste ou une sage-femme.",
    "3_IMAGERIE": "Examen d’imagerie ou autre acte médical technique.",
    "4_BIOLOGIE": "Analyse ou examen de biologie médicale.",
    "5_PARAMEDICAL":
      "Rééducation, orthophonie, soins infirmiers ou autre soin paramédical.",
    "6_SEANCE": "Chimiothérapie, radiothérapie ou dialyse.",
    "7_PSYCHOLOGUE": "Séance de psychologue ou dispositif particulier.",
    "8_HOSPITALISATION":
      "Entrée ou sortie d’hospitalisation, ou admission en Hospitalisation à Domicile (HAD).",
    "9_TRANSFERT":
      "Transfert entre établissements, ou déplacement pour soin pendant l’hospitalisation.",
    "10_CAMSP":
      "Soin Centre d’Action Médico-Sociale Précoce (CAMSP)/Centre Médico-Psycho-Pédagogique (CMPP), y compris séance en ville organisée dans le parcours de l’enfant.",
    "11_PERMISSION": "Permission temporaire pendant l’hospitalisation.",
    "12_CONVOCATION":
      "Convocation, expertise, audience ou déplacement chez un fournisseur d’appareillage.",
    "13_MATERNITE":
      "À un examen obligatoire du 8ᵉ ou du 9ᵉ mois de grossesse en maternité, ou à un hébergement temporaire prévu en raison de l’éloignement de la maternité.",
    "14_AUTRE": "Autre soin, examen ou séjour.",
    "15_AUCUN": "Aucun de ces soins ou événements.",
  })
  .mattersWhile(unMotifDeP1.not())
  // Une séance se coche en Q1.3 : elle ne se vote pas deux fois.
  .option("6_SEANCE", (option) => option.offeredWhen(uneSeance.not()));

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
  .options({
    "1_ENTREE": "Une entrée dans un établissement de santé",
    "2_SORTIE": "Une sortie de cet établissement",
    "3_ADMISSION_HAD":
      "Une admission en Hospitalisation à Domicile (HAD) à domicile",
  })
  .appliesWhen(given.question(Q2_1).answer().is("8_HOSPITALISATION"))
  .dependsOn(Q2_1);
