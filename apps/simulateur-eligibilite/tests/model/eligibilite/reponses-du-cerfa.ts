// Les réponses et les données que partagent les tests des cerfa de R3 : des
// parcours complets, P3 comprise, lus comme le socle les lit au résultat.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
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
import type { Donnees } from "../../../front/models/eligibilite/r3/rubriques/rubrique";
import type { Cerfa, CerfaDto } from "../../../front/socle/cerfa/cerfa";
import { generateCerfa } from "../../../front/socle/cerfa/generate-cerfa";
import { racine } from "../../inspection-des-sources";
import { PLUSIEURS_PERMISSIONS } from "./reponses-de-la-permission";
import { ciblesValant, type ValeursDesCibles } from "./traces-du-praticien";

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

// Une PMT pour une dialyse, du domicile au centre, P3 répondue en entier.
export const PMT: Reponses = {
  ...(SEEDS.find(({ id }) => id === "issue-pmt")?.answers as Reponses),
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

/** Le gabarit d'un support, lu sur le disque. */
export const gabarit = (support: string) =>
  readFile(join(racine, `front/models/eligibilite/r3/gabarits/${support}.pdf`));

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

// Toutes les pages du parcours, comme le socle les lit au résultat.
const PAGES = [...pagesOf(model.questionnaire), ...model.complement.pages];
