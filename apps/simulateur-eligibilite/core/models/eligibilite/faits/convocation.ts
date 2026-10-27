// fait_convocation : convocation ou appareillage relevant de R.322-10 2°.
//
// Une catégorie de Q2.10 vérifiée donne « oui », une catégorie négative
// vérifiée donne « non ». Une condition impossible à vérifier laisse le fait
// inconnu : `cible_convocation_inconnue_decisive` envoie alors à la caisse.
// Avant Q2.10, la convocation cochée en Q2.2.1.b reste à qualifier, et écartée
// en Q2.2.1, elle vaut « non ».
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import {
  AUTRE_CADRE_ECARTE,
  given,
  SITUATION_DU_CADRE,
  SITUATION_PROPOSEE,
} from "./communs.ts";

const CATEGORIE = given.question("Q2.10").answer();
const AGREMENT = given.question("Q2.10.a").answer();
const APPAREILLAGE = given.question("Q2.10.b").answer();
const UN_APPAREILLAGE = CATEGORIE.is("6_APPAREILLAGE");

export const convocation = unFait("fait_convocation")
  .nonSi(CATEGORIE.is("7_AUCUNE"), "Ce motif de convocation ne s'applique pas.")
  .nonSi(
    UN_APPAREILLAGE.and(AGREMENT.is("2_NON")),
    "Le fournisseur n'est pas agréé, ce motif ne s'applique pas.",
  )
  .nonSi(
    UN_APPAREILLAGE.and(APPAREILLAGE.is("4_AUTRE")),
    "Hors des trois appareillages visés par R.322-10 2°, ce motif ne s'applique pas.",
  )
  .ouiSi(
    UN_APPAREILLAGE.and(AGREMENT.is("1_OUI")).and(
      APPAREILLAGE.isOneOf(
        "1_PROTHESE_OCULAIRE_FACIALE",
        "2_PODO_ORTHESE",
        "3_ORTHOPROTHESE",
      ),
    ),
  )
  .inconnuSi(
    UN_APPAREILLAGE,
    "L'agrément ou l'appareillage ne peut pas se vérifier ou se préciser. À vérifier.",
  )
  .ouiSi(CATEGORIE.isPresent())
  .nonSi(
    AUTRE_CADRE_ECARTE.and(SITUATION_PROPOSEE["13_CONVOCATION"]),
    "« autre situation » proposée, non cochée.",
  )
  .inconnuSi(
    SITUATION_DU_CADRE.checked("13_CONVOCATION"),
    "À qualifier dans sa branche.",
  )
  .nonSiEcartee(SITUATION_DU_CADRE, "13_CONVOCATION")
  .sinon(PAS_ENCORE_ETABLI);
