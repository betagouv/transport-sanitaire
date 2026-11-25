// Le compteur d'une question dont la réponse s'écrit telle quelle dans un texte
// strict du cerfa (T06, R04) : « saisis / maximum caractères », mesuré
// sur le cerfa, et le message de sa règle quand elle n'y tient pas. Il
// prévient : la page se valide quand même, R3 fait réécrire ce qui déborde.
//
// Sans cerfa, ou tant que la mesure se charge, pas de compteur.

import type { CerfaDto } from "../../../core/socle/cerfa";
import type { Cerfa } from "./cerfa.types";
import { useMeasure } from "./measure.hook";
import { StrictEntriesService } from "./strict-entries.service";
import { StrictVerdict } from "./strict-verdict.vo";

/** Ce que dit le compteur sous le champ. */
type TextCounter = {
  /** « 12 / 54 caractères ». */
  readonly text: string;
  /** Le message de la règle, quand le texte ne tient pas. */
  readonly error?: string;
};

/** La question n'a pas de compteur, ou sa mesure se charge encore. */
type NoCounter = undefined;

/** Le compteur de cette question pour ce texte. */
type CounterOf = (question: string, text: string) => TextCounter | NoCounter;

/**
 * Les compteurs des questions de `measured`, chacune vers son entrée du DTO,
 * sur `cerfa`.
 */
export function useTextCounters(
  cerfa: Cerfa<CerfaDto> | null,
  measured: Readonly<Record<string, string>>,
): CounterOf {
  const entries = cerfa ? StrictEntriesService.of(cerfa) : [];
  const counted = (question: string) =>
    entries.find(({ entry }) => entry === measured[question]);
  const measure = useMeasure(cerfa, Object.keys(measured).some(counted));
  return (question, text) => {
    const found = counted(question);
    if (!found || !measure) return undefined;
    const measuredText = measure(found.entry, text);
    const strict = { ...found.strict, requiredMessage: undefined };
    return {
      text: `${Array.from(text).length} / ${measuredText.maximum} caractères`,
      error: StrictVerdict.of(strict, text, measuredText).message,
    };
  };
}
