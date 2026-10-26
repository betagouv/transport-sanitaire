// Les réponses et les données que partagent les tests des cerfa de R3 : des
// parcours complets, P3 comprise, lus comme le socle les lit au résultat.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDict, PDFDocument } from "pdf-lib";
import { model } from "../../../core/models/eligibilite";
import type { Cibles } from "../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../core/models/eligibilite/declarations/faits";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { cibleValues } from "../../../core/socle/decision-engine/cible";
import { preconisationOf } from "../../../core/socle/model";
import {
  type Answers,
  pagesOf,
} from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import type {
  Donnees,
  Rubrique,
} from "../../../front/models/eligibilite/r3/rubriques/rubrique";
import type { Cerfa, CerfaDto } from "../../../front/socle/cerfa/cerfa";
import { generateCerfa } from "../../../front/socle/cerfa/generate-cerfa";
import { racine } from "../../inspection-des-sources";
import { PLUSIEURS_PERMISSIONS } from "./reponses-de-la-permission";
import { ciblesValant, type ValeursDesCibles } from "./traces-du-prescripteur";

export type Reponses = Answers<Questions>;

export const HOPITAL = {
  street: "149 rue de Sèvres",
  postalCode: "75015",
  city: "Paris",
};
export const DOMICILE = {
  street: "3 rue des Lilas",
  postalCode: "69003",
  city: "Lyon",
};
export const EHPAD = {
  street: "12 avenue Berthelot",
  postalCode: "69007",
  city: "Lyon",
};

// P3 d'une dialyse, du domicile au centre, répondue en entier.
const P3_DE_LA_DIALYSE: Reponses = {
  "Q3.1.1": 1,
  "Q3.1.2": "1_ALLER",
  "Q3.2.nature": "1_DOMICILE",
  "Q3.2.adresse": DOMICILE,
  "Q3.3.nom": "Centre de dialyse",
  "Q3.3.adresse": HOPITAL,
  "Q3.4": "Dialyse",
  "Q3.4.a": "2_NON",
  "Q3.6.2": "2_NON",
  "Q3.7": ["7_AUCUN"],
};

// Une PMT pour une dialyse.
export const PMT: Reponses = {
  ...reponsesDe("issue-pmt"),
  ...P3_DE_LA_DIALYSE,
};

// Une DAP pour une dialyse à plus de 150 km, qui en demande la justification.
export const DAP: Reponses = {
  ...reponsesDe("issue-dap-sans-urgence"),
  ...P3_DE_LA_DIALYSE,
  "Q3.4.distance": "Seul centre équipé pour cette dialyse",
};

// Une demande d'examen d'un transport à l'étranger, P3 de la dialyse.
export const ETRANGER: Reponses = {
  ...reponsesDe("issue-dap-etranger-a-examiner"),
  ...P3_DE_LA_DIALYSE,
};

// Plusieurs permissions : P2 fixe les lieux, de l'établissement au domicile.
export const PERMISSIONS: Reponses = {
  ...PLUSIEURS_PERMISSIONS,
  "Q3.1.3": 4,
  "Q3.2.nom": "Hôpital Necker",
  "Q3.2.adresse": HOPITAL,
  "Q3.3.adresse": DOMICILE,
  "Q3.6.2": "2_NON",
};

/**
 * Ce que le socle passe au cerfa : les cibles que les règles calculent, sauf
 * celles que le test choisit.
 */
export function donnees(
  reponses: Reponses,
  choisies: ValeursDesCibles = {},
  completedAt = new Date("2026-10-22T10:00:00Z"),
): Donnees {
  const preconisation = preconisationOf(model, reponses);
  const cibles = ciblesValant({
    ...cibleValues(preconisation.cibles as Cibles),
    ...choisies,
  });
  const lecture = new Questionnaire<Questions>(PAGES).readWith(
    reponses,
    cibles,
  );
  return {
    answers: lecture.answers,
    validated: lecture.validated,
    cibles,
    faits: preconisation.faits as Faits,
    completedAt,
  };
}

/** Chaque cellule de la rubrique, calculée sur ces données. */
export function cellules<Cellules>(
  rubrique: Rubrique<Cellules>,
  reponses: Reponses,
  cibles: ValeursDesCibles = {},
  completedAt?: Date,
): Cellules {
  const lues = donnees(reponses, cibles, completedAt);
  return Object.fromEntries(
    Object.entries(rubrique.cellules).map(([cellule, calcul]) => [
      cellule,
      (calcul as (donnees: Donnees) => unknown)(lues),
    ]),
  ) as Cellules;
}

/** Le gabarit d'un support, lu sur le disque. */
export const gabarit = (support: string) =>
  readFile(join(racine, `front/models/eligibilite/r3/gabarits/${support}.pdf`));

/** L'abscisse arrondie de chaque case du champ, par état d'export. */
export async function abscisses(
  support: string,
  champ: string,
): Promise<Record<string, number>> {
  const document = await PDFDocument.load(await gabarit(support));
  const widgets = document.getForm().getField(champ).acroField.getWidgets();
  return Object.fromEntries(
    widgets.flatMap((widget) => {
      const normal = widget.getAppearances()?.normal;
      const etats = normal instanceof PDFDict ? normal.keys() : [];
      return etats
        .map((etat) => etat.asString().slice(1))
        .filter((etat) => etat !== "Off")
        .map((etat) => [etat, Math.round(widget.getRectangle().x)]);
    }),
  );
}

/**
 * Le cerfa généré depuis son gabarit lu sur le disque : le navigateur de test
 * ne sert pas les assets de l'app.
 */
export async function genere(
  cerfa: Cerfa<CerfaDto>,
  support: string,
  dto: CerfaDto,
): Promise<Uint8Array> {
  const depuisLeDisque = { ...cerfa, template: () => gabarit(support) };
  const { pdf } = await generateCerfa(depuisLeDisque, dto);
  return new Uint8Array(await pdf.arrayBuffer());
}

// ---- implémentation ----

// Les réponses de P0 à P2 de la seed `id`.
function reponsesDe(id: string): Reponses {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  return seed.answers as Reponses;
}

// Toutes les pages du parcours, comme le socle les lit au résultat.
const PAGES = [...pagesOf(model.questionnaire), ...model.complement.pages];
