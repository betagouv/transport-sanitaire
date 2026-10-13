// Les questions du modèle de démonstration, et le type de la réponse de chacune.

import type { Address } from "../../../socle";

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
  quantite: number;
  lieu: "salle" | "terrasse" | "comptoir";
  nom: string;
  facturation: "france" | "etranger";
  adresse: Address;
  retrait: "sur-place" | "a-emporter" | "livraison";
  jour: string;
  remarque: string;
};
