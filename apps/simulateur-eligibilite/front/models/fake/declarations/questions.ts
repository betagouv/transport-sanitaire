// Les questions du modèle de démonstration, et le type de la réponse de chacune.

export type Questions = {
  boisson: "the" | "cafe" | "rien";
  accompagnements: readonly ("lait" | "sucre" | "citron" | "aucun")[];
  quantite: number;
  lieu: "salle" | "terrasse" | "comptoir";
  nom: string;
  retrait: "sur-place" | "a-emporter" | "livraison";
  jour: string;
  remarque: string;
};
