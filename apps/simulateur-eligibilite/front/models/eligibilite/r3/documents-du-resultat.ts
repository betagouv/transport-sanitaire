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
// (`PROVENANCE_FORMULAIRES.json`). Les trois se remplissent : le S3141
// (`s3141/`, #158), la PMT (`s3138g/`, #160) et la DAP (`s3139h/`, #161).

import type { Cibles } from "../../../../core/models/eligibilite/declarations/cibles";
import { given } from "../../../../core/models/eligibilite/question";
import { cerfaValue } from "../../../socle";
import { S3138G } from "./s3138g/s3138g";
import { S3139H } from "./s3139h/s3139h";
import { S3141 } from "./s3141/s3141";

type Support = Exclude<
  NonNullable<Cibles["cible_support_id"]["value"]>,
  "AUCUN"
>;

const SUPPORT = given.cible("cible_support_id");

// Les documents du modèle, par support. Ce que lisent les cases d'un cerfa ne
// compte que pour son support (#255).
const DOCUMENTS = given.all({
  S3138g: SUPPORT.branch(["S3138g"], cerfaValue(S3138G)),
  S3139h: SUPPORT.branch(["S3139h"], cerfaValue(S3139H)),
  S3141: SUPPORT.branch(["S3141"], cerfaValue(S3141)),
} satisfies Record<Support, unknown>);

/** Le document que cette préconisation complète. `null` : aucun. */
export const DOCUMENT_DU_COMPLEMENT = SUPPORT.computeWith(
  DOCUMENTS,
  ({ value: support }, documents) =>
    support == null || support === "AUCUN" ? null : documents[support],
);
