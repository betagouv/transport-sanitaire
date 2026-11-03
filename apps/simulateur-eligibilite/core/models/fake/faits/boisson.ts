// boisson : la boisson commandée, en toutes lettres. `null` : aucune.

import { unFait } from "../../../socle/index.ts";
import type { Questions } from "../questions/catalogue.ts";
import { BOISSON } from "./communs.ts";

const BOISSONS: Record<Questions["boisson"], string | null> = {
  the: "thé",
  cafe: "café",
  rien: null,
};

export const boisson = unFait("boisson").vaut(
  BOISSON.compute((boisson) =>
    boisson.hasAnswer() ? BOISSONS[boisson.value] : null,
  ),
);
