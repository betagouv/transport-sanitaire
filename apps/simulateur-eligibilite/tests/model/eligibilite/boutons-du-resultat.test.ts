// Les boutons de R2 (#137) : pour chacune des dix issues, le libellé de
// l'action qui complète. « Précédent » et « Nouvelle
// simulation » sont ceux du socle, et se testent à l'écran.

import { describe, expect, it } from "vitest";
import { libelleDeCompletion } from "../../../front/models/eligibilite/boutons-du-resultat";
import { catalogueResultats } from "../../../front/models/eligibilite/catalogue-resultats";
import { CIBLES_ENUMEREES } from "../../../front/models/eligibilite/declarations/cibles";
import { trace } from "./traces-du-praticien";

type Issue = (typeof CIBLES_ENUMEREES.cible_issue_id)[number];

const PRESCRIPTION = "Compléter la prescription";
const DEMANDE = "Compléter la demande";

const BOUTONS: Readonly<Record<Issue, string | null>> = {
  ISSUE_PMT: PRESCRIPTION,
  ISSUE_DAP_SANS_URGENCE: PRESCRIPTION,
  ISSUE_DAP_URGENCE_ATTESTEE: PRESCRIPTION,
  ISSUE_S3141: PRESCRIPTION,
  ISSUE_NON_ELIGIBLE: null,
  ISSUE_CAISSE: null,
  ISSUE_ETABLISSEMENT: null,
  ISSUE_PERMISSION_PATIENT: null,
  ISSUE_CONVOCATION: null,
  ISSUE_DAP_ETRANGER_A_EXAMINER: DEMANDE,
};

const ciblesDe = (issue: Issue | undefined | null) =>
  trace({ cible_issue_id: issue }).cibles;

describe("les boutons de chaque issue", () => {
  it("couvre les dix issues des règles", () => {
    expect(Object.keys(BOUTONS).sort()).toEqual(
      [...CIBLES_ENUMEREES.cible_issue_id].sort(),
    );
  });

  it.each(Object.entries(BOUTONS))("%s complète, ou non", (issue, attendu) => {
    expect(libelleDeCompletion(ciblesDe(issue as Issue))).toBe(attendu);
  });

  it.each([
    ["sans issue", undefined],
    ["sans objet", null],
  ])("%s, rien à compléter", (_cas, issue) => {
    expect(libelleDeCompletion(ciblesDe(issue))).toBeNull();
  });

  it("« Compléter la demande » est le libellé du catalogue de l'éditeur", async () => {
    const catalogue = await catalogueResultats();
    expect(libelleDeCompletion(ciblesDe("ISSUE_DAP_ETRANGER_A_EXAMINER"))).toBe(
      catalogue.issues.ISSUE_DAP_ETRANGER_A_EXAMINER.completeLabel,
    );
  });
});
