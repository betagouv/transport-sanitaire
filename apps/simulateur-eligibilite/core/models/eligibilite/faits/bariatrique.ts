// fait_bariatrique : forte corpulence de plus de 150 kg, seulement si un
// motif médical d'ambulance est établi.
//
// Le cas 1 de Q1.3 est coché, ou Q1.3 est validée sans lui. La page ne le
// propose qu'avec un critère d'ambulance en Q1.2.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { CAS } from "./communs.ts";

export const bariatrique = unFait("fait_bariatrique")
  .ouiSi(CAS.checked("1_FORTE_CORPULENCE"))
  .nonSi(CAS.isPresent())
  .sinon("Q1.3 n'est pas encore validée.");
