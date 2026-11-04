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
import { declarerLaSaisie } from "./declarer-la-saisie";
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
  declarer = declarerLaSaisie,
  onRattache,
}: Props) {
  return (
    <RattachementForm
      referentiel={referentiel}
      onValide={(saisie, acces) => {
        rangerRattachement(saisie);
        if (enrichitLeReferentiel(saisie)) declarer(saisie);
        onRattache(acces);
      }}
    />
  );
}
