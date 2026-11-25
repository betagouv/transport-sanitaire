// Le référentiel côté navigateur : il appelle l'API du backend, par le client
// que le conteneur lui donne.
//
// L'enregistrement d'une saisie libre retient l'entrée dans le simulateur : il
// n'attend pas plus que son délai. Passé ce délai, le prescripteur entre sans
// les ids, et le serveur finit d'écrire pour la visite suivante.

import type {
  Etablissement,
  RattachementEnregistre,
  Referentiel,
  Service,
} from "../../../shared/referentiel.port";
import type { ServerApiClient } from "../server-api";

export function referentielDuServeur(
  api: ServerApiClient,
  { delai = DELAI_D_ENREGISTREMENT }: { delai?: number } = {},
): Referentiel {
  return {
    listerEtablissements: () => api.get<Etablissement[]>("/etablissements"),
    listerServices: (etabId) => api.get<Service[]>("/services", { etabId }),
    enrichirDepuisSaisie: (saisie) =>
      api.postAndRead<RattachementEnregistre>("/rattachement", saisie, {
        timeout: delai,
      }),
  };
}

// ---- implémentation ----

// En millisecondes. Un Grist qui répond met moins d'une seconde ; au-delà, le
// prescripteur attendrait sans rien voir venir.
const DELAI_D_ENREGISTREMENT = 5_000;
