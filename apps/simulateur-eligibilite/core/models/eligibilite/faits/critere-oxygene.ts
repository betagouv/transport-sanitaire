// fait_critere_oxygene : oxygène pendant le transport.
//
// Le critère 10 de Q1.2 est coché, ou non. Sans professionnel, Q1.2 ne se
// pose pas : il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { CriteresDuTransport } from "../concepts/criteres-du-transport.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const critereOxygene: DeclarationDeFait = ({ validated }) =>
  CriteresDuTransport.of(validated).fait("10_OXYGENE");
