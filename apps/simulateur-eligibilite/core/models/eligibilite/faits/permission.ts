// fait_permission : permission temporaire.
//
// Le séjour coché, seule Q2.2.1.a la dit : elle ne se pose qu'alors. Sinon,
// Q2.1 la dit. Le séjour écarté, l'entrée en établissement (Q2.1.g) ou la
// sortie vers la prison l'excluent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import {
  MOTIF,
  PERMISSION_DU_SEJOUR,
  SITUATIONS,
  SOUS_TYPE,
  UN_SEJOUR_ECARTE,
  UNE_SORTIE_VERS_LA_PRISON,
} from "./communs.ts";

export const permission = unFait("fait_permission")
  .applique(UNE_SORTIE_VERS_LA_PRISON)
  .nonSi(
    SITUATIONS.isPresent().and(SOUS_TYPE.is("1_ENTREE")),
    "Aucun séjour en cours, donc aucune permission.",
  )
  .applique(UN_SEJOUR_ECARTE)
  .ouiSi(PERMISSION_DU_SEJOUR.is("1_OUI"))
  .nonSi(PERMISSION_DU_SEJOUR.is("2_NON"))
  .ouiSi(MOTIF.is("11_PERMISSION"))
  .sinon("Ni Q2.1, ni Q2.2.1 n'établissent encore de permission.");
