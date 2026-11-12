// La finalité de soins au-delà de 150 km, rejouée en faits : les cas du test
// post-audit de l'éditeur (`tests/post_audit_20261110.mjs` du paquet v10.1.8).
//
// Ils partent de sa base : tous les faits à « non », P1 et P2 complètes,
// l'urgence répondue, plus de 50 et plus de 150 km, et la finalité inconnue.
// Chaque cas dit l'issue, et si la finalité reste à demander : c'est ce que
// `cible_finalite_longue_distance_decisive` porte.

import { describe, expect, it } from "vitest";
import { type Changements, preconiser } from "./faits-de-l-oracle";

const LONGUE: Changements = {
  fait_urgence_repondue: true,
  fait_distance_plus_50: true,
  fait_distance_plus_150: true,
  fait_finalite_soins_longue_distance: undefined,
};

const ALD_LIEE: Changements = {
  fait_ald_liee: true,
  fait_ald_exonerante_3_ou_4: true,
};

const CAS: readonly [
  label: string,
  faits: Changements,
  issue: string | null,
  aDemander: boolean,
][] = [
  [
    "150 km exactement",
    { ...LONGUE, fait_distance_plus_150: false },
    "ISSUE_NON_ELIGIBLE",
    false,
  ],
  ["longue distance seule et finalité inconnue", LONGUE, null, true],
  [
    "Oui : soin approprié sans ALD",
    { ...LONGUE, fait_finalite_soins_longue_distance: true },
    "ISSUE_DAP_SANS_URGENCE",
    false,
  ],
  [
    "Non : visite sans motif distinct",
    { ...LONGUE, fait_finalite_soins_longue_distance: false },
    "ISSUE_NON_ELIGIBLE",
    false,
  ],
  [
    "événement sans soin déjà prouvé",
    { ...LONGUE, fait_evenement_sans_soin: true },
    "ISSUE_NON_ELIGIBLE",
    false,
  ],
  [
    "convocation qualifiée : règle de procédure conservée",
    { ...LONGUE, fait_convocation: true },
    "ISSUE_DAP_SANS_URGENCE",
    false,
  ],
  [
    "permission qualifiée : règle de procédure conservée",
    {
      ...LONGUE,
      fait_permission: true,
      fait_permission_mineur_admissible: true,
    },
    "ISSUE_DAP_SANS_URGENCE",
    false,
  ],
  [
    "Engagement maternité indépendant",
    { ...LONGUE, fait_dap_maternite: true },
    "ISSUE_DAP_SANS_URGENCE",
    false,
  ],
  [
    "ALD liée déjà qualifiée",
    { ...LONGUE, ...ALD_LIEE },
    "ISSUE_DAP_SANS_URGENCE",
    false,
  ],
  [
    "priorité établissement",
    { ...LONGUE, fait_hospitalisation: true, fait_transfert_article80: true },
    "ISSUE_ETABLISSEMENT",
    false,
  ],
  [
    "exclusion prouvée",
    { ...LONGUE, fait_exclusion_transport_prouvee: true },
    "ISSUE_NON_ELIGIBLE",
    false,
  ],
  [
    "traitement en série déjà confirmé",
    { ...LONGUE, fait_serie_qualifiante: true },
    "ISSUE_DAP_SANS_URGENCE",
    false,
  ],
  [
    "autre DAP et droit indépendant",
    { ...LONGUE, ...ALD_LIEE, fait_avion_bateau_ligne: true },
    "ISSUE_DAP_SANS_URGENCE",
    false,
  ],
];

describe("la finalité de soins au-delà de 150 km, en faits", () => {
  it.each(CAS)("%s", (_label, faits, issue, aDemander) => {
    const valeurs = preconiser(faits);
    expect(valeurs.cible_issue_id ?? null).toBe(issue);
    expect(valeurs.cible_finalite_longue_distance_decisive).toBe(aDemander);
  });

  it("un simple séjour ne prouve pas la finalité", () => {
    expect(
      preconiser({ ...LONGUE, fait_hospitalisation: true })
        .cible_finalite_soins_longue_distance_etablie,
    ).toBe(false);
  });
});
