// Ce que Q2.1 indique déjà se retire des situations particulières, sans
// rappel (D-98, TS1012-01), bloc par bloc (D-252).

import { describe, expect, it } from "vitest";
import {
  CONSULTATION,
  DU_SEJOUR,
  faits,
  posee,
  proposees,
  type Reponses,
  valeurs,
} from "./reponses-des-contextes";

describe("ce que Q2.1 indique déjà (D-98)", () => {
  const avec = (reponses: Reponses): Reponses => ({
    ...CONSULTATION,
    ...reponses,
    "Q2.2.1": ["0_AUCUNE"],
    "Q2.2.1.b": ["0_AUCUN"],
  });

  it("une permission retire le séjour et écarte le transfert", () => {
    const permission = avec({ "Q2.1": "11_PERMISSION" });
    expect(proposees("Q2.2.1", permission)).not.toContain("1_HOSPITALISATION");
    expect(valeurs(permission, DU_SEJOUR)).toEqual([
      false,
      false,
      true,
      undefined,
      undefined,
    ]);
  });

  it("une permission se retire sans rappel (TS1012-01)", () => {
    const question = posee("Q2.2.1", avec({ "Q2.1": "11_PERMISSION" }));
    expect(question?.reminder).toBeUndefined();
    expect(faits(avec({ "Q2.1": "11_PERMISSION" })).fait_permission.value).toBe(
      true,
    );
  });

  it("une entrée en hospitalisation retire le séjour", () => {
    const entree = avec({ "Q2.1": "8_HOSPITALISATION", "Q2.1.g": "1_ENTREE" });
    expect(proposees("Q2.2.1", entree)).not.toContain("1_HOSPITALISATION");
    expect(faits(entree).fait_transfert_article80.value).toBeUndefined();
  });

  it.each([
    ["10_CAMSP", "Q2.2.1.b", ["6_CAMSP"]],
    ["12_CONVOCATION", "Q2.2.1.b", ["13_CONVOCATION"]],
    ["13_MATERNITE", "Q2.2.1", ["4_MATERNITE_ELOIGNEE", "5_HTNM"]],
  ] as const)("%s retire de %s %j", (motif, id, retires) => {
    const offertes = proposees(id, avec({ "Q2.1": motif }));
    expect(offertes).toHaveLength(5 - retires.length);
    for (const retire of retires) expect(offertes).not.toContain(retire);
  });

  it("« Aucune » ne touche pas au CAMSP que Q2.1 prouve", () => {
    const camsp = avec({ "Q2.1": "10_CAMSP" });
    expect(faits(camsp).fait_motif_camsp.value).toBe(true);
  });

  // La maternité attend Q2.14. Le même trajet ne peut pas être un HTNM hors
  // maternité : les options 4 et 5 s'excluent.
  it("« Aucune » laisse absente la maternité indiquée en Q2.1, et écarte le HTNM", () => {
    const maternite = avec({ "Q2.1": "13_MATERNITE" });
    expect(
      valeurs(maternite, ["fait_dap_maternite", "fait_htnm_hors_maternite"]),
    ).toEqual([undefined, false]);
  });
});
