// Les exceptions de l'article 80 (Q2.6) : ce que chacune établit (D-106). Les
// huit faits des exceptions et les deux du Centre 15 les lisent. Celles qui se
// proposent se lisent sur la page des exceptions (`p2/transfert.ts`).
//
// Elles se lisent sur des réponses validées. Sans Q2.6 validée, elles
// n'établissent rien. Une exception proposée vaut « oui » cochée, « non »
// sinon. Une exception qui ne s'est pas proposée prend un prédicat structurel,
// tracé dans sa provenance. Elles donnent le fait d'une exception, sans
// déclarer de fait du catalogue.

import {
  Fait,
  type PassesOn,
  type ValidatedAnswers,
} from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";
import { Sejour } from "./sejour.ts";

type Valides = ValidatedAnswers<Questions>;
type Exception = Questions["Q2.6"][number];

/**
 * Une exception qui a son fait. L'option 3 n'en a pas : elle établit le
 * Centre 15, et « Aucune » n'établit rien.
 */
type ExceptionDuFait = Exclude<Exception, "3_CENTRE_QUINZE" | "11_AUCUNE">;

/** Les exceptions que ces réponses validées décrivent. */
export class ExceptionsDeLArticle80 {
  private readonly validated: Valides;

  private constructor(validated: Valides) {
    this.validated = validated;
    Object.freeze(this);
  }

  /** Les exceptions de ces réponses validées. */
  static of(validated: Valides): ExceptionsDeLArticle80 {
    return new ExceptionsDeLArticle80(validated);
  }

  /**
   * L'option 3 : le Centre 15 a-t-il demandé le transport ? Non proposée, ou
   * Q2.6 sans réponse, elle ne dit rien.
   */
  centre15(): Fait | PassesOn {
    const exceptions = this.validated.question("Q2.6");
    return exceptions.hasAnswer()
      ? exceptions.faitOf("3_CENTRE_QUINZE")
      : undefined;
  }

  /**
   * Ce qu'une exception établit, une fois Q2.6 validée : proposée, sa case
   * décide ; sinon, son prédicat structurel. Avant Q2.6, rien.
   */
  fait(exception: ExceptionDuFait): Fait | PassesOn {
    const exceptions = this.validated.question("Q2.6");
    if (!exceptions.hasAnswer()) return undefined;
    return (
      exceptions.faitOf(exception) ?? structurel(exception, this.validated)
    );
  }
}

// ---- implémentation ----

// Ce qu'une exception vaut quand Q2.6 ne l'a pas proposée.
function structurel(exception: ExceptionDuFait, validated: Valides): Fait {
  switch (exception) {
    case "2_ADMISSION_SANS_SEJOUR":
      return Fait.non(
        `Q2.6 : « ${exception} » ne s'est pas proposée : ${raisonSansAdmission(validated)}.`,
      );
    case "4_AIR_MER":
      return Fait.oui("Q2.3.2 : ligne régulière, réutilisée sans revote.");
    case "8_RADIOTHERAPIE":
      return Fait.non(
        `Q2.6 : « ${exception} » ne s'est pas proposée : ${raisonSansRadiotherapie(validated)}.`,
      );
    default:
      return Fait.inconnu(`Q2.6 : « ${exception} » ne s'est pas proposée.`);
  }
}

function raisonSansAdmission(validated: Valides): string {
  if (Sejour.of(validated).estCoche())
    return "un séjour initial est coché en Q2.2.1";
  if (validated.question("Q2.5").is("2_AUTRE_DEPLACEMENT"))
    return "Q2.5 : autre déplacement, pas un transfert";
  if (validated.question("Q2.6.a").is("2_PROVISOIRE"))
    return "Q2.6.a : transfert provisoire, avec retour à l'établissement d'origine";
  return "une admission en HAD n'est pas un transfert entre établissements";
}

function raisonSansRadiotherapie(validated: Valides): string {
  return validated.question("Q2.6.a").is("1_DEFINITIF")
    ? "Q2.6.a : transfert définitif"
    : "une admission en HAD n'est pas un transfert provisoire";
}
