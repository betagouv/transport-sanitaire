// fait_critere_fauteuil : fauteuil sans transfert.
//
// Le critère 6 de Q1.2 est coché, ou non. Sans professionnel, Q1.2 ne se
// pose pas : il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { CriteresDuTransport } from "../concepts/criteres-du-transport.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const critereFauteuil: DeclarationDeFait = ({ validated }) =>
  CriteresDuTransport.of(validated).fait("6_FAUTEUIL_SANS_TRANSFERT");
