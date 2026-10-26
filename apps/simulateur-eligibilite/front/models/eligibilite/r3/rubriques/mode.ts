// Le mode de transport et ses critères, tels que les règles les établissent
// depuis P1. Une cible indéfinie ou sans objet laisse sa case vide : le
// transport partagé ne se coche que sur une preuve (COR-06).

import type { Cibles } from "../../../../../core/models/eligibilite/declarations/cibles";
import type { Cible } from "../../../../../core/socle";
import { uneRubrique } from "./rubrique";

export type Mode = {
  readonly mode_tap_ou_tpmr: boolean;
  readonly mode_individual: boolean;
  readonly mode_public: boolean;
  readonly ambulance_position_allongee_demi_assise: boolean;
  readonly ambulance_surveillance_constante: boolean;
  readonly ambulance_oxygene: boolean;
  readonly ambulance_brancardage_portage: boolean;
  readonly ambulance_isolement_asepsie: boolean;
  readonly partage_incompatible: boolean;
  readonly fauteuil: boolean;
  readonly accompagnant: boolean;
};

export const MODE = uneRubrique("Mode")
  .lit(
    "cible_mode_tap_ou_tpmr",
    "cible_mode_individual",
    "cible_mode_public",
    "cible_ambulance_position_allongee_demi_assise",
    "cible_ambulance_surveillance_constante",
    "cible_ambulance_oxygene",
    "cible_ambulance_brancardage_portage",
    "cible_ambulance_isolement_asepsie",
    "cible_transport_partage_incompatible",
    "cible_fauteuil_roulant",
    "cible_personne_accompagnante",
  )
  .cellules<Mode>({
    mode_tap_ou_tpmr: coche("cible_mode_tap_ou_tpmr"),
    mode_individual: coche("cible_mode_individual"),
    mode_public: coche("cible_mode_public"),
    ambulance_position_allongee_demi_assise: coche(
      "cible_ambulance_position_allongee_demi_assise",
    ),
    ambulance_surveillance_constante: coche(
      "cible_ambulance_surveillance_constante",
    ),
    ambulance_oxygene: coche("cible_ambulance_oxygene"),
    ambulance_brancardage_portage: coche("cible_ambulance_brancardage_portage"),
    ambulance_isolement_asepsie: coche("cible_ambulance_isolement_asepsie"),
    partage_incompatible: coche("cible_transport_partage_incompatible"),
    fauteuil: coche("cible_fauteuil_roulant"),
    accompagnant: coche("cible_personne_accompagnante"),
  });

// ---- implémentation ----

type CibleBooleenne = {
  [Nom in keyof Cibles]: Cibles[Nom] extends Cible<boolean> ? Nom : never;
}[keyof Cibles];

// La case est cochée si la cible vaut vrai, et seulement alors.
function coche<Nom extends CibleBooleenne>(cible: Nom) {
  return ({ cibles }: { cibles: Pick<Cibles, Nom> }) => cibles[cible].isOui();
}
