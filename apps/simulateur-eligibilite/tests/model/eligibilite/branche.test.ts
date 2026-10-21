// La page de branche (Q2.12 à Q2.14) : quand chaque question se pose, ce
// qu'elle établit, et l'issue qui en résulte. `CATALOGUE_COMPLET_QUESTIONS.md`
// Q2.12, Q2.13 et Q2.14, `CONTRAT_REPONSES_FAITS.json` et
// `CONTRAT_NEGATIONS_PROUVEES.json` du paquet de l'éditeur (D-110).

import { describe, expect, it } from "vitest";
import {
  ciblesDe,
  ENTREE,
  faits,
  HTNM,
  incoherences,
  MATERNITE,
  MATERNITE_ETABLIE,
  MATERNITE_PAR_Q221B,
  p2Complete,
  posees,
} from "./reponses-de-la-branche";
import { PATIENT_SEUL } from "./reponses-de-la-permission";

const PERMISSION_A_CHARGE_DU_PATIENT = {
  ...MATERNITE_PAR_Q221B,
  "Q2.1": "11_PERMISSION",
  "Q2.7": "4_ADULTE_A_SA_CHARGE",
  "Q2.7.a": "1_OUI",
} as const;

const GROUPES = ["Q2.14.eloignement", "Q2.14.motif"];

describe("Q2.14, les deux groupes de l'Engagement maternité", () => {
  it("se posent quand Q2.1 dit la maternité éloignée", () => {
    expect(posees(MATERNITE)).toEqual(GROUPES);
  });

  it("se posent quand Q2.2.1.b signale la maternité éloignée", () => {
    expect(posees(MATERNITE_PAR_Q221B)).toEqual(GROUPES);
  });

  it("ne se posent pas sans maternité", () => {
    expect(posees(PATIENT_SEUL)).toEqual([]);
  });

  it("ne se posent pas quand une orientation prioritaire est établie", () => {
    expect(posees(PERMISSION_A_CHARGE_DU_PATIENT)).toEqual([]);
  });

  // La maternité signalée reste « à qualifier », mais la permission à la
  // charge du patient suffit à l'issue (point 2, v10.1.3).
  it("donne alors la permission à la charge du patient", () => {
    expect(p2Complete(PERMISSION_A_CHARGE_DU_PATIENT)).toBe(true);
    expect(ciblesDe(PERMISSION_A_CHARGE_DU_PATIENT).cible_issue_id).toBe(
      "ISSUE_PERMISSION_PATIENT",
    );
  });

  it("attendent leurs réponses : sans elles, P2 n'est pas complète et aucune issue ne vaut", () => {
    expect(faits(MATERNITE).fait_dap_maternite.value).toBeUndefined();
    expect(p2Complete(MATERNITE)).toBeUndefined();
    expect(ciblesDe(MATERNITE).cible_issue_id).toBeUndefined();
  });

  it("un seul groupe répondu laisse le dispositif inconnu", () => {
    const reponses = {
      ...MATERNITE,
      "Q2.14.eloignement": ["1_PLUS_DE_QUARANTE_CINQ_MINUTES"],
    } as const;
    expect(faits(reponses).fait_dap_maternite.value).toBeUndefined();
  });
});

describe("Q2.14, une condition dans chaque groupe : le dispositif est établi", () => {
  it("établit la maternité ; Q2.1 = 13 écarte le HTNM hors maternité", () => {
    expect(faits(MATERNITE_ETABLIE).fait_dap_maternite.value).toBe(true);
    expect(faits(MATERNITE_ETABLIE).fait_htnm_hors_maternite.value).toBe(false);
  });

  it("les autres conditions l'établissent aussi", () => {
    const reponses = {
      ...MATERNITE,
      "Q2.14.eloignement": ["2_COMMUNE_DESIGNEE_PAR_L_ARS"],
      "Q2.14.motif": ["2_HEBERGEMENT_ENGAGEMENT"],
    } as const;
    expect(faits(reponses).fait_dap_maternite.value).toBe(true);
  });

  it("dévoile l'urgence (Q2.12), que la page du trajet avait masquée", () => {
    expect(posees(MATERNITE)).not.toContain("Q2.12");
    expect(posees(MATERNITE_ETABLIE)).toEqual([...GROUPES, "Q2.12"]);
  });

  it("sans l'urgence, la décision n'est pas calculable", () => {
    expect(p2Complete(MATERNITE_ETABLIE)).toBeUndefined();
    expect(ciblesDe(MATERNITE_ETABLIE).cible_issue_id).toBeUndefined();
  });

  it("urgence non attestée (Q2.12) : demande d'accord préalable sans urgence", () => {
    const reponses = { ...MATERNITE_ETABLIE, "Q2.12": "2_NON" } as const;
    expect(ciblesDe(reponses).cible_issue_id).toBe("ISSUE_DAP_SANS_URGENCE");
    expect(p2Complete(reponses)).toBe(true);
  });

  it("urgence attestée (Q2.12) : point à la caisse, Engagement maternité", () => {
    const reponses = { ...MATERNITE_ETABLIE, "Q2.12": "1_OUI" } as const;
    const cibles = ciblesDe(reponses);
    expect(cibles.cible_issue_id).toBe("ISSUE_CAISSE");
    expect(cibles.cible_reason_code).toBe("CNAM_ENGAGEMENT_MATERNITE_URGENCE");
  });

  it("ne repose pas l'urgence que le trajet a déjà posée", () => {
    const longue = {
      ...MATERNITE_ETABLIE,
      "Q2.3.1": "3_PLUS_DE_CENT_CINQUANTE_KM",
      "Q2.3.3": "2_NON",
      "Q2.3.4": "2_NON",
    } as const;
    expect(posees(longue)).toEqual(GROUPES);
    expect(ciblesDe(longue).cible_issue_id).toBe("ISSUE_DAP_SANS_URGENCE");
  });

  it("un groupe passé à « Aucune » retire Q2.12", () => {
    const reponses = { ...MATERNITE_ETABLIE, "Q2.12": "2_NON" } as const;
    expect(posees({ ...reponses, "Q2.14.motif": ["3_AUCUNE"] })).not.toContain(
      "Q2.12",
    );
  });
});

