// Les documents de R3 : pour chaque support, son cerfa lié au mapping de ses
// valeurs. Les valeurs sont du métier (`core/models/eligibilite/r3/`), les
// endroits de l'écran (`s3138g/`, `s3139h/`, `s3141/`) : c'est ici qu'ils se
// rencontrent.
//
// Le compilateur vérifie à chaque liaison que les deux parlent du même DTO : le
// métier qui ajoute une entrée casse le cerfa tant qu'il n'a pas dit où
// l'écrire, et un endroit sans valeur ne compile pas. La table, elle, a un
// document par support.

import type { Support } from "../../../../core/models/eligibilite/r3/r3";
import { VERS_LA_PMT } from "../../../../core/models/eligibilite/r3/s3138g";
import { VERS_LA_DAP } from "../../../../core/models/eligibilite/r3/s3139h";
import { VERS_LE_S3141 } from "../../../../core/models/eligibilite/r3/s3141";
import { type BoundCerfa, CerfaFactory } from "../../../socle";
import { S3138G } from "./s3138g/s3138g";
import { S3139H } from "./s3139h/s3139h";
import { S3141 } from "./s3141/s3141";

const { link } = CerfaFactory;

export const DOCUMENTS = {
  S3138g: link(S3138G, VERS_LA_PMT),
  S3139h: link(S3139H, VERS_LA_DAP),
  S3141: link(S3141, VERS_LE_S3141),
} satisfies Record<Support, BoundCerfa>;
