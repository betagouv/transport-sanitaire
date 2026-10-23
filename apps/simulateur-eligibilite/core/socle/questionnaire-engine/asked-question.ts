// Une question telle qu'elle se pose, vu les réponses : sous son libellé du
// moment, avec ses bornes du moment, les seules options qui se proposent, et
// une adresse dans son mode du moment. Le reste du moteur, et l'écran, ne
// lisent que cette forme.
//
// La question déclarée porte des fonctions : ses conditions, ses libellés du
// moment (`declared-question.ts`). La question posée n'en porte aucune. Elle
// passe en JSON, telle qu'une API la donnera, et `askedQuestion` la relit.

import { AskedAddress, type AskedAddressData } from "./asked-address.ts";
import {
  AskedMultipleChoice,
  type AskedMultipleChoiceData,
  AskedSingleChoice,
  type AskedSingleChoiceData,
} from "./asked-choices.ts";
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
