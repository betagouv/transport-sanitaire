// fait_mineur_soins_prolonges_reconnus : mineur, soins continus de plus de
// six mois reconnus par le service médical, lien du déplacement et
// déficience vérifiés.
//
// Le cas 8 de Q1.3 est coché, et une déficience est prouvée : l'aide d'un
// proche en Q1.1, ou un critère de Q1.2.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { CasParticuliers } from "../concepts/cas-particuliers.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const mineurSoinsProlongesReconnus: DeclarationDeFait = ({
  validated,
}) => CasParticuliers.of(validated).fondement("8_MINEUR_SOINS_CONTINUS");
