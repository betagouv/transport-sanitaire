// Les documents de R3 (#157) : le gabarit que chaque support remplit, d'après
// `cible_support_id`.
//
// | Support | Document | Issues |
// |---|---|---|
// | S3138g | prescription médicale de transport (Cerfa 11574*07) | PMT |
// | S3139h | demande d'accord préalable (Cerfa 11575*08) | les deux DAP, l'étranger |
// | S3141 | prescription de permission de sortie, moins de 20 ans | S3141 |
// | AUCUN | aucun document : R2 est le dernier écran | les autres |
//
// Les gabarits sont ceux de `formulaires/` de la v10.1.3, à l'octet près
// (`PROVENANCE_FORMULAIRES.json`). Le S3141 (`s3141/`, #158) et la PMT
// (`s3138g/`, #160) se remplissent. Le DTO de la DAP est encore vide : elle se
// télécharge vierge et aplatie, jusqu'à #161.

import type { Cibles } from "../../../../core/models/eligibilite/declarations/cibles";
import {
  bindCerfa,
  type Cerfa,
  type CerfaMapping,
  templateAt,
} from "../../../socle";
import s3139h from "./gabarits/S3139h.pdf?url";
import type { Donnees } from "./rubriques/rubrique";
import { S3138G } from "./s3138g/s3138g";
import { S3141 } from "./s3141/s3141";

/** Le document que cette préconisation complète. `null` : aucun. */
export function documentDuComplement(cibles: Cibles) {
  const support = cibles.cible_support_id.value;
  return support == null || support === "AUCUN" ? null : DOCUMENTS[support];
}

/**
 * Le document sort-il encore vierge ? La DAP, jusqu'à #161 : R3 n'en montre
 * pas l'aperçu.
 */
export function sortVierge(cibles: Cibles): boolean {
  return cibles.cible_support_id.value === "S3139h";
}

// ---- implémentation ----

type Support = Exclude<
  NonNullable<Cibles["cible_support_id"]["value"]>,
  "AUCUN"
>;
type SansEntree = {
  fields: Record<never, never>;
  drawings: Record<never, never>;
};

const VIERGE: CerfaMapping<SansEntree, Donnees> = { fields: {}, drawings: {} };

function vierge(url: string, fileName: string) {
  const cerfa: Cerfa<SansEntree> = {
    template: templateAt(url),
    fileName,
    fields: {},
    drawings: {},
  };
  return bindCerfa(cerfa, VIERGE);
}

const DOCUMENTS: Record<Support, typeof S3141> = {
  S3138g: S3138G,
  S3139h: vierge(s3139h, "demande-d-accord-prealable"),
  S3141,
};
