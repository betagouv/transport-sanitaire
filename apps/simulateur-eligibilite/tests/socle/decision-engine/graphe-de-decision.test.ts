import { describe, expect, it } from "vitest";
import { type Cible, Fait } from "../../../core/socle";
import {
  DecisionGraph,
  type FaitValue,
} from "../../../core/socle/decision-engine/decision-graph";
import {
  decisionGraphOf,
  publicodesEngine,
  type Rules,
} from "../../../core/socle/decision-engine/publicodes";

// Le graphe de décision, sur des règles écrites ici : chaque mécanisme que le
// compilateur traduit vaut ce que publicodes calcule, pour chaque façon dont
// les faits valent oui, non ou rien.

const FAITS = ["fait_pluie", "fait_vent", "fait_froid"] as const;

const REGLES: Rules = {
  fait_pluie: { titre: "Il pleut" },
  fait_vent: { titre: "Il vente" },
  fait_froid: { titre: "Il fait froid", type: "booléen" },
  cible_parapluie: { valeur: "fait_pluie" },
  cible_abri: { "une de ces conditions": ["fait_pluie", "fait_vent"] },
  cible_tempete: { "toutes ces conditions": ["fait_pluie", "fait_vent"] },
  cible_meme_temps: { valeur: "fait_pluie = fait_vent" },
  cible_autre_temps: { valeur: "fait_pluie != fait_vent" },
  cible_manteau: {
    variations: [{ si: "fait_froid", alors: "'EPAIS'" }, { sinon: "'LEGER'" }],
  },
  cible_meteo_inconnue: { "est non défini": "fait_pluie" },
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
  cible_terrasse: {
    "non applicable si": "fait_pluie",
    valeur: "fait_froid = non",
  },
};

const REPONSES: readonly FaitValue[] = [true, false, undefined];
const SITUATIONS = FAITS.reduce<Record<string, FaitValue>[]>(
  (situations, fait) =>
    situations.flatMap((s) => REPONSES.map((v) => ({ ...s, [fait]: v }))),
  [{}],
);
const CIBLES = Object.keys(REGLES).filter((nom) => nom.startsWith("cible_"));

const graphe = new DecisionGraph(decisionGraphOf(REGLES));
const moteur = publicodesEngine<Record<string, Fait>, Record<string, Cible>>(
  REGLES,
  CIBLES,
);
const faitsDe = (situation: Record<string, FaitValue>) =>
  Object.fromEntries(
    FAITS.map((fait) => {
      const value = situation[fait];
      if (value === undefined) return [fait, Fait.inconnu("absent")];
      return [fait, value ? Fait.oui("dit") : Fait.non("dit")];
    }),
  );

describe("le graphe de décision", () => {
  it.each(CIBLES)("%s vaut ce que publicodes calcule", (cible) => {
    for (const situation of SITUATIONS) {
      expect(
        graphe.valueOf(cible, situation),
        JSON.stringify(situation),
      ).toEqual(moteur.cible(faitsDe(situation), cible).value);
    }
  });

  it("ne teste que les faits dont la règle dépend", () => {
    expect(faitsTestes("cible_parapluie")).toEqual(["fait_pluie"]);
    expect(faitsTestes("cible_abri")).toEqual(["fait_pluie", "fait_vent"]);
  });

  it("deux règles qui disent la même chose partagent leurs nœuds", () => {
    const { rules } = decisionGraphOf({
      ...REGLES,
      cible_parapluie_aussi: { valeur: "fait_pluie" },
    });
    expect(rules.cible_parapluie_aussi).toBe(rules.cible_parapluie);
  });

  it("s'arrête sur un mécanisme qu'il ne traduit pas, en nommant la règle", () => {
    expect(() =>
      decisionGraphOf({ ...REGLES, cible_total: { somme: [1, 2] } }),
    ).toThrow(/« cible_total »/);
  });

  it("s'arrête sur un fait qui ne vaut pas oui ou non", () => {
    expect(() =>
      decisionGraphOf({
        ...REGLES,
        fait_invites: { titre: "Nombre d'invités", type: "nombre" },
      }),
    ).toThrow(/« fait_invites » est de type « nombre »/);
  });
});

// ---- implémentation ----

function faitsTestes(rule: string): string[] {
  const { faits, rules, nodes } = decisionGraphOf(REGLES);
  const testes = new Set<string>();
  const visit = (id: number) => {
    const node = nodes[id];
    if (!Array.isArray(node)) return;
    const [fait, ...suivants] = node as readonly number[];
    testes.add(faits[fait ?? -1] ?? "");
    suivants.forEach(visit);
  };
  visit(rules[rule] ?? -1);
  return [...testes].sort();
}
