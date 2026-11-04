// L'écran de rattachement : le formulaire, et ce que sa validation déclenche.
//
// À la validation, il range le rattachement en session (pour Matomo), déclare au
// serveur un service saisi sous « Autre », puis prévient `App`.
// Voir docs/knowledge/adr/identification.md, ADR-1.

import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import type { Referentiel } from "../../../shared/referentiel";
import { declarerUnService } from "./declarer-un-service";
import { type AccesRattachement, RattachementForm } from "./RattachementForm";
import { rangerRattachement } from "./rattachement-en-session";
import { REFERENTIEL } from "./referentiel";

type Props = {
  // Injectables pour les tests (défauts = production same-origin).
  referentiel?: Referentiel;
  declarer?: (saisie: RattachementSaisi) => void;
  onRattache: (acces: AccesRattachement) => void;
};

export function RattachementScreen({
  referentiel = REFERENTIEL,
  declarer = declarerUnService,
  onRattache,
}: Props) {
  return (
    <RattachementForm
      referentiel={referentiel}
      onValide={(saisie, acces) => {
        rangerRattachement(saisie);
        if (saisie.serviceEstAutre) declarer(saisie);
        onRattache(acces);
      }}
    />
  );
}
