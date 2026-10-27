// fait_situation_soins_qualifiante : hospitalisation réelle ou séance assimilée
// qualifiée, avec régime applicable vérifié.
//
// Sans séance en Q1.3 ni séjour en Q2.1, il vaut « non ». Une entrée ou une
// sortie d'établissement (Q2.1.g) l'établit. Sinon, la séance de P1 décide.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { Soin } from "../concepts/soin.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const situationSoinsQualifiante: DeclarationDeFait = ({ validated }) => {
  const soin = Soin.of(validated);
  return unFait()
    .retient(soin.sansSeanceNiSejour())
    .retient(soin.parEntreeOuSortie())
    .sinon(soin.seanceDeP1());
};
