import { describe, expect, it } from "vitest";
import { DecisionDiagram } from "../../../core/socle/decision-engine/decision-diagram";
import {
  DecisionGraph,
  type FaitValue,
} from "../../../core/socle/decision-engine/decision-graph";
import { decisionGraphOf } from "../../../core/socle/decision-engine/publicodes";

// Le graphe restreint aux faits qu'on sait déjà (#255) : il vaut ce que vaut
// le graphe entier, et ne teste plus que les faits qu'on ne sait pas.

const DONNEES = decisionGraphOf({
  fait_pluie: { titre: "Il pleut" },
  fait_vent: { titre: "Il vente" },
  fait_froid: { titre: "Il fait froid" },
  cible_tempete: { "toutes ces conditions": ["fait_pluie", "fait_vent"] },
  cible_sortie: {
    "applicable si": "fait_froid",
    valeur: {
      variations: [
        { si: "cible_tempete", alors: "'RESTER'" },
        { si: "fait_vent", alors: "'COURTE'" },
        { sinon: "'LONGUE'" },
      ],
    },
  },
});
const [PLUIE, VENT, FROID] = ["fait_pluie", "fait_vent", "fait_froid"].map(
  (nom) => DONNEES.faits.indexOf(nom),
) as [number, number, number];
const REPONSES: readonly FaitValue[] = [true, false, undefined];

describe("le graphe restreint", () => {
  it("garde les numéros des nœuds du graphe", () => {
    expect(DecisionDiagram.of(DONNEES).nodes).toEqual(DONNEES.nodes);
  });

  it("vaut ce que vaut le graphe entier, pour chaque fait fixé", () => {
    const diagramme = DecisionDiagram.of(DONNEES);
    const entier = new DecisionGraph(DONNEES);
    for (const pluie of REPONSES) {
      const id = diagramme.restrict(
        DONNEES.rules.cible_sortie as number,
        new Map([[PLUIE, pluie]]),
      );
      const restreint = graphe(diagramme, id);
      for (const vent of REPONSES) {
        for (const froid of REPONSES) {
          const faits = {
            fait_pluie: pluie,
            fait_vent: vent,
            fait_froid: froid,
          };
          expect(restreint.valueOf("racine", faits)).toEqual(
            entier.valueOf("cible_sortie", faits),
          );
        }
      }
    }
  });

  it("ne teste plus les faits fixés, ni ceux dont il ne dépend plus", () => {
    const diagramme = DecisionDiagram.of(DONNEES);
    const sortie = DONNEES.rules.cible_sortie as number;
    expect(diagramme.testedFaits(sortie)).toEqual(
      new Set([PLUIE, VENT, FROID]),
    );
    // Sans froid, on ne sort pas : la pluie et le vent ne changent plus rien.
    const sansFroid = diagramme.restrict(sortie, new Map([[FROID, false]]));
    expect(diagramme.testedFaits(sansFroid)).toEqual(new Set());
    const sansPluie = diagramme.restrict(sortie, new Map([[PLUIE, false]]));
    expect(diagramme.testedFaits(sansPluie)).toEqual(new Set([VENT, FROID]));
  });
});

// ---- implémentation ----

function graphe(diagramme: DecisionDiagram, racine: number): DecisionGraph {
  return new DecisionGraph({
    faits: DONNEES.faits,
    rules: { racine },
    nodes: diagramme.nodes,
  });
}
