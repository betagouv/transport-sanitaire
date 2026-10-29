// Les questions du modèle de démonstration, le type de la réponse de chacune,
// et le libellé de chaque option.

import type { Address } from "../../../socle/index.ts";

export type Questions = {
  boisson: "the" | "cafe" | "rien";
  accompagnements: readonly (
    | "lait"
    | "sucre"
    | "citron"
    | "citron-a-voir"
    | "aucun"
  )[];
  service: readonly (
    | "chaude"
    | "glacee"
    | "grande-tasse"
    | "preparation"
    | "rien"
  )[];
  "quelle-preparation": "comptoir" | "table";
  quantite: number;
  lieu: "salle" | "terrasse" | "comptoir";
  nom: string;
  ticket: boolean;
  couvercle: boolean;
  facturation: "france" | "etranger";
  adresse: Address;
  expedition: Address;
  debut: string;
  fin: string;
  retrait: "sur-place" | "a-emporter" | "livraison";
  jour: string;
  remarque: string;
};

/** Le libellé de chaque option, par question à choix. */
export const OPTIONS = {
  boisson: { the: "Un thé", cafe: "Un café", rien: "Rien" },
  accompagnements: {
    lait: "Du lait",
    sucre: "Du sucre",
    citron: "Une rondelle de citron",
    "citron-a-voir": "Peut-être du citron, à décider au service",
    aucun: "Rien de plus",
  },
  service: {
    chaude: "Très chaude",
    glacee: "Glacée",
    "grande-tasse": "Dans une grande tasse",
    preparation: "Avec une préparation particulière",
    rien: "Rien de particulier",
  },
  "quelle-preparation": {
    comptoir: "Préparée au comptoir",
    table: "Préparée à table, devant vous",
  },
  lieu: { salle: "En salle", terrasse: "En terrasse", comptoir: "Au comptoir" },
  facturation: { france: "En France", etranger: "À l'étranger" },
  retrait: {
    "sur-place": "Sur place",
    "a-emporter": "À emporter",
    livraison: "En livraison",
  },
} as const;
