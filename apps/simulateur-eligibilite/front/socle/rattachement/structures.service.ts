// L'établissement fourre-tout du référentiel, et les structures que l'écran
// propose à plat sous les établissements. Lui-même ne s'affiche pas.
//
// Il est reconnu par son `Id2` Grist, ou par son libellé au cas où l'`Id2`
// changerait.
//
// Ses services ne s'affichent pas tous : les saisies des prescripteurs y
// arrivent aussi. Seules les structures attendues s'affichent, reconnues à leur
// libellé, dans l'ordre du porteur.

import { normalise } from "../../../shared/rattachement-saisi.vo";
import type { Etablissement, Service } from "../../../shared/referentiel.port";

const STRUCTURES = ["Libéral", "Assurance Maladie", "Autre"] as const;

/** Une structure, sous le libellé du porteur. */
export type Structure = (typeof STRUCTURES)[number];

/** Une structure affichée : l'id de son service dans Grist, et son libellé. */
export type StructureAffichee = { id: string; libelle: Structure };

export class StructuresService {
  static estEtablissementFourreTout(etab: Etablissement): boolean {
    return (
      etab.id === StructuresService.#FOURRE_TOUT_ID ||
      normalise(etab.libelle) ===
        normalise(StructuresService.#FOURRE_TOUT_LIBELLE)
    );
  }

  /**
   * Les structures à afficher parmi les services du fourre-tout : l'id de Grist,
   * le libellé et l'ordre du porteur. Une structure absente du référentiel ne
   * s'affiche pas.
   */
  static structuresAffichees(services: Service[]): StructureAffichee[] {
    return STRUCTURES.flatMap((libelle) => {
      const service = services.find(
        (s) => normalise(s.libelle) === normalise(libelle),
      );
      return service ? [{ id: service.id, libelle }] : [];
    });
  }

  static readonly #FOURRE_TOUT_ID = "11";
  static readonly #FOURRE_TOUT_LIBELLE = "Libéral / CNAM / CPAM / Autre";
}
