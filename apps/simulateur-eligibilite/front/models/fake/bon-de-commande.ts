// Le bon de commande du modèle de démonstration : son DTO, où chaque entrée va
// dans le gabarit, et comment la commande se traduit en DTO.
//
// Le DTO parle en mots clairs (`avec_lait`). Le gabarit, lui, range les trois
// accompagnements sous un même nom de champ, `acc` : comme les cases groupées
// de la DAP, ils se marquent par un dessin. La remarque est le commentaire
// facultatif des instructions : elle les suit dans leur cadre, et s'en retire
// si elle n'y tient pas. Le nom du client n'a pas de champ : il se dessine dans
// son cadre.

import type { Questions } from "../../../core/models/fake/declarations/questions";
import { given } from "../../../core/models/fake/question";
import type { GivenAnswer } from "../../../core/socle";
import {
  at,
  bindCerfa,
  type Cerfa,
  type CerfaMapping,
  commentOn,
  drawnBox,
  templateAt,
  text,
} from "../../socle";
import { enUneLigne } from "./adresse";
import gabarit from "./bon-de-commande.pdf?url";

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

const VERS_LE_BON_DE_COMMANDE: CerfaMapping<BonDeCommande> = {
  fields: {
    commande: given.cible("commande").compute(({ value }) => String(value)),
    nombre_de_tasses: reponse("quantite").compute(({ value }) => String(value)),
    date: given.today().compute((jour) => enFrancais(jour.day() ?? "")),
    adresse_de_facturation: reponse("adresse").compute((adresse) =>
      adresse.hasAnswer() ? enUneLigne(adresse.value) : undefined,
    ),
    avec_lait: given.fait("lait").isOui(),
    avec_sucre: reponse("accompagnements").checked("sucre"),
    avec_citron: given.fait("citron").isOui(),
    instructions: given
      .all({
        lieu: reponse("lieu"),
        retrait: reponse("retrait"),
        jour: reponse("jour"),
      })
      .compute(instructionsDe),
    remarque: reponse("remarque").compute(({ value }) => value),
  },
  drawings: { au_nom_de: reponse("nom").compute(({ value }) => value) },
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

/** Les trois réponses ne sont pas toutes données. */
type Incomplet = undefined;

function reponse<Id extends keyof Questions & string>(id: Id) {
  return given.question(id).answer();
}

type Service = {
  readonly [Id in "lieu" | "retrait" | "jour"]: GivenAnswer<Questions[Id]>;
};

// Le lieu, le retrait et le jour, une fois tous trois donnés.
function instructionsDe({ lieu, retrait, jour }: Service): string | Incomplet {
  if (!lieu.hasAnswer() || !retrait.hasAnswer() || !jour.hasAnswer())
    return undefined;
  return `Servie ${LIEUX[lieu.value]}, ${RETRAITS[retrait.value]}, le ${enFrancais(jour.value)}`;
}

// Un jour `AAAA-MM-JJ`, écrit à la française : « 14/10/2026 ».
function enFrancais(jour: string): string {
  const [annee, mois, date] = jour.split("-");
  return `${date}/${mois}/${annee}`;
}
