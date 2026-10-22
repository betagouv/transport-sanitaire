// Les questions du modèle factice, le type de la réponse de chacune, et le
// libellé de chaque option.

export type Questions = {
  boisson: "the" | "cafe" | "rien";
  accompagnements: readonly ("lait" | "sucre" | "aucun")[];
  quantite: number;
};

/** Le libellé de chaque option, par question à choix. */
export const OPTIONS = {
  boisson: { the: "Un thé", cafe: "Un café", rien: "Rien" },
  accompagnements: {
    lait: "Du lait",
    sucre: "Du sucre",
    aucun: "Rien de plus",
  },
} as const;
