// La recette N2 de l'éditeur (#149), réécrite en tests à nous (D-232) : ses
// parcours de `Recette_parcours_N2.json` (v10.1.3), sous leur identifiant chez
// lui. Ne sont repris ici que les cas qu'aucun autre test ne couvre déjà :
// - les quatre profils ALD et mineur, de la réponse au premier résultat, pour
//   les deux besoins de Q0.1 ;
// - les deux paires d'options de Q1.2 qui s'excluent, sur le modèle réel.
//
// Les autres parcours sont couverts ailleurs : le retour à P0, qui garde le
// besoin (`questionnaire-navigation.test.tsx`), et le verrou documentaire,
// sans retour en deçà de P3 (`lock.test.tsx`). Le mécanisme des options qui
// s'excluent est testé sur le modèle factice (`options-incompatibles.test.tsx`).
//
// L'éditeur numérote les options ; nos identifiants gardent son numéro :
// l'option 8 de Q1.2 est `8_BRANCARDAGE`.

import { describe, expect, it } from "vitest";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import type { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { model } from "../../../front/models/eligibilite";
import { texteDeLaFichePositive } from "../../../front/models/eligibilite/r2/fiche-positive/texte-de-la-fiche-positive";
import { traceDuResultat } from "../../../front/models/eligibilite/r2/trace-du-resultat";
import { questionnaireOf } from "../../../front/socle/simulateur/questionnaire-of";
import { badges, catalogue } from "./fiches-du-test";
import {
  ciblesDe,
  lectureDe,
  type Reponses,
} from "./reponses-de-la-permission";

const BESOINS = ["1_VERIFIER", "2_VERIFIER_ET_PRESCRIRE"] as const;

// Un nouveau patient, à 50 km au plus, sans avion ni bateau.
const FIN_DE_P2: Reponses = {
  "Q2.2.1": ["4_AUCUNE"],
  "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
  "Q2.3.2": false,
};

const brancard = (cas: Questions["Q1.3"]): Reponses => ({
  "Q1.1": "3_AVEC_UN_PROFESSIONNEL",
  "Q1.2": ["8_BRANCARDAGE"],
  "Q1.3": cas,
  ...FIN_DE_P2,
});

const PROCHE: Reponses = {
  "Q1.1": "2_AVEC_UN_PROCHE",
  "Q1.3": ["2_ALD"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
  ...FIN_DE_P2,
};

const AMBULANCE = {
  posees: ["Q0.1", "Q1.1", "Q1.2", "Q1.3", "Q2.2.1", "Q2.3.1", "Q2.3.2"],
  mode: "AMBULANCE",
  badges: ["Brancardage ou portage nécessaire"],
  accompagnant: false,
};

const VEHICULE_PERSONNEL = {
  posees: ["Q0.1", "Q1.1", "Q1.3", "Q1.4", "Q2.2.1", "Q2.3.1", "Q2.3.2"],
  mode: "VEHICULE_PERSONNEL",
  badges: [],
  accompagnant: true,
};

const PROFILS = [
  ["ald-brancard", brancard(["2_ALD"]), AMBULANCE],
  ["ald-proche", PROCHE, VEHICULE_PERSONNEL],
  ["mineur-brancard", brancard(["8_MINEUR_SOINS_CONTINUS"]), AMBULANCE],
  [
    "ald-mineur-brancard",
    brancard(["2_ALD", "8_MINEUR_SOINS_CONTINUS"]),
    AMBULANCE,
  ],
] as const;

const lire = (reponses: Reponses) => questionnaireOf(model).readWith(reponses);

const posees = (read: ReturnType<Questionnaire["readWith"]>) =>
  read
    .askedPages()
    .flatMap((page) => read.questionsOn(page).map(({ id }) => id));

const resultat = (reponses: Reponses) => {
  const cibles = ciblesDe(reponses);
  const fiche = texteDeLaFichePositive(
    catalogue,
    traceDuResultat(lectureDe(reponses)),
    "ISSUE_PMT",
  );
  return {
    issue: cibles.cible_issue_id.value,
    mode: cibles.cible_mode_id.value,
    support: cibles.cible_support_id.value,
    financeur: cibles.cible_financeur.value,
    accompagnant: cibles.cible_personne_accompagnante.value,
    badges: badges(fiche),
  };
};

describe("les profils ALD et mineur de la recette N2", () => {
  describe.each(BESOINS)("Q0.1 « %s »", (besoin) => {
    it.each(PROFILS)("%s", (_id, profil, attendu) => {
      const reponses: Reponses = { "Q0.1": besoin, ...profil };

      expect(posees(lire(reponses))).toEqual(attendu.posees);
      expect(resultat(reponses)).toEqual({
        issue: "ISSUE_PMT",
        mode: attendu.mode,
        support: "S3138g",
        financeur: "ASSURANCE_MALADIE",
        accompagnant: attendu.accompagnant,
        badges: attendu.badges,
      });
    });
  });
});

describe("les options de Q1.2 qui s'excluent", () => {
  it("exclusivite-6-7 et exclusivite-4-11 : fauteuil et allongé, hygiène et asepsie", () => {
    const read = lire({ "Q0.1": "1_VERIFIER", ...brancard(["2_ALD"]) });
    const q12 = read
      .askedPages()
      .flatMap((page) => read.questionsOn(page))
      .find(({ id }) => id === "Q1.2");

    expect(
      q12?.kind === "multiple choice" &&
        q12.incompatibleOptions?.map(({ values }) => values),
    ).toEqual([
      ["6_FAUTEUIL_SANS_TRANSFERT", "7_ALLONGE"],
      ["4_HYGIENE", "11_ASEPSIE"],
    ]);
  });
});
