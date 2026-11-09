// L'établissement fourre-tout du référentiel, et les structures que l'écran
// propose à plat sous les établissements. Lui-même ne s'affiche pas.
//
// Il est reconnu comme le service produit l'est (developer-tools/unlock.ts) :
// par son `Id2` Grist, ou par son libellé au cas où l'`Id2` changerait.
//
// Ses services ne s'affichent pas tous : les saisies des prescripteurs y
// arrivent aussi. Seules les structures attendues s'affichent, reconnues à leur
// libellé, dans l'ordre du porteur (#367).

import { normalise } from "../../../shared/rattachement-saisi";
import type { Etablissement, Service } from "../../../shared/referentiel";

export function estEtablissementFourreTout(etab: Etablissement): boolean {
  return (
    etab.id === FOURRE_TOUT_ID ||
    normalise(etab.libelle) === normalise(FOURRE_TOUT_LIBELLE)
  );
}

/**
 * Les structures à afficher parmi les services du fourre-tout : l'id de Grist,
 * le libellé et l'ordre du porteur. Une structure absente du référentiel ne
 * s'affiche pas.
 */
export function structuresAffichees(services: Service[]): Service[] {
  return STRUCTURES.flatMap((libelle) => {
    const service = services.find(
      (s) => normalise(s.libelle) === normalise(libelle),
    );
    return service ? [{ id: service.id, libelle }] : [];
  });
}

// ---- implémentation ----

const FOURRE_TOUT_ID = "11";
const FOURRE_TOUT_LIBELLE = "Libéral / CNAM / CPAM / Autre";

const STRUCTURES = ["Libéral", "Assurance Maladie", "Autre"];
