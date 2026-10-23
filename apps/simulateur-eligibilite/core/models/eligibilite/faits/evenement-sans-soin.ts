// fait_evenement_sans_soin : fondement autonome sans soin associé.
//
// Un soin ordinaire de Q2.1 n'est pas un événement autonome : il vaut « non ».
// Une permission, une convocation ou la maternité ne le deviennent qu'une fois
// leur branche qualifiée (Q2.7, Q2.10, Q2.14) : il reste inconnu.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { Fait } from "../../../socle/index.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";

export const evenementSansSoin: DeclarationDeFait = ({ validated }) => {
  const motif = validated.question("Q2.1");
  if (!motif.hasAnswer()) return Fait.inconnu("Q2.1 n'est pas validée.");
  const source = `Q2.1 : « ${motif.value} »`;
  if (motif.isOneOf(...SOINS)) return Fait.non(`${source}, un soin.`);
  return Fait.inconnu(`${source}, à qualifier dans sa branche.`);
};

// ---- implémentation ----

// Les soins et examens ordinaires : ils ne sont pas un événement autonome.
const SOINS: readonly Questions["Q2.1"][] = [
  "1_CONSULTATION",
  "2_DENTISTE_OU_SAGE_FEMME",
  "3_IMAGERIE",
  "4_BIOLOGIE",
  "5_PARAMEDICAL",
  "6_SEANCE",
  "7_PSYCHOLOGUE",
  "8_HOSPITALISATION",
  "9_TRANSFERT",
  "10_CAMSP",
  "14_AUTRE",
];
