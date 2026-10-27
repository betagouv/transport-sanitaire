// La prestation : ce qui motive le déplacement (Q2.1), et ce que P1 en prouve
// déjà. Les faits que sa page établit vivent sous `faits/`.

import { given } from "../question.ts";

/**
 * P1 prouve déjà un motif de transport : l'ambulance, une séance qualifiante,
 * une ALD à 100 % liée au soin, ou le mineur reconnu en soins continus. Q2.1
 * n'est alors pas posée (D-102), et son saut ne donne aucun « non ».
 */
export const unMotifDeP1 = given
  .fait("fait_situation_soins_qualifiante")
  .isOui()
  .or(given.cible("cible_mode_ambulance").isOui())
  .or(given.cible("cible_ald_qualifiante").isOui())
  .or(given.cible("cible_mineur_soins_prolonges").isOui());
