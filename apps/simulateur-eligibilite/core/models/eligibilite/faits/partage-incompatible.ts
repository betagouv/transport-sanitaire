// fait_partage_incompatible : état incompatible avec le transport partagé.
//
// Le cas 6 de Q1.3 est coché, ou Q1.3 est validée sans lui. La page ne le
// propose qu'au transport assis professionnel et au TPMR.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { CasParticuliers } from "../concepts/cas-particuliers.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const partageIncompatible: DeclarationDeFait = ({ validated }) =>
  CasParticuliers.of(validated).coche("6_PARTAGE_INCOMPATIBLE");
