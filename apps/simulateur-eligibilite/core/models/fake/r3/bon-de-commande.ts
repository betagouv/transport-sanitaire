// Le bon de commande du modèle de démonstration : son DTO, et comment la
// commande se traduit en DTO. Où chaque entrée va dans le gabarit est dans
// `front/models/fake/bon-de-commande.ts`.
//
// Le DTO parle en mots clairs (`avec_lait`). Les instructions sont suivies de
// la remarque.

import type { CerfaMapping, GivenAnswer } from "../../../socle/index.ts";
import type { Questions } from "../questions/reponses.ts";
import { given } from "../questions/reponses.ts";
import { enUneLigne } from "./adresse.ts";

export type BonDeCommande = {
  fields: {
    commande: string;
    nombre_de_tasses: string;
    date: string;
    adresse_de_facturation?: string;
    avec_lait: boolean;
    avec_sucre: boolean;
    avec_citron: boolean;
    instructions?: string;
  };
  drawings: { au_nom_de?: string };
};

export const VERS_LE_BON_DE_COMMANDE: CerfaMapping<BonDeCommande> = {
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
        remarque: reponse("remarque"),
      })
      .compute(instructionsDe),
  },
  drawings: { au_nom_de: reponse("nom").compute(({ value }) => value) },
};

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
  readonly [Id in "lieu" | "retrait" | "jour" | "remarque"]: GivenAnswer<
    Questions[Id]
  >;
};

// Le lieu, le retrait et le jour, une fois tous trois donnés, puis la remarque.
function instructionsDe(service: Service): string | Incomplet {
  const { lieu, retrait, jour, remarque } = service;
  if (!lieu.hasAnswer() || !retrait.hasAnswer() || !jour.hasAnswer())
    return undefined;
  const servie = `Servie ${LIEUX[lieu.value]}, ${RETRAITS[retrait.value]}, le ${enFrancais(jour.value)}`;
  return remarque.hasAnswer() ? `${servie}. ${remarque.value}` : servie;
}

// Un jour `AAAA-MM-JJ`, écrit à la française : « 14/10/2026 ».
function enFrancais(jour: string): string {
  const [annee, mois, date] = jour.split("-");
  return `${date}/${mois}/${annee}`;
}
