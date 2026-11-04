// Les réponses et les données que partagent les tests des cerfa de R3 : des
// parcours complets, P3 comprise, lus comme le socle les lit au résultat.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDict, PDFDocument } from "pdf-lib";
import { model } from "../../../../core/models/eligibilite";
import type { Cibles } from "../../../../core/models/eligibilite/cibles/noms";
import type { Faits } from "../../../../core/models/eligibilite/faits/noms";
import type { Questions } from "../../../../core/models/eligibilite/questions/reponses";
import { SEEDS } from "../../../../core/models/eligibilite/seeds-catalogue";
import { cibleValues } from "../../../../core/socle/decision-engine";
import {
  type Answers,
  pagesOf,
  Questionnaire,
  type Read,
  readIn,
} from "../../../../core/socle/questionnaire-engine";

import {
  preconisationOf,
  resultScope,
} from "../../../../core/socle/simulation";

import type { Rubrique } from "../../../../front/models/eligibilite/r3/rubriques/rubrique";
import type { Cerfa, CerfaDto } from "../../../../front/socle/cerfa/cerfa";
import { generateCerfa } from "../../../../front/socle/cerfa/generate-the-cerfa/generate-the-cerfa";
import { racine } from "../../../inspection-des-sources";
import {
  MATERNITE_ETABLIE,
  MATERNITE_PAR_Q221,
} from "../p2/reponses-de-la-branche";
import { PLUSIEURS_PERMISSIONS } from "../p2/reponses-de-la-permission";
import {
  ciblesValant,
  type ValeursDesCibles,
} from "../r2/traces-du-prescripteur";

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
  "Q3.1.3": 2,
  "Q3.2.nom": "Hôpital Necker",
  "Q3.2.adresse": HOPITAL,
  "Q3.3.nature": "1_DOMICILE",
  "Q3.3.adresse": DOMICILE,
  "Q3.6.2": "2_NON",
};

// Ce que Q3.8 recueille de la maternité.
export const Q38: Reponses = {
  "Q3.8.maternite.nom": "Maternité du Parc",
  "Q3.8.maternite.adresse": EHPAD,
  "Q3.8.niveau": "2_TYPE_IIA",
};

// Un examen de l'Engagement maternité, du domicile à l'hébergement que P2
// établit, sans Q3.8.
export const EXAMEN_DE_MATERNITE: Reponses = {
  ...MATERNITE_ETABLIE,
  "Q2.12": "2_NON",
  "Q3.1.1": 1,
  "Q3.1.2": "1_ALLER",
  "Q3.2.nature": "1_DOMICILE",
  "Q3.2.adresse": DOMICILE,
  "Q3.3.adresse": HOPITAL,
  "Q3.4.a": "2_NON",
  "Q3.6.2": "2_NON",
};

// Une consultation signalant la maternité éloignée, pour l'hébergement du
// dispositif : il n'est ni le départ ni l'arrivée. Sans Q3.8.
export const HEBERGEMENT_DE_MATERNITE: Reponses = {
  ...MATERNITE_PAR_Q221,
  "Q2.14.eloignement": ["1_PLUS_DE_QUARANTE_CINQ_MINUTES"],
  "Q2.14.motif": ["2_HEBERGEMENT_ENGAGEMENT"],
  "Q2.12": "2_NON",
  "Q3.1.1": 1,
  "Q3.1.2": "1_ALLER",
  "Q3.2.nature": "1_DOMICILE",
  "Q3.2.adresse": DOMICILE,
  "Q3.3.nature": "7_CABINET",
  "Q3.3.nom": "Cabinet du docteur Martin",
  "Q3.3.adresse": HOPITAL,
  "Q3.4.a": "2_NON",
  "Q3.6.2": "2_NON",
};

/**
 * Ce que le socle passe au cerfa : la lecture des questions validées, avec les
 * cibles et les faits que les règles calculent, sauf ceux que le test choisit.
 */
export function donnees(
  reponses: Reponses,
  choisies: ValeursDesCibles = {},
  completedAt = new Date("2026-10-22T10:00:00Z"),
  faits: Partial<Faits> = {},
): Read {
  const preconisation = preconisationOf(model, reponses);
  const cibles = ciblesValant({
    ...cibleValues(preconisation.cibles as Cibles),
    ...choisies,
  });
  const lecture = new Questionnaire<Questions>(PAGES).readWith(
    reponses,
    cibles,
  );
  return readIn(
    resultScope({
      validated: lecture.validated,
      faits: { ...(preconisation.faits as Faits), ...faits },
      cibles,
      on: completedAt,
    }),
  );
}

/** Chaque cellule de la rubrique, calculée sur ces données. */
export function cellules<Cellules>(
  rubrique: Rubrique<Cellules>,
  reponses: Reponses,
  cibles: ValeursDesCibles = {},
  completedAt?: Date,
): Cellules {
  const read = donnees(reponses, cibles, completedAt);
  return Object.fromEntries(
    Object.entries<Rubrique<Cellules>[keyof Cellules]>(rubrique).map(
      ([cellule, valeur]) => [cellule, read(valeur)],
    ),
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
