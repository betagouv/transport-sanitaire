// Le contexte d'une question : ce qu'elle voit à sa place. Les réponses, les
// questions validées, les faits et les cibles. Ses libellés, ses rappels et
// ses bornes du moment le reçoivent, et ses conditions s'y lisent
// (`conditions/reading.vo.ts`). Rien d'autre ne leur parvient.
//
// Il est le bout du chemin d'une réponse : réponses → validées → faits →
// cibles. Le moteur fait les deux premières étapes, dans l'ordre des questions
// (`question-walk.service.ts`). Le modèle fait les deux dernières, par son
// `Pipeline` : son catalogue des faits, puis ses règles. Faits et cibles ne se
// calculent qu'à la lecture, une fois par contexte. Le catalogue des faits
// arrête un fait qui se relit par une garde.

import { Fait, type FaitCatalogue } from "../../../decision-engine/index.ts";

import type { GivenAnswers } from "../../answers/given-answers.vo.ts";
import type {
  ValidatedAnswer,
  ValidatedAnswers,
} from "../../answers/validated-answers.vo.ts";
import { LocalDateTime } from "../../conditions/local-date-time.vo.ts";
import type { Context, ReadAnswer } from "../../conditions/reading.vo.ts";
import { QuestionnaireDeclarationError } from "../../questionnaire-declaration.error.ts";
import type { AnyCibles, AnyQuestions } from "../question.ts";

/**
 * Ce qu'une question voit des réponses, avant les étapes du modèle. `cibles` :
 * celles figées au verrou, sur une page posée après lui. Ailleurs :
 * `undefined`. `answer` : la réponse d'une question telle que ses conditions
 * la lisent, à sa place (`conditions/guard-place.vo.ts`).
 */
export type SeenAnswers<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = {
  readonly answers: GivenAnswers<Questions>;
  readonly validated: ValidatedAnswers<Questions>;
  readonly cibles: Cibles;
  readonly answer: ReadAnswer;
};

/** Ce qui calcule les cibles d'un modèle sur ses faits : ses règles. */
type CiblesOf<Faits = unknown, Cibles = unknown> = (faits: Faits) => Cibles;

/**
 * Les étapes que le modèle ajoute au chemin d'une réponse : des réponses
 * validées aux faits, par son catalogue, puis des faits aux cibles. Ce sont
 * celles de sa préconisation, sans la complétude qu'elle seule impose.
 */
export type Pipeline<Faits, Cibles> = {
  readonly faits?: FaitCatalogue<Faits & object>;
  readonly cibles?: CiblesOf<Faits, Cibles>;
};

/** Le contexte d'une question : ce que lisent ses conditions et ses libellés. */
export class QuestionContext<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
  Faits = unknown,
> implements Context
{
  readonly answers: GivenAnswers<Questions>;
  readonly validated: ValidatedAnswers<Questions>;
  readonly #seen: SeenAnswers<Questions, Cibles | undefined>;
  readonly #pipeline: Pipeline<Faits, Cibles>;
  // Calculés à leur première lecture, puis gardés.
  #faits?: { readonly value: Faits };
  #cibles?: { readonly value: Cibles };

  constructor(
    seen: SeenAnswers<Questions, Cibles | undefined>,
    pipeline: Pipeline<Faits, Cibles>,
  ) {
    this.answers = seen.answers;
    this.validated = seen.validated;
    this.#seen = seen;
    this.#pipeline = pipeline;
  }

  /**
   * Les faits des questions validées jusqu'ici, par le catalogue du modèle.
   * Une garde les lit quand un fait dit déjà ce qu'elle teste.
   */
  get faits(): Faits {
    this.#faits ??= { value: this.#faitsOfValidated() };
    return this.#faits.value;
  }

  /**
   * Les cibles calculées sur ces faits. Sur une page posée après le verrou :
   * celles figées au verrou. Une garde les lit quand une règle de l'éditeur
   * dit déjà ce qu'elle teste.
   */
  get cibles(): Cibles {
    this.#cibles ??= { value: this.#ciblesOfFaits() };
    return this.#cibles.value;
  }

  /** La réponse de cette question, telle qu'on la voit d'ici. */
  answer(id: string): ValidatedAnswer {
    return this.#seen.answer(id);
  }

  fait(nom: string): unknown {
    return named(this.faits, nom);
  }

  cible(nom: string): unknown {
    return named(this.cibles, nom);
  }

  /** Cette cible, si ce fait valait « oui ». */
  cibleAssuming(nom: string, fait: string): unknown {
    const { cibles } = this.#pipeline;
    if (!cibles) throw noCibles();
    const supposed = Fait.oui(`Supposé pour la garde : ${fait}.`);
    return named(cibles({ ...this.faits, [fait]: supposed }), nom);
  }

  today(): LocalDateTime {
    return LocalDateTime.dayInParis(new Date());
  }

  // ---- implémentation ----

  // Étape 3 : des réponses validées aux faits, par le catalogue.
  #faitsOfValidated(): Faits {
    const { faits } = this.#pipeline;
    if (!faits)
      throw new QuestionnaireDeclarationError(
        "Cette question ne connaît pas ses faits : déclare-la par les constructeurs de son modèle.",
      );
    return faits.read(this.validated);
  }

  // Étape 4 : des faits aux cibles, sauf si le verrou les a figées. Un modèle
  // sans règles laisse les cibles telles que le verrou les donne.
  #ciblesOfFaits(): Cibles {
    const { cibles } = this.#pipeline;
    if (this.#seen.cibles !== undefined || !cibles)
      return this.#seen.cibles as Cibles;
    return cibles(this.faits);
  }
}

function named(values: unknown, nom: string): unknown {
  return (values as Readonly<Record<string, unknown>>)[nom];
}

function noCibles(): QuestionnaireDeclarationError {
  return new QuestionnaireDeclarationError(
    "Ce modèle n'a pas de règles : il n'a pas de cibles.",
  );
}
