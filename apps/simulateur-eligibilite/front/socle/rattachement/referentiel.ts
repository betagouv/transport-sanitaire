// Le référentiel côté navigateur : il appelle l'API du backend, par le client
// que le conteneur lui donne. Voir docs/knowledge/adr/identification.md, ADR-5.

import type {
  Etablissement,
  Referentiel,
  Service,
} from "../../../shared/referentiel";
import type { ServerApiClient } from "../server-api";

export function referentielDuServeur(api: ServerApiClient): Referentiel {
  return {
    listerEtablissements: () => api.get<Etablissement[]>("/etablissements"),
    listerServices: (etabId) => api.get<Service[]>("/services", { etabId }),
  };
}
