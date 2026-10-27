// Les contextes du trajet : les situations particulières de Q2.2.1, et l'autre
// cadre que Q2.2.1.b précise. La page des contextes y lit les situations
// qu'elle propose ; les faits de l'autre cadre lisent la même table
// (`faits/communs.ts`).

import type { AnswersReader } from "../../../socle/index.ts";
import { OPTIONS, type Questions } from "../declarations/questions.ts";

type Contexte = Questions["Q2.2.1.b"][number];

/**
 * Une situation de l'autre cadre qui a son fait. Le retour pénitentiaire n'en
 * a pas : il qualifie son circuit (`p2/retour-penitentiaire.ts`).
 */
export type SituationDuCadre = Exclude<Contexte, "10_RETOUR_PENITENTIAIRE">;

/** Les contextes que ces réponses décrivent. */
export class ContextesDuTrajet<
  Reponses extends AnswersReader<Questions> = AnswersReader<Questions>,
> {
  private readonly reponses: Reponses;

  private constructor(reponses: Reponses) {
    this.reponses = reponses;
    Object.freeze(this);
  }

  /** Les contextes de ces réponses, données ou validées. */
  static of<Reponses extends AnswersReader<Questions>>(
    reponses: Reponses,
  ): ContextesDuTrajet<Reponses> {
    return new ContextesDuTrajet(reponses);
  }

  /**
   * Les situations de l'autre cadre qui se proposent, en Q2.2.1.b comme dans
   * l'aide de Q2.2.1. Une situation déjà indiquée en Q2.1 en est retirée (D-98).
   */
  aProposer(): readonly Contexte[] {
    return proposesApres(this.reponses.question("Q2.1").value);
  }
}

/**
 * Les situations de l'autre cadre qui se proposent après ce motif de Q2.1 :
 * toutes, sauf celles qu'il indique déjà (D-98).
 */
export function proposesApres(
  motif: Questions["Q2.1"] | undefined,
): readonly Contexte[] {
  const retires = (motif && RETIRES_PAR_Q21[motif]) || [];
  return CONTEXTES.filter((contexte) => !retires.includes(contexte));
}

/**
 * Les situations que Q2.1 indique déjà. Elles sont retirées sans rappel
 * (TS1012-01), de la page des contextes comme des faits de l'autre cadre
 * (`faits/communs.ts`). Le groupe « déjà hospitalisé », que la permission
 * retire, se lit sur la page des contextes (`p2/partie-2.ts`).
 */
export const RETIRES_PAR_Q21: Partial<
  Record<Questions["Q2.1"], readonly Contexte[]>
> = {
  "10_CAMSP": ["6_CAMSP"],
  "11_PERMISSION": [],
  "12_CONVOCATION": ["13_CONVOCATION"],
  "13_MATERNITE": ["4_MATERNITE_ELOIGNEE", "5_HTNM"],
};

// ---- implémentation ----

const CONTEXTES = Object.keys(OPTIONS["Q2.2.1.b"]) as Contexte[];
