// Les questions d'un lieu du trajet, départ (Q3.2) ou arrivée (Q3.3)
// (QST-LIEUX-TROIS-CATEGORIES-20261105) : sa catégorie, sur la page d'arrivée
// le côté de l'USLD ou de l'EHPAD de Q2.6, puis la nature d'un autre lieu, le
// nom, le service, l'adresse. Ce que P2 établit se rappelle sans se redemander
// (`conditions/lieux-du-trajet.ts`). Aucune distance ne se compare aux
// adresses.

import type {
  Address,
  Answered,
  Condition,
  Value,
} from "../../../../../socle/index.ts";
import { NATURES_DU_LIEU } from "../../p2/conditions/natures-du-lieu.ts";
import { type Context as Contexte, given, question } from "../../question.ts";
import {
  CATEGORIES,
  type Categorie,
  type NonChoisie,
  natureEnLettres,
} from "../conditions/categories-du-lieu.ts";
import {
  aLEtranger,
  type Choix,
  type Extremite,
  type Lieu,
  lieuDu,
  lieuxContrairesAQ26,
  natureDuLieuChoisi,
} from "../conditions/lieux-du-trajet.ts";
import {
  desRolesContradictoires,
  ENTREES_DES_LIEUX,
  entreesDe,
} from "../conditions/roles-dans-le-sens.ts";
import { avecUnDocument } from "../conditions/supports-du-complement.ts";
import {
  CHAMPS_DU_LIEU,
  categorieAChoisir,
  type Etat,
  natureAChoisir,
  nomDuLieu,
  precisionDuLieu,
  type Rappel,
  serviceDuLieu,
} from "./champs-du-lieu.ts";
import { cotesDesStructures } from "./cotes-du-lieu.ts";

/** Les libellés propres à un lieu. */
export type Libelles = { categorie: string; adresse: string; rappel: string };

/** Le lieu de départ : ses questions, et ce que l'arrivée en lit. */
export function lieuDeDepart(libelles: Libelles) {
  const lieu = ENTREES_DES_LIEUX.compute((entrees) =>
    lieuDu("depart", entrees),
  );
  const categorie = categorieAChoisir("depart", libelles.categorie, lieu);
  const lecture = lectureDu(categorie, (contexte) =>
    lieuDu("depart", entreesDe(contexte.answers)),
  );
  const categorieDuLieu = categorieRetenue(lieu, categorie);
  const choix = categorieDuLieu.compute(
    (depart): Choix => ({ categories: { depart } }),
  );
  return {
    categorie,
    ...champsDuLieu("depart", libelles, choix, lecture),
    categorieDuLieu,
    categorieLue: lecture.categorieLue,
  };
}

/**
 * Le lieu d'arrivée, après le départ, dont il lit la catégorie et l'adresse.
 * Sa page porte le côté de l'USLD et de l'EHPAD, une fois les deux catégories
 * connues.
 */
export function lieuDArrivee(
  libelles: Libelles,
  depart: ReturnType<typeof lieuDeDepart>,
) {
  const lieu = ENTREES_DES_LIEUX.computeWith(depart.categorieDuLieu, (e, d) =>
    lieuDu("arrivee", e, d),
  );
  const categorie = categorieAChoisir("arrivee", libelles.categorie, lieu);
  const lecture = lectureDu(categorie, (contexte) =>
    lieuDu(
      "arrivee",
      entreesDe(contexte.answers),
      depart.categorieLue(contexte),
    ),
  );
  const categorieDuLieu = categorieRetenue(lieu, categorie);
  const cotes = cotesDeLArrivee(depart, categorieDuLieu);
  const champs = champsDuLieu("arrivee", libelles, cotes.choix, lecture);
  return {
    categorie,
    usld: cotes.usld,
    ehpad: cotes.ehpad,
    ...champs,
    adresse: champs.adresse.inconsistentWhen(
      memeAdresseQue(depart.adresse, champs.adresse),
      "Le départ et l’arrivée ont la même adresse : ce trajet n’existe pas. Corrigez l’une des deux.",
    ),
    categorieDuLieu,
    choix: cotes.choix,
  };
}

// ---- implémentation ----

// Les côtés de l'USLD et de l'EHPAD, une fois les deux catégories connues.
function cotesDeLArrivee(
  depart: ReturnType<typeof lieuDeDepart>,
  categorieDuLieu: Value<Categorie | NonChoisie>,
) {
  return cotesDesStructures(
    depart.categorieDuLieu.computeWith(
      categorieDuLieu,
      (d, arrivee): Choix => ({ categories: { depart: d, arrivee } }),
    ),
  );
}

// Ce que les champs lisent du lieu dans un contexte.
type Lecture = {
  readonly lire: (contexte: Contexte) => Lieu;
  readonly categorieLue: (contexte: Contexte) => Categorie | NonChoisie;
};

