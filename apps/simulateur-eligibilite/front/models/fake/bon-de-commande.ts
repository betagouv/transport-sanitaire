// Le bon de commande du modèle de démonstration : son DTO, où chaque entrée va
// dans le gabarit, et comment la commande se traduit en DTO.
//
// Le DTO parle en mots clairs (`avec_lait`). Le gabarit, lui, range les trois
// accompagnements sous un même nom de champ, `acc` : comme les cases groupées
// de la DAP, ils se marquent par un dessin. La remarque est le commentaire
// facultatif des instructions : elle les suit dans leur cadre, et s'en retire
// si elle n'y tient pas. Le nom du client n'a pas de champ : il se dessine dans
// son cadre.

import type { GivenAnswers } from "../../../core/socle";
import {
  at,
  bindCerfa,
  type Cerfa,
  type CerfaInput,
  type CerfaMapping,
  commentOn,
  drawnBox,
  templateAt,
  text,
} from "../../socle";
import { enUneLigne } from "./adresse";
import gabarit from "./bon-de-commande.pdf?url";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import type { Questions } from "./declarations/questions";

type BonDeCommande = {
  fields: {
    commande: string;
    nombre_de_tasses: string;
    date: string;
    adresse_de_facturation?: string;
    avec_lait: boolean;
    avec_sucre: boolean;
    avec_citron: boolean;
    instructions?: string;
    remarque?: string;
  };
  drawings: { au_nom_de?: string };
};

const BON_DE_COMMANDE: Cerfa<BonDeCommande> = {
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
    instructions: text("instructions"),
    remarque: commentOn("instructions"),
  },
  drawings: { au_nom_de: at({ page: 1, x: 36, y: 174, width: 348 }) },
};

const VERS_LE_BON_DE_COMMANDE: CerfaMapping<
  BonDeCommande,
  CerfaInput<Questions, Faits, Cibles>
> = {
  fields: {
    commande: ({ cibles }) => cibles.commande,
    nombre_de_tasses: ({ answers }) =>
      String(answers.question("quantite").value),
    date: ({ completedAt }) => enFrancais(completedAt),
    adresse_de_facturation: ({ answers }) => {
      const adresse = answers.question("adresse");
      return adresse.hasAnswer() ? enUneLigne(adresse.value) : undefined;
    },
    avec_lait: ({ faits }) => faits.lait.value === true,
    avec_sucre: ({ answers }) =>
      answers.question("accompagnements").checked("sucre"),
    avec_citron: ({ faits }) => faits.citron.value === true,
    instructions: ({ answers }) => instructionsDe(answers),
    remarque: ({ answers }) => answers.question("remarque").value,
  },
  drawings: { au_nom_de: ({ answers }) => answers.question("nom").value },
};

/** Le bon de commande, lié à la traduction de la commande. */
export const bonDeCommande = bindCerfa(
  BON_DE_COMMANDE,
  VERS_LE_BON_DE_COMMANDE,
);

// ---- implémentation ----

const LIEUX: Record<Questions["lieu"], string> = {
  salle: "en salle",
  terrasse: "en terrasse",
  comptoir: "au comptoir",
};

const RETRAITS: Record<Questions["retrait"], string> = {
  "sur-place": "sur place",
  "a-emporter": "à emporter",
  livraison: "en livraison",
};

// Le lieu, le retrait et le jour, une fois tous trois donnés.
function instructionsDe(answers: GivenAnswers<Questions>): string | undefined {
  const lieu = answers.question("lieu");
  const retrait = answers.question("retrait");
  const jour = answers.question("jour");
  if (!lieu.hasAnswer() || !retrait.hasAnswer() || !jour.hasAnswer())
    return undefined;
  return `Servie ${LIEUX[lieu.value]}, ${RETRAITS[retrait.value]}, le ${enFrancais(new Date(jour.value))}`;
}

// Le jour, à Paris : « 14/10/2026 ».
function enFrancais(date: Date): string {
  return date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
}
