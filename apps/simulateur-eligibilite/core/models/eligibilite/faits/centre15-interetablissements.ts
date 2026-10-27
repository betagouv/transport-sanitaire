// fait_centre15_interetablissements : Centre 15 hors SMUR entre
// établissements, sous-cas provisoire.
//
// Une entrée simple (Q2.13), la sortie vers la prison ou la permission
// l'écartent. Sinon, l'option 3 de Q2.6 le dit. Un transfert entre
// établissements (Q2.5) attend Q2.6 ; un autre déplacement n'en est pas un. Le
// séjour proposé et écarté le met à « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { DepartDeLEntree } from "../concepts/depart-de-l-entree.ts";
import { ExceptionsDeLArticle80 } from "../concepts/exceptions-de-l-article-80.ts";
import { Permission } from "../concepts/permission.ts";
import { RetourPenitentiaire } from "../concepts/retour-penitentiaire.ts";
import { Sejour } from "../concepts/sejour.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const centre15Interetablissements: DeclarationDeFait = ({
  validated,
}) => {
  const deplacement = validated.question("Q2.5");
  return unFait()
    .retient(
      DepartDeLEntree.of(validated).nonSiEntreeSimple(
        "aucun transfert entre établissements.",
      ),
    )
    .retient(RetourPenitentiaire.of(validated).nonSiSortieVersLaPrison())
    .retient(Permission.of(validated).ecarteLeTransfert())
    .retient(ExceptionsDeLArticle80.of(validated).centre15())
    .inconnuSi(
      deplacement.is("1_TRANSFERT"),
      "Q2.5 : transfert entre établissements ; Q2.6 dira si le Centre 15 l'a demandé.",
    )
    .nonSi(
      deplacement.is("2_AUTRE_DEPLACEMENT"),
      "Q2.5 : « 2_AUTRE_DEPLACEMENT ». Ce n'est pas un transfert entre établissements.",
    )
    .retient(Sejour.of(validated).nonSiEcarte())
    .sinon(PAS_ENCORE_ETABLI);
};
