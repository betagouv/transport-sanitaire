// Les questions du modèle factice et le type de la réponse de chacune. Leurs
// options sont déclarées avec elles, dans le questionnaire.

export type Questions = {
  boisson: "the" | "cafe" | "rien";
  accompagnements: readonly ("lait" | "sucre" | "aucun")[];
  quantite: number;
};
