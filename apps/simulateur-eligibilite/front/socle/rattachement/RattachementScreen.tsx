// L'écran de rattachement : le formulaire, et ce que sa validation déclenche.
//
// À la validation, il tire de la saisie les ids du référentiel, en attendant
// que le référentiel enregistre une saisie libre. Il les range en session pour
// Matomo et le journal, puis prévient `App`.

import { useMemo } from "react";
import type { Referentiel } from "../../../shared/referentiel.port";
import { RattachementForm } from "./RattachementForm";
import { RattachementSessionService } from "./rattachement-session.service";
import { RegisterTheRattachement } from "./register-the-rattachement.usecase";
import type { Structure } from "./structures.service";

type Props = {
  // Celui du serveur, donné par le conteneur ; les tests passent le leur.
  referentiel: Referentiel;
  // La structure choisie, `null` pour un établissement : `App` en tire la
  // trace de debug.
  onRattache: (structure: Structure | null) => void;
};

export function RattachementScreen({ referentiel, onRattache }: Props) {
  const enregistrement = useMemo(
    () => new RegisterTheRattachement(referentiel),
    [referentiel],
  );
  return (
    <RattachementForm
      referentiel={referentiel}
      onValide={async (saisie, structure) => {
        RattachementSessionService.ranger(await enregistrement.execute(saisie));
        onRattache(structure);
      }}
    />
  );
}
