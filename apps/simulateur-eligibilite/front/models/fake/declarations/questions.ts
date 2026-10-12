// Les questions du modèle de démonstration, et le type de la réponse de chacune.

export type Questions = {
  boisson: "the" | "cafe" | "rien";
  accompagnements: readonly ("lait" | "sucre" | "citron" | "aucun")[];
  quantite: number;
  nom: string;
};
