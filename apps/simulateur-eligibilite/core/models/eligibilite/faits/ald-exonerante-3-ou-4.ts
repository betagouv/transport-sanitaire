// fait_ald_exonerante_3_ou_4 : ALD ouvrant droit au titre du 3° ou du 4° de
// L.160-14 vérifiée.
//
// Le cas 2 de Q1.3 coché dit une prise en charge à 100 %. Q1.3 validée sans
// lui ne dit rien du statut de l'ALD : il reste inconnu.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { regles } from "../../../socle/index.ts";
import { CasParticuliers } from "../concepts/cas-particuliers.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const aldExonerante3Ou4: DeclarationDeFait = ({ validated }) => {
  const ald = CasParticuliers.of(validated).coche("2_ALD");
  return regles()
    .ouiSi(ald.isOui(), "Q1.3 : « 2_ALD » coché, pris en charge à 100 %.")
    .inconnuSi(
      ald.isNon(),
      "Q1.3 validée sans « 2_ALD » : le statut de l'ALD reste inconnu.",
    )
    .sinon(ald);
};