describe("Q2.14, « Aucune » dans un groupe : le dispositif est écarté", () => {
  const sansEloignement = {
    ...MATERNITE,
    "Q2.14.eloignement": ["3_AUCUNE"],
  } as const;

  it("aucun éloignement : le motif ne se pose plus", () => {
    expect(posees(sansEloignement)).toEqual(["Q2.14.eloignement"]);
    expect(faits(sansEloignement).fait_dap_maternite.value).toBe(false);
  });

  it("aucun motif : le dispositif est écarté", () => {
    const reponses = {
      ...MATERNITE,
      "Q2.14.eloignement": ["1_PLUS_DE_QUARANTE_CINQ_MINUTES"],
      "Q2.14.motif": ["3_AUCUNE"],
    } as const;
    expect(faits(reponses).fait_dap_maternite.value).toBe(false);
  });

  // Ce n'est plus une contradiction avec Q2.1 (D-129) : la patiente va à la
  // maternité, sans en remplir les conditions.
  it("après Q2.1 = 13, rien ne bloque : P2 est complète", () => {
    expect(incoherences("Q2.14.eloignement", sansEloignement)).toEqual([]);
    expect(p2Complete(sansEloignement)).toBe(true);
    expect(ciblesDe(sansEloignement).cible_issue_id).toBe("ISSUE_NON_ELIGIBLE");
  });

  it("signalée en Q2.2.1.b, sans autre motif : P2 est complète", () => {
    const reponses = {
      ...MATERNITE_PAR_Q221B,
      "Q2.14.eloignement": ["3_AUCUNE"],
    } as const;
    expect(faits(reponses).fait_dap_maternite.value).toBe(false);
    expect(p2Complete(reponses)).toBe(true);
  });
});

describe("le HTNM hors Engagement maternité (Q2.2.1.b, point 11)", () => {
  it("point à la caisse, sans question sur la page de branche", () => {
    const cibles = ciblesDe(HTNM);
    expect(faits(HTNM).fait_htnm_hors_maternite.value).toBe(true);
    expect(faits(HTNM).fait_htnm_segment_verifie.value).toBe(false);
    expect(posees(HTNM)).toEqual([]);
    expect(cibles.cible_issue_id).toBe("ISSUE_CAISSE");
    expect(cibles.cible_reason_code).toBe("CNAM_HTNM_HORS_MATERNITE");
  });
});

describe("Q2.13, le départ d'une entrée en établissement", () => {
  it("se pose pour une entrée dont le transfert reste à qualifier", () => {
    expect(posees(ENTREE)).toEqual(["Q2.13.depart"]);
    expect(ciblesDe(ENTREE).cible_issue_id).toBeUndefined();
  });

  it("ne se pose pas pour une sortie, déjà qualifiée", () => {
    const sortie = { ...ENTREE, "Q2.1.g": "2_SORTIE" } as const;
    expect(posees(sortie)).toEqual([]);
  });

  it.each([
    "1_DOMICILE",
    "5_HEBERGEMENT_NON_MEDICALISE",
    "6_ETABLISSEMENT_PENITENTIAIRE",
  ] as const)(
    "départ « %s » : entrée simple, hors de l'article 80",
    (depart) => {
      const reponses = { ...ENTREE, "Q2.13.depart": depart };
      expect(faits(reponses).fait_transfert_article80.value).toBe(false);
      expect(p2Complete(reponses)).toBe(true);
      expect(faits(reponses).fait_centre15_interetablissements.value).toBe(
        false,
      );
      expect(ciblesDe(reponses).cible_issue_id).toBe("ISSUE_PMT");
    },
  );

  it.each([
    "2_ETABLISSEMENT_DE_SANTE",
    "3_EHPAD",
    "4_USLD",
    "7_AUTRE_LIEU",
  ] as const)(
    "départ « %s » : le transfert reste à qualifier, la caisse tranche",
    (depart) => {
      const reponses = { ...ENTREE, "Q2.13.depart": depart };
      const cibles = ciblesDe(reponses);
      expect(faits(reponses).fait_transfert_article80.value).toBeUndefined();
      expect(cibles.cible_issue_id).toBe("ISSUE_CAISSE");
      expect(cibles.cible_reason_code).toBe("AUTRE_DROIT_NON_VERIFIABLE");
    },
  );
});

describe("la page de branche", () => {
  it("n'est pas posée sur un trajet ordinaire", () => {
    expect(posees(PATIENT_SEUL)).toEqual([]);
  });
});
