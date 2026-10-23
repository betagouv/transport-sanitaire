import { describe, expect, it } from "vitest";
import { Cible, Fait } from "../../../core/socle";
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
  cible_parapluie: Cible<boolean>;
  cible_abri: Cible<boolean>;
  cible_table: Cible<"GRANDE" | "PETITE">;
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
      cible_parapluie: Cible.of(true),
      cible_abri: Cible.of(true),
      cible_table: Cible.of("GRANDE"),
    });
  });

  it("lit un fait faux comme un « non »", () => {
    expect(
      moteur
        .cibles({ ...SOIREE, fait_pluie: etabli(false) })
        .cible_parapluie.isNon(),
    ).toBe(true);
  });

  it("compare un fait numérique à un seuil", () => {
    expect(
      moteur
        .cibles({ ...SOIREE, fait_invites: invites(2) })
        .cible_table.is("PETITE"),
    ).toBe(true);
  });

  it("donne une cible sans objet quand elle ne s'applique pas", () => {
    expect(
      moteur
        .cibles({ ...SOIREE, fait_pret: etabli(false) })
        .cible_table.isSansObjet(),
    ).toBe(true);
  });

  it("calcule une seule cible sur demande", () => {
    expect(moteur.cible(SOIREE, "cible_table")).toEqual(Cible.of("GRANDE"));
  });

  it("ne garde rien d'un calcul à l'autre", () => {
    moteur.cibles(SOIREE);
    expect(
      moteur
        .cible({ ...SOIREE, fait_pluie: etabli(false) }, "cible_parapluie")
        .isNon(),
    ).toBe(true);
  });
});

// Un fait a trois états : vrai, faux, ou absent. Absent, il n'est pas envoyé
// aux règles, et ne vaut jamais « non ».
describe("un fait absent", () => {
  it("laisse inconnue la cible qui en dépend", () => {
    expect(
      moteur
        .cibles({ ...SOIREE, fait_pluie: ABSENT })
        .cible_parapluie.isInconnue(),
    ).toBe(true);
  });

  it("ne vaut pas « non » : un « non » décide, lui", () => {
    const sansVent = { ...SOIREE, fait_pluie: etabli(false) };
    expect(moteur.cible(sansVent, "cible_abri").isNon()).toBe(true);
    const abri = moteur.cible({ ...sansVent, fait_vent: ABSENT }, "cible_abri");
    expect(abri.isInconnue()).toBe(true);
    expect(abri.isNon()).toBe(false);
  });

  it("n'empêche pas de décider, quand un autre fait suffit", () => {
    expect(
      moteur.cible({ ...SOIREE, fait_vent: ABSENT }, "cible_abri").isOui(),
    ).toBe(true);
  });

  it("ne donne pas une cible sans objet : inconnue n'est pas sans objet", () => {
    const table = moteur.cibles({ ...SOIREE, fait_pret: ABSENT }).cible_table;
    expect(table.isInconnue()).toBe(true);
    expect(table.isSansObjet()).toBe(false);
  });
});
