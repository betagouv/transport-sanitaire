// fait_transfert_article80 : transfert pendant hospitalisation relevant
// potentiellement de l'article 80.
//
// Une entrée simple (Q2.13) ou la sortie vers la prison l'écartent. La
// permission d'un adulte autorisée (Q2.7 = 3) l'établit (D-283), une autre
// permission l'écarte. Sinon, Q2.5 l'établit, comme une admission (Q2.1.g) ou
// un séjour en HAD (TS1014-B01), ou un autre déplacement une fois Q2.6
// validée. Le séjour proposé et écarté le met à « non ».
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import {
  given,
  UN_SEJOUR_ECARTE,
  UN_SEJOUR_EN_HAD,
  UNE_ENTREE_SIMPLE,
  UNE_PERMISSION_ECARTE_LE_TRANSFERT,
  UNE_SORTIE_VERS_LA_PRISON,
} from "./communs.ts";
import { PAS_ENCORE_ETABLI } from "./noms.ts";

export const transfertArticle80 = unFait("fait_transfert_article80")
  .nonSi(
    UNE_ENTREE_SIMPLE,
    "Une entrée simple est hors du champ du I de D.162-17.",
  )
  .applique(UNE_SORTIE_VERS_LA_PRISON)
  .ouiSi(
    given
      .fait("fait_permission")
      .isOui()
      .and(given.question("Q2.7").answer().is("3_ADULTE_AUTORISEE")),
    "Une permission d'un adulte, autorisée pour les soins ou l'organisation.",
  )
  .applique(UNE_PERMISSION_ECARTE_LE_TRANSFERT)
  .ouiSi(
    given
      .question("Q2.1.g")
      .answer()
      .is("3_ADMISSION_HAD")
      .or(UN_SEJOUR_EN_HAD)
      .and(given.question("Q2.6").answer().isPresent()),
  )
  .ouiSi(given.question("Q2.5").answer().is("1_TRANSFERT"))
  .ouiSi(
    given
      .question("Q2.5")
      .answer()
      .is("2_AUTRE_DEPLACEMENT")
      .and(given.question("Q2.6").answer().isPresent()),
    "Un déplacement provisoire pendant le séjour.",
  )
  .applique(UN_SEJOUR_ECARTE)
  .sinon(PAS_ENCORE_ETABLI);
