// fait_mineur_soins_prolonges_reconnus : mineur, soins continus de plus de
// six mois reconnus par le service médical, lien du déplacement et
// déficience vérifiés.
//
// Le cas 8 de Q1.3 est coché, et une déficience est prouvée : l'aide d'un
// proche en Q1.1, ou un critère de Q1.2.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { AIDE, CAS, CRITERES } from "./communs.ts";

export const mineurSoinsProlongesReconnus = unFait(
  "fait_mineur_soins_prolonges_reconnus",
)
  .nonSi(CAS.isPresent().and(CAS.checked("8_MINEUR_SOINS_CONTINUS").not()))
  .ouiSi(
    CAS.checked("8_MINEUR_SOINS_CONTINUS").and(AIDE.is("2_AVEC_UN_PROCHE")),
    "L'aide d'un proche est nécessaire.",
  )
  .nonSi(
    CAS.checked("8_MINEUR_SOINS_CONTINUS").and(AIDE.is("1_SEUL")),
    "Le patient se déplace seul.",
  )
  .ouiSi(
    CAS.checked("8_MINEUR_SOINS_CONTINUS")
      .and(AIDE.is("3_AVEC_UN_PROFESSIONNEL"))
      .and(CRITERES.anyChecked()),
    "Un critère de Q1.2 prouve une déficience.",
  )
  .inconnuSi(
    CAS.checked("8_MINEUR_SOINS_CONTINUS"),
    "Ni Q1.1 ni Q1.2 n'établissent encore une déficience.",
  )
  .sinon("Q1.3 n'est pas encore validée.");
