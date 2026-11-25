// Les endroits des documents de R3 : pour chaque support, où chaque entrée de
// son DTO s'écrit dans le gabarit (`s3138g/`, `s3139h/`, `s3141/`). Ce que vaut
// chaque entrée est du métier (`core/models/eligibilite/r3/`), que le socle
// rejoint par la même clé.
//
// Le compilateur vérifie à chaque clé que les deux parlent du même DTO : le
// métier qui ajoute une entrée casse le cerfa tant qu'il n'a pas dit où
// l'écrire, un endroit sans valeur ne compile pas, et un support sans cerfa non
// plus.

import type { DtosDesDocuments } from "../../../../core/models/eligibilite/r3/r3";
import type { Cerfa } from "../../../socle";
import { S3138G } from "./s3138g/s3138g";
import { S3139H } from "./s3139h/s3139h";
import { S3141 } from "./s3141/s3141";

export const ENDROITS: {
  readonly [Support in keyof DtosDesDocuments]: Cerfa<
    DtosDesDocuments[Support]
  >;
} = {
  S3138g: S3138G,
  S3139h: S3139H,
  S3141,
};
