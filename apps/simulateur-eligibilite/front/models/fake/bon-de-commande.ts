// Le bon de commande du modèle de démonstration : son DTO, où chaque entrée va
// dans le gabarit, et comment la commande se traduit en DTO.
//
// Le DTO parle en mots clairs (`avec_lait`). Le gabarit, lui, range les trois
// accompagnements sous un même nom de champ, `acc` : comme les cases groupées
// de la DAP, ils se marquent par un dessin.

import {
  bindCerfa,
  type Cerfa,
  type CerfaInput,
  type CerfaMapping,
  drawnBox,
  templateAt,
  text,
} from "../../socle";
import gabarit from "./bon-de-commande.pdf?url";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import type { Questions } from "./declarations/questions";

type BonDeCommande = {
  fields: {
    commande: string;
    nombre_de_tasses: string;
    date: string;
    avec_lait: boolean;
    avec_sucre: boolean;
    avec_citron: boolean;
  };
};

const BON_DE_COMMANDE: Cerfa<BonDeCommande> = {
  template: templateAt(gabarit),
  fileName: "bon-de-commande",
  fields: {
    commande: text("commande"),
    nombre_de_tasses: text("quantite"),
    date: text("date"),
    avec_lait: drawnBox("acc", "lait"),
    avec_sucre: drawnBox("acc", "sucre"),
    avec_citron: drawnBox("acc", "citron"),
  },
};

const VERS_LE_BON_DE_COMMANDE: CerfaMapping<
  BonDeCommande,
  CerfaInput<Questions, Faits, Cibles>
> = {
  fields: {
    commande: ({ cibles }) => cibles.commande,
    nombre_de_tasses: ({ answers }) => String(answers.quantite),
    date: ({ completedAt }) => enFrancais(completedAt),
    avec_lait: ({ faits }) => faits.lait.value === true,
    avec_sucre: ({ answers }) =>
      answers.accompagnements?.includes("sucre") === true,
    avec_citron: ({ faits }) => faits.citron.value === true,
  },
};

/** Le bon de commande, lié à la traduction de la commande. */
export const bonDeCommande = bindCerfa(
  BON_DE_COMMANDE,
  VERS_LE_BON_DE_COMMANDE,
);

// ---- implémentation ----

// Le jour de la commande, à Paris : « 14/10/2026 ».
function enFrancais(date: Date): string {
  return date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
}
