// accompagnements : ce qui accompagne la boisson, en toutes lettres.

import { unFait } from "../../../socle/index.ts";
import { AVEC } from "./communs.ts";

const ACCOMPAGNEMENTS: Record<string, string | undefined> = {
  lait: "lait",
  sucre: "sucre",
  citron: "citron",
  "citron-a-voir": "peut-être du citron",
};

export const accompagnements = unFait("accompagnements").vaut(
  AVEC.compute((avec) =>
    avec.checkedBoxes().flatMap((item) => ACCOMPAGNEMENTS[item] ?? []),
  ),
);
