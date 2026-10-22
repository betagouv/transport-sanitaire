// Une question telle qu'elle se pose, vu les réponses : sous son libellé du
// moment, avec ses bornes du moment, les seules options qui se proposent, et
// une adresse dans son mode du moment. Le reste du moteur, et l'écran, ne
// lisent que cette forme.
//
// La question déclarée porte des fonctions : ses conditions, ses libellés du
// moment. La question posée n'en porte aucune. Elle passe en JSON, telle
// qu'une API la donnera, et `askedQuestion` la relit.

import { AskedAddress, type AskedAddressData } from "./asked-address.ts";
import {
  AskedMultipleChoice,
  type AskedMultipleChoiceData,
  AskedSingleChoice,
  type AskedSingleChoiceData,
} from "./asked-choices.ts";
import type { AskedCommonData } from "./asked-common.ts";
import {
  AskedCheckbox,
  type AskedCheckboxData,
  AskedDate,
  type AskedDateData,
  AskedNumber,
  type AskedNumberData,
  AskedText,
  type AskedTextData,
} from "./asked-inputs.ts";
import type { OfferedOption, Option } from "./option.ts";
import type { Question } from "./question.ts";
import type { QuestionContext } from "./question-context.ts";

/** Une question telle qu'elle se pose. Sa sorte la distingue : `kind`. */
export type AskedQuestion =
  | AskedSingleChoice
  | AskedMultipleChoice
  | AskedNumber
  | AskedText
  | AskedDate
  | AskedCheckbox
  | AskedAddress;

/** Ce qu'une question posée donne en JSON. */
export type AskedQuestionData =
  | AskedSingleChoiceData
  | AskedMultipleChoiceData
  | AskedNumberData
  | AskedTextData
  | AskedDateData
  | AskedCheckboxData
  | AskedAddressData;

/** Relit une question posée, telle que le JSON la donne. */
export function askedQuestion(data: AskedQuestionData): AskedQuestion {
  switch (data.kind) {
    case "single choice":
      return new AskedSingleChoice(data);
    case "multiple choice":
      return new AskedMultipleChoice(data);
    case "number":
      return new AskedNumber(data);
    case "text":
    case "long text":
      return new AskedText(data);
    case "date":
    case "datetime":
      return new AskedDate(data);
    case "checkbox":
      return new AskedCheckbox(data);
    case "address":
      return new AskedAddress(data);
  }
}

/**
 * La question déclarée, telle qu'elle se pose dans ce contexte. `undefined` :
 * elle ne s'y pose pas. Ses incohérences lisent `earlier`, qui ne voit pas les
 * réponses des pages suivantes.
 */
export function askedIn(
  question: Question,
  seen: QuestionContext,
  earlier: QuestionContext,
): AskedQuestion | undefined {
  if (!(question.askedIf?.(seen) ?? true)) return undefined;
  return askedQuestion({
    ...commonOf(question, seen, earlier),
    ...ownOf(question, seen),
  });
}

// ---- implémentation ----

// Ce qui se lit autour du champ, vu les réponses : le libellé, le rappel, et
// les incohérences.
function commonOf(
  question: Question,
  seen: QuestionContext,
  earlier: QuestionContext,
): AskedCommonData {
  return {
    id: question.id,
    label: question.labelFrom?.(seen) ?? question.label,
    hint: question.hint,
    reminder: question.reminderFrom?.(seen) ?? question.reminder,
    optional: question.optional,
    inconsistencies: question.inconsistenciesFrom?.(earlier),
  };
}

// Ce que la sorte de la question y ajoute, vu les réponses.
function ownOf(question: Question, seen: QuestionContext) {
  switch (question.kind) {
    case "single choice": {
      const { kind, dropdown } = question;
      return {
        kind,
        dropdown,
        options: offeredOptions(question.options, seen),
      };
    }
    case "multiple choice":
      return multipleChoiceOf(question, seen);
    case "number": {
      const { kind, min, max, integer, unit } = question;
      return { kind, min, max, integer, unit };
    }
    case "text":
    case "long text":
      return { kind: question.kind };
    case "date":
    case "datetime": {
      const { kind, min, max } = question;
      return { kind, min, max, ...question.boundsFrom?.(seen) };
    }
    case "checkbox":
      return { kind: question.kind, box: question.box };
    case "address": {
      const abroad = question.abroadIf?.(seen) ?? question.abroad;
      return {
        kind: question.kind,
        withPlaceName: question.withPlaceName,
        abroad,
      };
    }
  }
}

function multipleChoiceOf(
  question: Extract<Question, { kind: "multiple choice" }>,
  seen: QuestionContext,
) {
  const { exclusiveOption: exclusive, incompatibleOptions } = question;
  const [exclusiveOption] = offeredOptions(exclusive ? [exclusive] : [], seen);
  return {
    kind: question.kind,
    options: offeredOptions(question.options, seen),
    exclusiveOption,
    incompatibleOptions,
  };
}

// Les options qui se proposent, vu les réponses, sous leur libellé du moment.
// Une option ne porte que ce qu'elle a : relue du JSON, elle est la même.
function offeredOptions(
  options: readonly Option[],
  seen: QuestionContext,
): OfferedOption[] {
  return options
    .filter((option) => option.offeredIf?.(seen) ?? true)
    .map((option) => {
      const { value, description, blocks } = option;
      const help = option.helpFrom?.(seen) ?? option.help;
      return {
        value,
        label: option.labelFrom?.(seen) ?? option.label,
        ...(description !== undefined && { description }),
        ...(blocks !== undefined && { blocks }),
        ...(help !== undefined && { help }),
      };
    });
}
