// Chaque situation ne se découvre qu'à un endroit (QST-COLLECTE-UNIQUE,
// D-272) : Q2.1 ne dit que le motif général, les situations particulières se
// cochent en Q2.2.1 et Q2.2.1.b, quel que soit ce motif. Seule l'entrée en
// établissement (Q2.1.g) retire le séjour, sans rappel (TS1012-01).

import { describe, expect, it } from "vitest";
import type { Questions } from "../../../../core/models/eligibilite/questions/reponses";
import {
  CONSULTATION,
  faits,
  posee,
  proposees,
  type Reponses,
  valeurs,
} from "./reponses-des-contextes";

const avec = (motif: Questions["Q2.1"]): Reponses => ({
  ...CONSULTATION,
  "Q2.1": motif,
  "Q2.2.1": ["0_AUCUNE"],
  "Q2.2.1.b": ["0_AUCUN"],
});

const MOTIFS = [
  "1_CONSULTATION",
  "2_DENTISTE_OU_SAGE_FEMME",
  "3_IMAGERIE",
  "4_BIOLOGIE",
  "5_PARAMEDICAL",
  "7_PSYCHOLOGUE",
  "9_TRANSFERT",
  "14_AUTRE",
] as const;

describe("une seule place par situation", () => {
  it.each(MOTIFS)(
    "après Q2.1 = %s, Q2.2.1 propose ses six situations",
    (motif) => {
      expect(proposees("Q2.2.1", avec(motif))).toEqual([
        "1_HOSPITALISATION",
        "2_ETRANGER",
        "14_EXAMEN_MATERNITE",
        "15_HEBERGEMENT_MATERNITE",
        "5_HTNM",
        "10_RETOUR_PENITENTIAIRE",
      ]);
    },
  );

  it.each(MOTIFS)(
    "après Q2.1 = %s, Q2.2.1.b propose ses cinq situations",
    (motif) => {
      expect(proposees("Q2.2.1.b", avec(motif))).toEqual([
        "1_ATMP",
        "6_CAMSP",
        "7_SAMSAH",
        "9_PENSION_MILITAIRE",
        "13_CONVOCATION",
      ]);
    },
  );

  it("une entrée en hospitalisation retire le séjour, sans rappel", () => {
    const entree = {
      ...avec("8_HOSPITALISATION"),
      "Q2.1.g": "1_ENTREE",
    } as const;
    expect(proposees("Q2.2.1", entree)).not.toContain("1_HOSPITALISATION");
    expect(posee("Q2.2.1", entree)?.reminder).toBeUndefined();
    expect(faits(entree).fait_transfert_article80.value).toBeUndefined();
  });

  // Choisir l'autre motif ne nie rien : seul un bloc validé, où la case est
  // proposée et non cochée, donne « non ».
  it("l'autre motif laisse absentes les situations de Q2.2.1 et Q2.2.1.b", () => {
    const { "Q2.2.1": _, "Q2.2.1.b": __, ...sansBlocs } = avec("14_AUTRE");
    expect(
      valeurs(sansBlocs, [
        "fait_permission",
        "fait_motif_camsp",
        "fait_convocation",
        "fait_dap_maternite",
        "fait_htnm_hors_maternite",
      ]),
    ).toEqual(Array(5).fill(undefined));
  });
});