// Les champs après la catégorie. La nature du lieu tient compte de ce que les
// catégories et les côtés ont dit.
function champsDuLieu<E extends Extremite>(
  extremite: E,
  libelles: Libelles,
  choix: Value<Choix>,
  lecture: Lecture,
) {
  const etat: Etat = {
    categorie: choix.compute(({ categories }) => categories?.[extremite]),
    nature: natureDuLieuChoisi(extremite, choix),
  };
  const sur = (champ: Champ) => rappelSur(champ, lecture, libelles.rappel);
  const nature = natureAChoisir(extremite, etat, sur("nature"));
  const htnm = etat.nature
    .compute((n) => n === "5_HEBERGEMENT_NON_MEDICALISE")
    .or(given.question(nature).answer().is("1_HTNM"));
  return {
    nature,
    precision: precisionDuLieu(extremite, etat, nature, sur("nature")),
    nom: nomDuLieu(
      extremite,
      { ...etat, htnm },
      lecture.categorieLue,
      sur("nom"),
    ),
    service: serviceDuLieu(extremite, etat),
    adresse: adresseDuLieu(extremite, libelles.adresse, sur("adresse")),
    natureDuLieu: etat.nature,
    htnm,
  };
}

// L'adresse. Celle du départ dit les lieux que P2 contredit.
function adresseDuLieu<E extends Extremite>(
  extremite: E,
  label: string,
  rappel: Rappel,
) {
  const adresse = question
    .address(CHAMPS_DU_LIEU[extremite].adresse, label)
    .mattersWhile(avecUnDocument)
    .abroadIf(({ answers }) => aLEtranger(extremite, answers))
    .reminderFrom(rappel);
  return extremite === "depart"
    ? adresse
        .inconsistentWhen(
          ROLES_CONTRADICTOIRES,
          "Les réponses précédentes donnent au départ ou à l’arrivée deux lieux différents. Revenez par « Précédent » pour les corriger.",
        )
        .inconsistentWhen(
          CONTRAIRES_A_Q26,
          "Les lieux contredisent le type de structure établi en Q2.6 : corriger le trajet.",
        )
    : adresse;
}

// Deux situations de P2 se contredisent sur un lieu (TS1014-AUDIT-02).
const ROLES_CONTRADICTOIRES = ENTREES_DES_LIEUX.compute(
  desRolesContradictoires,
);

// L'USLD ou l'EHPAD de Q2.6 n'a sa place à aucun des deux lieux.
const CONTRAIRES_A_Q26 = ENTREES_DES_LIEUX.compute(lieuxContrairesAQ26);

// Le champ qui porte le rappel : le premier que la catégorie pose.
type Champ = "nature" | "nom" | "adresse";

// Le rappel ne vaut que pour une catégorie certaine : ce que P2 établit, sinon
// la nature que Q2.6 place, sinon la catégorie seule possible.
function rappelSur(champ: Champ, { lire }: Lecture, label: string): Rappel {
  return (contexte) => {
    const lieu = lire(contexte);
    if (lieu.fixee === undefined || premierChamp(lieu) !== champ)
      return undefined;
    const value =
      lieu.etablie?.rappel ??
      (lieu.nature ? NATURES_DU_LIEU[lieu.nature] : CATEGORIES[lieu.fixee]);
    return [{ label, value }];
  };
}

function premierChamp({ fixee, nature }: Lieu): Champ {
  if (fixee === "1_DOMICILE") return "adresse";
  if (fixee === "3_AUTRE_LIEU" && natureEnLettres(nature) === undefined)
    return "nature";
  return "nom";
}

// La catégorie fixée, sinon celle que la question donne.
function categorieRetenue(
  lieu: Value<Lieu>,
  categorie: ReturnType<typeof categorieAChoisir>,
): Value<Categorie | NonChoisie> {
  return lieu.computeWith(
    given.question(categorie).answer(),
    (lu, reponse) => lu.fixee ?? reponse.value,
  );
}

// Le lieu lu dans un contexte, et sa catégorie : fixée, sinon répondue.
function lectureDu(
  categorie: ReturnType<typeof categorieAChoisir>,
  lire: Lecture["lire"],
): Lecture {
  return {
    lire,
    categorieLue: (contexte) =>
      lire(contexte).fixee ?? contexte.answers.question(categorie).value,
  };
}

// Le départ et l'arrivée ont la même adresse.
function memeAdresseQue(
  depart: Answered<Address>,
  arrivee: Answered<Address>,
): Condition {
  return given
    .question(depart)
    .answer()
    .computeWith(given.question(arrivee).answer(), (a, b) =>
      Boolean(a.value && b.value && memeAdresse(a.value, b.value)),
    );
}

function memeAdresse(a: Address, b: Address): boolean {
  const champs = [
    "street",
    "complement",
    "postalCode",
    "city",
    "country",
  ] as const;
  const lu = (adresse: Address, champ: (typeof champs)[number]) =>
    (adresse[champ] ?? "").trim().toLocaleLowerCase("fr");
  return champs.every((champ) => lu(a, champ) === lu(b, champ));
}
