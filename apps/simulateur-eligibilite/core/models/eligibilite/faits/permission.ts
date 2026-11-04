// fait_permission : permission temporaire.
//
// Le séjour coché en établissement, seule Q2.2.1.a la dit : elle ne se pose
// qu'alors. Une HAD n'ouvre aucune permission (TS1014-B01). Sinon,
// Q2.1 la dit. Le séjour écarté, l'entrée en établissement (Q2.1.g) ou la
// sortie vers la prison l'excluent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import {
  given,
  UN_SEJOUR_ECARTE,
  UN_SEJOUR_EN_HAD,
  UNE_SORTIE_VERS_LA_PRISON,
} from "./communs.ts";

export const permission = unFait("fait_permission")
  .applique(UNE_SORTIE_VERS_LA_PRISON)
  .nonSi(
    given
      .question("Q2.2.1")
      .answer()
      .isPresent()
      .and(given.question("Q2.1.g").answer().is("1_ENTREE")),
    "Aucun séjour en cours, donc aucune permission.",
  )
  .applique(UN_SEJOUR_ECARTE)
  .nonSi(
    UN_SEJOUR_EN_HAD,
    "Une Hospitalisation à Domicile n'ouvre aucune permission.",
  )
  .ouiSi(given.question("Q2.2.1.a").answer().is("1_OUI"))
  .nonSi(given.question("Q2.2.1.a").answer().is("2_NON"))
  .ouiSi(given.question("Q2.1").answer().is("11_PERMISSION"))
  .sinon("Ni Q2.1, ni Q2.2.1 n'établissent encore de permission.");
