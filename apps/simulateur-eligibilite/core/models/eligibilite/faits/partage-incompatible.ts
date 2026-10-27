// fait_partage_incompatible : état incompatible avec le transport partagé.
//
// Le cas 6 de Q1.3 est coché, ou Q1.3 est validée sans lui. La page ne le
// propose qu'au transport assis professionnel et au TPMR.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { CAS } from "./communs.ts";

export const partageIncompatible = unFait("fait_partage_incompatible")
  .ouiSi(CAS.checked("6_PARTAGE_INCOMPATIBLE"))
  .nonSi(CAS.isPresent())
  .sinon("Q1.3 n'est pas encore validée.");
