// L'écran de rattachement : le formulaire, et ce que sa validation déclenche.
//
// À la validation, il range le rattachement en session (pour Matomo), déclare au
// serveur ce que la saisie apprend au référentiel (service ou établissement
// saisi), puis prévient `App`. Au-dessus, le bandeau bêta, si l'environnement
// le demande.
// Voir docs/knowledge/adr/identification.md, ADR-1.

import {
  enrichitLeReferentiel,
  type RattachementSaisi,
} from "../../../shared/rattachement-saisi";
import type { Referentiel } from "../../../shared/referentiel";
import { BandeauBeta, bandeauBetaDemande } from "./BandeauBeta";
import { declarerLaSaisie } from "./declarer-la-saisie";
import { RattachementForm } from "./RattachementForm";
import { rangerRattachement } from "./rattachement-en-session";
import { REFERENTIEL } from "./referentiel";

type Props = {
  // Injectables pour les tests (défauts = production same-origin).
  referentiel?: Referentiel;
  declarer?: (saisie: RattachementSaisi) => void;
  /** Le bandeau bêta s'affiche-t-il ? Défaut : ce que dit l'environnement. */
  bandeauBeta?: boolean;
  onRattache: () => void;
};

export function RattachementScreen({
  referentiel = REFERENTIEL,
  declarer = declarerLaSaisie,
  bandeauBeta = bandeauBetaDemande(),
  onRattache,
}: Props) {
  return (
    <>
      {bandeauBeta && <BandeauBeta />}
      <RattachementForm
        referentiel={referentiel}
        onValide={(saisie) => {
          rangerRattachement(saisie);
          if (enrichitLeReferentiel(saisie)) declarer(saisie);
          onRattache();
        }}
      />
    </>
  );
}
