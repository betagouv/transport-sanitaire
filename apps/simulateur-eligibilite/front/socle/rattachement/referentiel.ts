// Le référentiel côté navigateur : il appelle l'API du backend, sur la même
// origine. Voir docs/knowledge/adr/identification.md, ADR-5.

import type {
  Etablissement,
  Referentiel,
  Service,
} from "../../../shared/referentiel";
import { ServerApiClient } from "../server-api";

export const REFERENTIEL: Referentiel = {
  listerEtablissements: () =>
    new ServerApiClient().get<Etablissement[]>("/etablissements"),
  listerServices: (etabId) =>
    new ServerApiClient().get<Service[]>("/services", { etabId }),
};
