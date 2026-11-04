// L'établissement fourre-tout du référentiel. Ses services sont les structures
// (« Libéral », « Assurance Maladie », « Autre »), que l'écran propose à plat
// sous les établissements. Lui-même ne s'affiche pas.
//
// Il est reconnu comme le service produit l'est (developer-tools/unlock.ts) :
// par son `Id2` Grist, ou par son libellé au cas où l'`Id2` changerait.

import { normalise } from "../../../shared/rattachement-saisi";
import type { Etablissement } from "../../../shared/referentiel";

export function estEtablissementFourreTout(etab: Etablissement): boolean {
  return (
    etab.id === FOURRE_TOUT_ID ||
    normalise(etab.libelle) === normalise(FOURRE_TOUT_LIBELLE)
  );
}

// ---- implémentation ----

const FOURRE_TOUT_ID = "11";
const FOURRE_TOUT_LIBELLE = "Libéral / CNAM / CPAM / Autre";
