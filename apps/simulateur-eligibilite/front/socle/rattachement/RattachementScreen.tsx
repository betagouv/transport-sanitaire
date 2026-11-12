// L'écran de rattachement : le formulaire, et ce que sa validation déclenche.
//
// À la validation, il range le rattachement en session (pour Matomo), déclare au
// serveur ce que la saisie apprend au référentiel (service ou établissement
// saisi), puis prévient `App`.
// Voir docs/knowledge/adr/identification.md, ADR-1.

import {
  enrichitLeReferentiel,
  type RattachementSaisi,
} from "../../../shared/rattachement-saisi";
import type { Referentiel } from "../../../shared/referentiel";
import { RattachementForm } from "./RattachementForm";
import { rangerRattachement } from "./rattachement-en-session";
import type { Structure } from "./structures";

type Props = {
  // Ceux du serveur, donnés par le conteneur ; les tests passent les leurs.
  referentiel: Referentiel;
  declarer: (saisie: RattachementSaisi) => void;
  // La structure choisie, `null` pour un établissement : `App` en tire la
  // trace de debug (D-280).
  onRattache: (structure: Structure | null) => void;
};

export function RattachementScreen({
  referentiel,
  declarer,
  onRattache,
}: Props) {
  return (
    <RattachementForm
      referentiel={referentiel}
      onValide={(saisie, structure) => {
        rangerRattachement(saisie);
        if (enrichitLeReferentiel(saisie)) declarer(saisie);
        onRattache(structure);
      }}
    />
  );
}
