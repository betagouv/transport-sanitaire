// fait_hospitalisation : hospitalisation ou séance assimilée établie.
//
// Un transfert depuis un séjour coché, ou un autre déplacement pendant le
// séjour (Q2.5), l'établit. Sans séance ni séjour, et « déjà hospitalisé »
// écarté en Q2.2.1, il vaut « non ». Une entrée ou une sortie d'établissement
// (Q2.1.g) l'établit aussi. Sinon, la séance de P1 décide : l'admission en HAD
// à domicile ne l'établit pas seule.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import {
  CAS,
  DEPLACEMENT,
  given,
  MOTIF,
  SANS_SEANCE_NI_SEJOUR,
  SITUATIONS,
  SOUS_TYPE,
} from "./communs.ts";

export const hospitalisation = unFait("fait_hospitalisation")
  .ouiSi(
    DEPLACEMENT.is("1_TRANSFERT").and(SITUATIONS.checked("1_HOSPITALISATION")),
  )
  .ouiSi(DEPLACEMENT.is("2_AUTRE_DEPLACEMENT"))
  .nonSi(
    SANS_SEANCE_NI_SEJOUR.and(
      MOTIF.isOneOf("9_TRANSFERT", "11_PERMISSION").not(),
    )
      .and(SITUATIONS.isPresent())
      .and(SITUATIONS.offered("1_HOSPITALISATION"))
      .and(SITUATIONS.checked("1_HOSPITALISATION").not()),
    "Ni séance qualifiante en Q1.3, ni séjour en Q2.1 ; « déjà hospitalisé » écarté.",
  )
  .ouiSi(SOUS_TYPE.isOneOf("1_ENTREE", "2_SORTIE"))
  .ouiSi(CAS.checked("3_CHIMIOTHERAPIE").or(CAS.checked("4_RADIOTHERAPIE")))
  .ouiSi(
    given.question("Q1.3.a").answer().is("1_OUI"),
    "Une séance d'hémodialyse.",
  )
  .inconnuSi(
    CAS.isPresent(),
    "Aucune séance qualifiante en P1 : Q2.1.g décidera.",
  )
  .sinon("Q1.3 n'est pas encore validée.");
