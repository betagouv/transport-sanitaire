// La composition du transport d'un résultat (ANA22-04) : ce que le trajet
// combine, dite dans les mots du modèle, et le mode de sa partie terrestre. La
// ligne régulière vient de Q2.3.2, sa partie terrestre de Q2.3.2.terrestre.
// Le mode ne dit que le mode terrestre.

import { describe, expect, it } from "vitest";
import { CompositionDuTransport } from "../../../../core/models/eligibilite/cibles/composition-du-transport.vo";
import { given } from "../../../../core/models/eligibilite/questions/reponses";
import { SEEDS } from "../../../../core/models/eligibilite/seeds-catalogue";
import { luDe, type Reponses } from "../p2/reponses-de-la-permission";

const COMPOSITION = given
  .all({
    support: given.cible("cible_support_id"),
    mode: given.cible("cible_mode_id"),
    ligneReguliere: given.fait("fait_avion_bateau_ligne"),
    partieTerrestre: given
      .question("Q2.3.2.terrestre")
      .answer()
      .compute(CompositionDuTransport.partieTerrestreDe),
  })
  .compute((preuves) => {
    const { composition, modeTerrestre } = CompositionDuTransport.of(preuves);
    return { composition, modeTerrestre };
  });

// Les réponses de la seed.
function reponsesDe(id: string): Reponses {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  return seed.answers as Reponses;
}

// La composition du transport de ces réponses, et son mode terrestre.
const compositionDe = (reponses: Reponses) => luDe(COMPOSITION, reponses);

describe("la composition du transport", () => {
  it("un trajet terrestre seul porte son mode", () => {
    expect(compositionDe(reponsesDe("issue-pmt"))).toEqual({
      composition: "terrestre seule",
      modeTerrestre: "TAP",
    });
  });

  it("la ligne régulière seule n'a pas de mode terrestre", () => {
    expect(compositionDe(reponsesDe("issue-dap-avion-ou-bateau"))).toEqual({
      composition: "ligne régulière seule",
      modeTerrestre: null,
    });
  });

  it("la ligne régulière avec une partie terrestre est mixte, avec le mode de cette partie", () => {
    expect(compositionDe(reponsesDe("issue-dap-trajet-mixte"))).toEqual({
      composition: "mixte",
      modeTerrestre: "TAP",
    });
  });

  it("la ligne régulière sans réponse en Q2.3.2.terrestre reste inconnue, sans mode", () => {
    const { "Q2.3.2.terrestre": _, ...sansReponse } = reponsesDe(
      "issue-dap-avion-ou-bateau",
    );

    expect(compositionDe(sansReponse)).toEqual({
      composition: "inconnue",
      modeTerrestre: null,
    });
  });

  it("un résultat sans support est sans objet, sans mode", () => {
    expect(compositionDe(reponsesDe("issue-caisse"))).toEqual({
      composition: "sans objet",
      modeTerrestre: null,
    });
  });

  it("une réponse de Q2.3.2.terrestre ne change rien sans ligne régulière", () => {
    const reponses = {
      ...reponsesDe("issue-pmt"),
      "Q2.3.2.terrestre": "1_OUI",
    };

    expect(compositionDe(reponses as Reponses)).toEqual({
      composition: "terrestre seule",
      modeTerrestre: "TAP",
    });
  });
});
