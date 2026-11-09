// Les réponses et les lectures que partagent les tests de la convocation (Q2.10).

import {
  ciblesDe,
  faits,
  issue,
  posee,
  type Reponses,
  SANS_SITUATION,
} from "./reponses-de-la-permission";

export { ciblesDe, issue, posee, type Reponses };

// Un patient seul, pour un autre motif, convoqué : seule Q2.2.1.b dit la
// convocation (D-272), et Q2.10 se pose.
export const CONVOQUE: Reponses = {
  ...SANS_SITUATION,
  "Q2.2.1.b": ["13_CONVOCATION"],
};

// Le même, dont le motif est une consultation.
export const PAR_Q221B: Reponses = { ...CONVOQUE, "Q2.1": "1_CONSULTATION" };

/** Q2.10 = 6, avec l'agrément et l'appareillage donnés. */
export const appareillage = (
  agrement: Reponses["Q2.10.a"],
  appareil: Reponses["Q2.10.b"],
  base: Reponses = CONVOQUE,
): Reponses => ({
  ...base,
  "Q2.10": "6_APPAREILLAGE",
  "Q2.10.a": agrement,
  "Q2.10.b": appareil,
});

const PAGE = "P2/convocation";

/** Les ids posés sur la page de la convocation. */
export const posees = (reponses: Reponses) =>
  (["Q2.10", "Q2.10.a", "Q2.10.b"] as const).filter(
    (id) => posee(PAGE, id, reponses) !== undefined,
  );

export const fait = (reponses: Reponses) => faits(reponses).fait_convocation;
