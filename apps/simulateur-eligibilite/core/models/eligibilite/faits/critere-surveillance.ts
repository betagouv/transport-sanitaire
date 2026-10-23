// fait_critere_surveillance : surveillance qualifiée constante.
//
// Le critère 9 de Q1.2 est coché, ou non. Sans professionnel, Q1.2 ne se
// pose pas : il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { CriteresDuTransport } from "../concepts/criteres-du-transport.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const critereSurveillance: DeclarationDeFait = ({ validated }) =>
  CriteresDuTransport.of(validated).fait("9_SURVEILLANCE");
