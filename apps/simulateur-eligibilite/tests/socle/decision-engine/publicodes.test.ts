import { describe, expect, it } from "vitest";
import { Fait } from "../../../core/socle";
import { publicodesEngine } from "../../../core/socle/decision-engine/publicodes";

// Le moteur de décision, sur des règles écrites ici : il ne connaît celles
// d'aucun modèle.

type Faits = {
  fait_pluie: Fait;
  fait_vent: Fait;
  fait_invites: Fait<number>;
  fait_pret: Fait;
};
type Cibles = {
  cible_parapluie: boolean | null;
  cible_abri: boolean | null;
  cible_table: string | null;
};

const REGLES = {
  fait_pluie: { titre: "Il pleut" },
  fait_vent: { titre: "Il vente" },
  fait_invites: { titre: "Nombre d'invités", type: "nombre" },
  fait_pret: { titre: "Tout est prêt" },
  cible_parapluie: { valeur: "fait_pluie" },
  cible_abri: { "une de ces conditions": ["fait_pluie", "fait_vent"] },
  cible_table: {
    "applicable si": "fait_pret",
    valeur: {
      variations: [
        { si: "fait_invites >= 6", alors: "'GRANDE'" },
        { sinon: "'PETITE'" },
      ],
    },
  },
};

const moteur = publicodesEngine<Faits, Cibles>(REGLES, [
  "cible_parapluie",
  "cible_abri",
  "cible_table",
]);

const etabli = (value: boolean) =>
  value ? Fait.oui("dit par l'hôte") : Fait.non("dit par l'hôte");
const invites = (nombre: number) => Fait.valant(nombre, "dit par l'hôte");
const ABSENT = Fait.inconnu("personne ne l'a dit");
const SOIREE: Faits = {
  fait_pluie: etabli(true),
  fait_vent: etabli(false),
  fait_invites: invites(8),
  fait_pret: etabli(true),
};

describe("le moteur de décision publicodes", () => {
  it("donne chaque cible demandée", () => {
    expect(moteur.cibles(SOIREE)).toEqual({
      cible_parapluie: true,
      cible_abri: true,
      cible_table: "GRANDE",
    });
  });

  it("lit un fait faux comme un « non »", () => {
    expect(
      moteur.cibles({ ...SOIREE, fait_pluie: etabli(false) }).cible_parapluie,
    ).toBe(false);
  });

  it("compare un fait numérique à un seuil", () => {
    expect(
      moteur.cibles({ ...SOIREE, fait_invites: invites(2) }).cible_table,
    ).toBe("PETITE");
  });

  it("rend `null` pour une cible qui ne s'applique pas", () => {
    expect(
      moteur.cibles({ ...SOIREE, fait_pret: etabli(false) }).cible_table,
    ).toBeNull();
  });

  it("rend une seule cible sur demande", () => {
    expect(moteur.cible(SOIREE, "cible_table")).toBe("GRANDE");
  });

  it("ne garde rien d'un calcul à l'autre", () => {
    moteur.cibles(SOIREE);
    expect(
      moteur.cible({ ...SOIREE, fait_pluie: etabli(false) }, "cible_parapluie"),
    ).toBe(false);
  });
});

// Un fait a trois états : vrai, faux, ou absent. Absent, il n'est pas envoyé
// aux règles, et ne vaut jamais « non ».
describe("un fait absent", () => {
  it("laisse indéfinie la cible qui en dépend", () => {
    expect(
      moteur.cibles({ ...SOIREE, fait_pluie: ABSENT }).cible_parapluie,
    ).toBeUndefined();
  });

  it("ne vaut pas « non » : un « non » décide, lui", () => {
    const sansVent = { ...SOIREE, fait_pluie: etabli(false) };
    expect(moteur.cible(sansVent, "cible_abri")).toBe(false);
    expect(
      moteur.cible({ ...sansVent, fait_vent: ABSENT }, "cible_abri"),
    ).toBeUndefined();
  });

  it("n'empêche pas de décider, quand un autre fait suffit", () => {
    expect(moteur.cible({ ...SOIREE, fait_vent: ABSENT }, "cible_abri")).toBe(
      true,
    );
  });

  it("ne rend pas une cible sans objet : indéfinie n'est pas `null`", () => {
    expect(
      moteur.cibles({ ...SOIREE, fait_pret: ABSENT }).cible_table,
    ).toBeUndefined();
  });
});
