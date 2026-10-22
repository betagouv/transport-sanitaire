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
// (`PROVENANCE_FORMULAIRES.json`). Leurs DTO sont encore vides : le document se
// télécharge vierge et aplati. Ils se remplissent dans #158 à #161.

import {
  bindCerfa,
  type Cerfa,
  type CerfaInput,
  type CerfaMapping,
  templateAt,
} from "../../../socle";
import type { Cibles } from "../declarations/cibles";
import type { Faits } from "../declarations/faits";
import type { Questions } from "../declarations/questions";
import s3138g from "./gabarits/S3138g.pdf?url";
import s3139h from "./gabarits/S3139h.pdf?url";
import s3141 from "./gabarits/S3141.pdf?url";

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

const VIERGE: CerfaMapping<SansEntree, CerfaInput<Questions, Faits, Cibles>> = {
  fields: {},
  drawings: {},
};

function gabarit(url: string, fileName: string): Cerfa<SansEntree> {
  return { template: templateAt(url), fileName, fields: {}, drawings: {} };
}

const DOCUMENTS: Record<Support, ReturnType<typeof bind>> = {
  S3138g: bind(gabarit(s3138g, "prescription-medicale-de-transport")),
  S3139h: bind(gabarit(s3139h, "demande-d-accord-prealable")),
  S3141: bind(gabarit(s3141, "prescription-de-permission-de-sortie")),
};

function bind(cerfa: Cerfa<SansEntree>) {
  return bindCerfa(cerfa, VIERGE);
}
