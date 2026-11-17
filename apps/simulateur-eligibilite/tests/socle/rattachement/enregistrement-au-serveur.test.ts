// L'enregistrement d'une saisie libre, du navigateur au vrai serveur de test :
// les ids qu'il donne, et l'entrée sans ids quand il ne répond pas, ou trop
// tard. Voir docs/knowledge/domain/enrichissement-referentiel-rattachement.md.

import { afterEach, describe, expect, it } from "vitest";
import { referentielDuServeur } from "../../../front/socle/rattachement";
import { RegisterTheRattachement } from "../../../front/socle/rattachement/register-the-rattachement.usecase";
import { ServerApiClient } from "../../../front/socle/server-api";
import { RattachementDuReferentiel } from "../../../shared/rattachement-du-referentiel.vo";
import {
  type Referentiel,
  snapshotReferentiel,
} from "../../../shared/referentiel";
import { type AppDeTest, demarrer } from "../server/serveur-de-test";

let app: AppDeTest;
afterEach(() => app.close());

const SERVICE_SAISI = {
  etabId: "e_chu_grenoble",
  serviceId: "s_grenoble_autre",
  serviceEstAutre: true,
  serviceLibre: "Néphrologie",
};

describe("enregistrer une saisie libre au serveur", () => {
  it("donne les ids que le référentiel lui donne", async () => {
    const rattachement = await enregistrerSur({
      ...snapshotReferentiel,
      async enrichirDepuisSaisie({ etabId }) {
        return { etabId, serviceId: "s_cree" };
      },
    });

    expect(rattachement).toEqual(
      RattachementDuReferentiel.enregistre({
        etabId: "e_chu_grenoble",
        serviceId: "s_cree",
      }),
    );
  });

  it("entre avec l'établissement seul si le référentiel échoue", async () => {
    const rattachement = await enregistrerSur({
      ...snapshotReferentiel,
      async enrichirDepuisSaisie() {
        throw new Error("Grist indisponible");
      },
    });

    expect(rattachement.etabId).toBe("e_chu_grenoble");
    expect(rattachement.serviceId).toBeUndefined();
  });

  it("n'attend pas plus que son délai un référentiel qui ne répond pas", async () => {
    const rattachement = await enregistrerSur({
      ...snapshotReferentiel,
      enrichirDepuisSaisie: () => new Promise(() => {}),
    });

    expect(rattachement.serviceId).toBeUndefined();
  });
});

// ---- implémentation ----

// La page de test passe sur l'origine du serveur, comme l'app servie par lui :
// happy-dom applique la règle de même origine à `fetch`. Le délai est court,
// pour ne pas attendre le vrai.
async function enregistrerSur(referentiel: Referentiel) {
  app = await demarrer(referentiel);
  (window as unknown as HappyDomWindow).happyDOM.setURL(app.base);
  const duServeur = referentielDuServeur(new ServerApiClient(), {
    delai: 200,
  });
  return new RegisterTheRattachement(duServeur).execute(SERVICE_SAISI);
}

type HappyDomWindow = { happyDOM: { setURL: (url: string) => void } };
