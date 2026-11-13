// Les champs d'un lieu du trajet, après sa catégorie
// (QST-LIEUX-TROIS-CATEGORIES-20261105, DOC-LIEUX-TROIS-CATEGORIES-20261105) :
// la nature d'un autre lieu quand rien ne la prouve, son nom, le service d'une
// structure de soins. `lieu.ts` les assemble.

import type { Answered, Condition, Value } from "../../../../../socle/index.ts";
import type { Nature } from "../../p2/conditions/natures-du-lieu.ts";
import { Q2_2_1 } from "../../p2/questions/q2-2-1.ts";
import { Q2_14_MOTIF } from "../../p2/questions/q2-14.ts";
import { type Context as Contexte, given, question } from "../../question.ts";
import {
  CATEGORIES,
  type Categorie,
  HTNM,
  type NonChoisie,
  natureEnLettres,
} from "../conditions/categories-du-lieu.ts";
import type { Extremite, Lieu } from "../conditions/lieux-du-trajet.ts";
import {
  avecUnDocument,
  uneDap,
} from "../conditions/supports-du-complement.ts";

/** Ce que les champs savent du lieu à leur place sur la page. */
export type Etat = {
  readonly categorie: Value<Categorie | undefined>;
  readonly nature: Value<Nature | undefined>;
};

/** La catégorie du lieu : sa question, et celle que lit la page. */
type Categories = {
  readonly categorie: Answered;
  readonly categorieLue: (contexte: Contexte) => Categorie | NonChoisie;
};

/** Le rappel de ce que P2 établit, sur le champ qui le porte. */
export type Rappel = (
  contexte: Contexte,
) => ReadonlyArray<{ label: string; value: string }> | SansRappel;

/** P2 n'établit rien à rappeler sur ce champ. */
type SansRappel = undefined;

/** Les identifiants des champs de chaque lieu. */
export const CHAMPS_DU_LIEU = {
  depart: {
    categorie: "Q3.2.categorie",
    nature: "Q3.2.nature",
    precision: "Q3.2.precision",
    nom: "Q3.2.nom",
    service: "Q3.2.service",
    adresse: "Q3.2.adresse",
  },
  arrivee: {
    categorie: "Q3.3.categorie",
    nature: "Q3.3.nature",
    precision: "Q3.3.precision",
    nom: "Q3.3.nom",
    service: "Q3.3.service",
    adresse: "Q3.3.adresse",
  },
} as const;

/**
 * La catégorie, parmi celles que P2 et l'autre lieu laissent. Une seule
 * possible se fixe sans se demander ; aucune, et l'adresse dit la contradiction.
 */
export function categorieAChoisir<E extends Extremite>(
  extremite: E,
  label: string,
  lieu: Value<Lieu>,
) {
  return (Object.keys(CATEGORIES) as Categorie[]).reduce(
    (declaree, categorie) =>
      declaree.option(categorie, (option) =>
        option.offeredWhen(
          lieu.compute(({ categories }) => categories.includes(categorie)),
        ),
      ),
    question
      .singleChoice(CHAMPS_DU_LIEU[extremite].categorie, label)
      .options(CATEGORIES)
      .dropdown()
      .mattersWhile(
        avecUnDocument.and(
          lieu.compute(({ categories }) => categories.length > 1),
        ),
      ),
  );
}

/**
 * La nature d'un autre lieu qu'aucune réponse ne prouve, sur une DAP : le
 * HTNM, ou une autre à préciser.
 */
export function natureAChoisir<E extends Extremite>(
  extremite: E,
  etat: Etat,
  rappel: Rappel,
) {
  return question
    .singleChoice(CHAMPS_DU_LIEU[extremite].nature, "Nature du lieu")
    .options({ "1_HTNM": HTNM, "2_AUTRE": "Autre nature à préciser" })
    .mattersWhile(avecUnDocument.and(uneDap).and(aPreciser(etat)))
    .reminderFrom(rappel);
}

/** La nature en toutes lettres, quand rien ne la prouve ni ne la choisit. */
export function precisionDuLieu<E extends Extremite>(
  extremite: E,
  etat: Etat,
  choix: ReturnType<typeof natureAChoisir<E>>,
  rappel: Rappel,
) {
  const autre = given.question(choix).answer();
  return question
    .text(CHAMPS_DU_LIEU[extremite].precision, "Nature du lieu")
    .labelFrom(({ answers }) =>
      answers.question(choix).is("2_AUTRE")
        ? "Précisez la nature du lieu"
        : "Nature du lieu",
    )
    .hintFrom(({ answers }) =>
      answers.question(Q2_14_MOTIF).checked("2_HEBERGEMENT_ENGAGEMENT") ||
      answers.question(Q2_2_1).checked("15_HEBERGEMENT_MATERNITE")
        ? "Par exemple : hôtel, maison d’accueil hospitalière ou hébergement chez un proche."
        : "Par exemple : hôtel, hébergement chez un proche ou autre lieu.",
    )
    .mattersWhile(
      avecUnDocument
        .and(aPreciser(etat))
        .and(uneDap.not().or(autre.is("2_AUTRE"))),
    )
    .reminderFrom((contexte) =>
      contexte.answers.question(choix).value === undefined
        ? rappel(contexte)
        : undefined,
    );
}

/**
 * Le nom d'une structure de soins ou d'un autre lieu. Il est obligatoire pour
 * une structure, et pour le HTNM d'une DAP. Il appartient à sa catégorie : en
 * changer l'efface, et y revenir ne le rend pas (02 § Q3.2/Q3.3, SQ-26).
 */
export function nomDuLieu<E extends Extremite>(
  extremite: E,
  etat: Etat & { readonly htnm: Condition },
  { categorie, categorieLue }: Categories,
  rappel: Rappel,
) {
  const structure = estUneStructure(etat);
  return question
    .text(CHAMPS_DU_LIEU[extremite].nom, "Nom du lieu")
    .labelFrom((contexte) =>
      categorieLue(contexte) === "2_STRUCTURE_DE_SOINS"
        ? "Nom de la structure"
        : "Nom du lieu",
    )
    .requiredWhen(structure.or(uneDap.and(etat.htnm)))
    .dependsOn(categorie)
    .mattersWhile(
      avecUnDocument.and(
        etat.categorie.compute(
          (categorie) => categorie !== undefined && categorie !== "1_DOMICILE",
        ),
      ),
    )
    .reminderFrom(rappel);
}

/** Le service d'une structure de soins, facultatif. */
export function serviceDuLieu<E extends Extremite>(extremite: E, etat: Etat) {
  return question
    .text(CHAMPS_DU_LIEU[extremite].service, "Service concerné")
    .optional()
    .mattersWhile(avecUnDocument.and(estUneStructure(etat)));
}

// ---- implémentation ----

// Un autre lieu dont la nature n'est pas prouvée : elle se choisit ou se
// saisit.
function aPreciser({ categorie, nature }: Etat): Condition {
  return categorie.computeWith(
    nature,
    (lue, prouvee) =>
      lue === "3_AUTRE_LIEU" && natureEnLettres(prouvee) === undefined,
  );
}

function estUneStructure({ categorie }: Etat): Condition {
  return categorie.compute((lue) => lue === "2_STRUCTURE_DE_SOINS");
}
