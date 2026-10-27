// Les contextes du trajet : les situations particulières de Q2.2.1, et l'autre
// cadre que Q2.2.1.b précise. Les faits de l'autre cadre (l'AT ou la MP, le
// SAMSAH, la pension, le HTNM, le CAMSP, la maternité, la convocation) les
// lisent, comme la page des contextes, qui propose ses situations.
//
// Ils se construisent sur des réponses données comme sur des réponses
// validées. Seules ces dernières savent qu'une situation a été proposée puis
// écartée. Ils donnent le fait d'une situation, sans déclarer de fait du
// catalogue.

import {
  type AnswersReader,
  Fait,
  type PassesOn,
  type ValidatedAnswers,
} from "../../../socle/index.ts";
import { OPTIONS, type Questions } from "../declarations/questions.ts";

type Contexte = Questions["Q2.2.1.b"][number];

/**
 * Une situation de l'autre cadre qui a son fait. Le retour pénitentiaire n'en
 * a pas : il qualifie son circuit (`p2/retour-penitentiaire.ts`).
 */
type SituationDuCadre = Exclude<Contexte, "10_RETOUR_PENITENTIAIRE">;

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

  /**
   * Ce qu'une situation de l'autre cadre établit. Écartée, elle vaut « non ».
   * Cochée, elle vaut « oui », ou reste à qualifier dans sa branche (la
   * maternité, la convocation). Une situation qui ne s'est pas proposée
   * n'établit rien, et l'autre cadre coché n'établit rien avant sa précision.
   */
  situation(
    this: ContextesDuTrajet<ValidatedAnswers<Questions>>,
    contexte: SituationDuCadre,
  ): Fait | PassesOn {
    const groupe = this.reponses.question("Q2.2.1");
    const coche = groupe.checked("3_AUTRE_CADRE");
    const precision = this.reponses.question("Q2.2.1.b");
    if (!groupe.offers("3_AUTRE_CADRE") || (coche && !precision.hasAnswer()))
      return undefined;
    const proposes = coche ? precision.offeredOptions() : this.aProposer();
    if (!proposes.includes(contexte)) return undefined;
    if (!coche)
      return Fait.non("Q2.2.1 : « autre situation » proposée, non cochée.");
    if (!precision.checked(contexte))
      return Fait.non(`Q2.2.1.b : « ${contexte} » proposée, non cochée.`);
    const source = `Q2.2.1.b : « ${contexte} ».`;
    return A_QUALIFIER.includes(contexte)
      ? Fait.inconnu(`${source} À qualifier dans sa branche.`)
      : Fait.oui(source);
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

// ---- implémentation ----

const CONTEXTES = Object.keys(OPTIONS["Q2.2.1.b"]) as Contexte[];

// Les situations que Q2.1 indique déjà. Elles sont retirées sans rappel
// (TS1012-01). Le groupe « déjà hospitalisé », que la permission retire, se lit
// sur la page des contextes (`p2/partie-2.ts`).
const RETIRES_PAR_Q21: Partial<Record<Questions["Q2.1"], readonly Contexte[]>> =
  {
    "10_CAMSP": ["6_CAMSP"],
    "11_PERMISSION": [],
    "12_CONVOCATION": ["13_CONVOCATION"],
    "13_MATERNITE": ["4_MATERNITE_ELOIGNEE", "5_HTNM"],
  };

// Les situations que leur branche qualifie (Q2.10, Q2.14) : cochées, elles
// restent à qualifier.
const A_QUALIFIER: readonly Contexte[] = [
  "4_MATERNITE_ELOIGNEE",
  "13_CONVOCATION",
];
