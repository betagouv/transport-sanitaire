// Les réponses et les lectures que partagent les tests de la branche (Q2.12,
// Q2.13 et Q2.14) et de la fin de P2.

import {
  ciblesDe,
  faits,
  posee,
  type Reponses,
  SANS_SITUATION,
} from "./reponses-de-la-permission";

export { ciblesDe, faits, type Reponses };

// Un patient seul, dont l'hébergement de la maternité est coché en Q2.2.1 :
// les deux groupes de Q2.14 se posent.
export const MATERNITE: Reponses = {
  ...SANS_SITUATION,
  "Q2.2.1": ["15_HEBERGEMENT_MATERNITE"],
};

// L'examen du 8ᵉ ou du 9ᵉ mois coché en Q2.2.1 : il est le motif, seul
// l'éloignement se pose (D-272).
export const EXAMEN: Reponses = {
  ...SANS_SITUATION,
  "Q2.2.1": ["14_EXAMEN_MATERNITE"],
};

// L'examen, avec un éloignement coché : le dispositif est établi.
export const MATERNITE_ETABLIE: Reponses = {
  ...EXAMEN,
  "Q2.14.eloignement": ["1_PLUS_DE_QUARANTE_CINQ_MINUTES"],
};

// Une consultation, avec l'hébergement de la maternité coché en Q2.2.1.
export const MATERNITE_PAR_Q221: Reponses = {
  ...MATERNITE,
  "Q2.1": "1_CONSULTATION",
};

// Une consultation, avec un hébergement temporaire non médicalisé en Q2.2.1.
export const HTNM: Reponses = {
  ...MATERNITE_PAR_Q221,
  "Q2.2.1": ["5_HTNM"],
};

// Une entrée en établissement de santé : le transfert reste à qualifier.
export const ENTREE: Reponses = {
  ...SANS_SITUATION,
  "Q2.1": "8_HOSPITALISATION",
  "Q2.1.g": "1_ENTREE",
};

// Le brancard prouve le motif, 20 km, sans autre situation : l'issue la plus
// courte de P2, sans page de branche.
export const BRANCARD_20_KM: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "3_AVEC_UN_PROFESSIONNEL",
  "Q1.2": ["8_BRANCARDAGE"],
  "Q1.3": ["7_AUCUNE"],
  "Q2.2.1": ["0_AUCUNE"],
  "Q2.2.1.b": ["0_AUCUN"],
  "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
  "Q2.3.2": false,
};

const PAGE = "P2/branche";

type Id = "Q2.12" | "Q2.13.depart" | "Q2.14.eloignement" | "Q2.14.motif";

/** Les ids posés sur la page de branche, dans l'ordre de la page. */
export const posees = (reponses: Reponses) =>
  (
    ["Q2.13.depart", "Q2.14.eloignement", "Q2.14.motif", "Q2.12"] as const
  ).filter((id: Id) => posee(PAGE, id, reponses) !== undefined);

export const incoherences = (id: Id, reponses: Reponses) =>
  posee(PAGE, id, reponses)?.inconsistencies ?? [];

export const p2Complete = (reponses: Reponses) =>
  faits(reponses).fait_p2_complete.value;
