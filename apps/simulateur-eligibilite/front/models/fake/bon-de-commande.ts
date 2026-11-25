// Le bon de commande du modèle de démonstration côté écran : où chaque entrée
// de son DTO va dans le gabarit. Ce que vaut chaque entrée est dans
// `core/models/fake/r3/bon-de-commande.ts`.
//
// Le gabarit range les trois accompagnements sous un même nom de champ, `acc` :
// comme les cases groupées de la DAP, ils se marquent par un dessin. Les
// instructions sont un texte strict : s'il ne tient pas, le client le réécrit
// avant tout téléchargement. Le nom du client n'a pas de champ : il se dessine
// dans son cadre.

import type { BonDeCommande } from "../../../core/models/fake/r3/bon-de-commande";
import { type Cerfa, CerfaFactory, templateAt } from "../../socle";
import gabarit from "./bon-de-commande.pdf?url";

const { at, drawnBox, strictText, text } = CerfaFactory;

export const BON_DE_COMMANDE: Cerfa<BonDeCommande> = {
  template: templateAt(gabarit),
  fileName: "bon-de-commande",
  fields: {
    commande: text("commande"),
    nombre_de_tasses: text("quantite"),
    date: text("date"),
    adresse_de_facturation: text("adresse"),
    avec_lait: drawnBox("acc", "lait"),
    avec_sucre: drawnBox("acc", "sucre"),
    avec_citron: drawnBox("acc", "citron"),
    instructions: strictText("instructions", "Instructions"),
  },
  drawings: { au_nom_de: at({ page: 1, x: 36, y: 174, width: 348 }) },
};
