// La prestation : ce qui motive le déplacement (Q2.1), et ce que P1 en prouve
// déjà. Les faits que sa page établit vivent sous `faits/`.

import type { Context } from "../question.ts";

/**
 * P1 prouve-t-elle déjà un motif de transport ? L'ambulance, une séance
 * qualifiante, une ALD à 100 % liée au soin, ou le mineur reconnu en soins
 * continus. Q2.1 n'est alors pas posée (D-102), et son saut ne donne aucun
 * « non ».
 */
export function motifDeP1({
  faits,
  cibles,
}: Pick<Context, "faits" | "cibles">): boolean {
  if (faits.fait_situation_soins_qualifiante.isOui()) return true;
  return MOTIFS_DE_P1.some((motif) => cibles[motif].isOui());
}

// ---- implémentation ----

// Les cibles qui, à la fin de P1, prouvent déjà un motif de transport.
const MOTIFS_DE_P1 = [
  "cible_mode_ambulance",
  "cible_ald_qualifiante",
  "cible_mineur_soins_prolonges",
] as const;
