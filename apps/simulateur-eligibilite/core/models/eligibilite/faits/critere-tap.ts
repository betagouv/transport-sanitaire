// fait_critere_tap : autre critère de transport assis professionnel.
//
// L'un des critères 1 à 5 de Q1.2 est coché, ou aucun. Sans professionnel,
// Q1.2 ne se pose pas : il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { CriteresDuTransport } from "../concepts/criteres-du-transport.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const critereTap: DeclarationDeFait = ({ validated }) =>
  CriteresDuTransport.of(validated).fait(
    "1_PAS_AUTONOME",
    "2_AIDE_TECHNIQUE",
    "3_TRANSMISSION_PAR_UN_PROFESSIONNEL",
    "4_HYGIENE",
    "5_RISQUE_DE_MALAISE",
  );
