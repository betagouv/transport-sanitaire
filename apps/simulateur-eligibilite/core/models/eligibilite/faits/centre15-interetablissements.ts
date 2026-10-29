// fait_centre15_interetablissements : Centre 15 hors SMUR entre
// établissements, sous-cas provisoire.
//
// Une entrée simple (Q2.13), la sortie vers la prison ou la permission
// l'écartent. Sinon, l'option 3 de Q2.6 le dit. Un transfert entre
// établissements (Q2.5) attend Q2.6 ; un autre déplacement ni une HAD n'en sont un. Le
// séjour proposé et écarté le met à « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import {
  DEPLACEMENT,
  EXCEPTIONS,
  UN_SEJOUR_ECARTE,
  UN_SEJOUR_EN_HAD,
  UNE_ENTREE_SIMPLE,
  UNE_PERMISSION_ECARTE_LE_TRANSFERT,
  UNE_SORTIE_VERS_LA_PRISON,
} from "./communs.ts";

export const centre15Interetablissements = unFait(
  "fait_centre15_interetablissements",
)
  .nonSi(UNE_ENTREE_SIMPLE, "Aucun transfert entre établissements.")
  .applique(UNE_SORTIE_VERS_LA_PRISON)
  .applique(UNE_PERMISSION_ECARTE_LE_TRANSFERT)
  .ouiSi(EXCEPTIONS.checked("3_CENTRE_QUINZE"))
  .nonSiEcartee(EXCEPTIONS, "3_CENTRE_QUINZE")
  .nonSi(
    UN_SEJOUR_EN_HAD.and(EXCEPTIONS.isPresent()).and(
      DEPLACEMENT.is("1_TRANSFERT").not(),
    ),
    "Une Hospitalisation à Domicile n'est pas un transfert entre établissements.",
  )
  .inconnuSi(
    DEPLACEMENT.is("1_TRANSFERT"),
    "Q2.6 dira si le Centre 15 l'a demandé.",
  )
  .nonSi(
    DEPLACEMENT.is("2_AUTRE_DEPLACEMENT"),
    "Ce n'est pas un transfert entre établissements.",
  )
  .applique(UN_SEJOUR_ECARTE)
  .sinon(PAS_ENCORE_ETABLI);
