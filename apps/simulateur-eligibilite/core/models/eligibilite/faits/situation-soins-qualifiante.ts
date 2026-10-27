// fait_situation_soins_qualifiante : hospitalisation réelle ou séance assimilée
// qualifiée, avec régime applicable vérifié.
//
// Sans séance en Q1.3 ni séjour en Q2.1, il vaut « non ». Une entrée ou une
// sortie d'établissement (Q2.1.g) l'établit. Sinon, la séance de P1 décide.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { CAS, given, SANS_SEANCE_NI_SEJOUR, SOUS_TYPE } from "./communs.ts";

export const situationSoinsQualifiante = unFait(
  "fait_situation_soins_qualifiante",
)
  .nonSi(
    SANS_SEANCE_NI_SEJOUR,
    "Ni séance qualifiante en Q1.3, ni séjour en Q2.1.",
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
