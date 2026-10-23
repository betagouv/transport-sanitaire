// fait_bariatrique : forte corpulence de plus de 150 kg, seulement si un
// motif médical d'ambulance est établi.
//
// Le cas 1 de Q1.3 est coché, ou Q1.3 est validée sans lui. La page ne le
// propose qu'avec un critère d'ambulance en Q1.2.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { CasParticuliers } from "../concepts/cas-particuliers.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const bariatrique: DeclarationDeFait = ({ validated }) =>
  CasParticuliers.of(validated).coche("1_FORTE_CORPULENCE");
