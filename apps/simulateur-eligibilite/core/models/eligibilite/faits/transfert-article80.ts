// fait_transfert_article80 : transfert pendant hospitalisation relevant
// potentiellement de l'article 80.
//
// Une entrée simple (Q2.13), la sortie vers la prison ou la permission
// l'écartent. Sinon, Q2.5 l'établit, comme une admission en HAD (Q2.1.g) ou un
// autre déplacement une fois Q2.6 validée. Le séjour proposé et écarté le met à
// « non ».
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { DepartDeLEntree } from "../concepts/depart-de-l-entree.ts";
import { Permission } from "../concepts/permission.ts";
import { RetourPenitentiaire } from "../concepts/retour-penitentiaire.ts";
import { Sejour } from "../concepts/sejour.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const transfertArticle80: DeclarationDeFait = ({ validated }) => {
  const deplacement = validated.question("Q2.5");
  const q26 = validated.question("Q2.6").hasAnswer();
  return unFait()
    .retient(
      DepartDeLEntree.of(validated).nonSiEntreeSimple(
        "une entrée simple est hors du champ du I de D.162-17.",
      ),
    )
    .retient(RetourPenitentiaire.of(validated).nonSiSortieVersLaPrison())
    .retient(Permission.of(validated).ecarteLeTransfert())
    .ouiSi(
      validated.question("Q2.1.g").is("3_ADMISSION_HAD") && q26,
      "Q2.1.g : « 3_ADMISSION_HAD », Q2.6 validée.",
    )
    .ouiSi(deplacement.is("1_TRANSFERT"), "Q2.5 : « 1_TRANSFERT ».")
    .ouiSi(
      deplacement.is("2_AUTRE_DEPLACEMENT") && q26,
      "Q2.5 et Q2.6 : déplacement provisoire pendant le séjour.",
    )
    .retient(Sejour.of(validated).nonSiEcarte())
    .sinon(PAS_ENCORE_ETABLI);
};
