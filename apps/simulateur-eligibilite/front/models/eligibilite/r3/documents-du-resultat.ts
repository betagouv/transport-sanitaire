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
// (`PROVENANCE_FORMULAIRES.json`). Le S3141 se remplit (`s3141/`, #158). Les
// DTO de la PMT et de la DAP sont encore vides : elles se téléchargent vierges
// et aplaties, jusqu'à #160 et #161.

import {
  bindCerfa,
  type Cerfa,
  type CerfaMapping,
  templateAt,
} from "../../../socle";
import type { Cibles } from "../declarations/cibles";
import s3138g from "./gabarits/S3138g.pdf?url";
import s3139h from "./gabarits/S3139h.pdf?url";
import type { Donnees } from "./rubriques/rubrique";
import { S3141 } from "./s3141/s3141";

/** Le document que cette préconisation complète. `null` : aucun. */
export function documentDuComplement(cibles: Cibles) {
  const support = cibles.cible_support_id;
  return support && support !== "AUCUN" ? DOCUMENTS[support] : null;
}

// ---- implémentation ----

type Support = Exclude<NonNullable<Cibles["cible_support_id"]>, "AUCUN">;
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
  S3138g: vierge(s3138g, "prescription-medicale-de-transport"),
  S3139h: vierge(s3139h, "demande-d-accord-prealable"),
  S3141,
};
