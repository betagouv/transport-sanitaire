// Le récapitulatif de P3 que R3 affiche en attendant le PDF du cerfa (#157) :
// chaque question validée, avec sa réponse en toutes lettres.

import { describe, expect, it } from "vitest";
import type { Cibles } from "../../../core/models/eligibilite/declarations/cibles";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { GivenAnswers } from "../../../core/socle/questionnaire-engine/given-answers";
import type { Answers } from "../../../core/socle/questionnaire-engine/question";
import { recapitulatifDuComplement as recapitulatif } from "../../../front/models/eligibilite/r3/recapitulatif-du-complement";
import { PLUSIEURS_PERMISSIONS } from "./reponses-de-la-permission";

const avecLeSupport = (support: Cibles["cible_support_id"]) =>
  ({ cible_support_id: support }) as Cibles;

// Ce que le socle passe à R3 : les réponses, et les cibles figées. Les pages
// d'avant P3 sont validées par hypothèse.
const recapitulatifDuComplement = (
  reponses: Answers<Questions>,
  cibles: Cibles,
) => recapitulatif({ answers: new GivenAnswers(reponses), cibles });

describe("le récapitulatif de P3", () => {
  it("donne chaque réponse sous sa question : le nombre avec son unité, le sens en toutes lettres", () => {
    const reponses = { "Q3.1.1": 2, "Q3.1.2": "1_ALLER" } as const;

    expect(
      recapitulatifDuComplement(reponses, avecLeSupport("S3138g")),
    ).toEqual([
      {
        question: "Combien de transports faut-il prescrire ?",
        reponse: "2 transport(s)",
      },
      {
        question: "Comment ces transports sont-ils organisés ?",
        reponse: "Aller simple",
      },
    ]);
  });

  it("donne pour le S3141 de plusieurs permissions les trajets par mois", () => {
    const reponses = { ...PLUSIEURS_PERMISSIONS, "Q3.1.3": 4 };

    expect(recapitulatifDuComplement(reponses, avecLeSupport("S3141"))).toEqual(
      [
        {
          question: "Combien de trajets faut-il prescrire par mois ?",
          reponse: "4 trajet(s) par mois",
        },
      ],
    );
  });

  it("s'arrête à la première question qui attend sa réponse", () => {
    expect(
      recapitulatifDuComplement(
        { "Q3.1.2": "1_ALLER" },
        avecLeSupport("S3138g"),
      ),
    ).toEqual([]);
  });
});
