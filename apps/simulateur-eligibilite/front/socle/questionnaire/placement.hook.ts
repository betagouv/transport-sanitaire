// Le placement de la page ouverte, gardé pour le retour sur une page validée
// (`placement.vo.ts`).

import { useRef, useState } from "react";
import type {
  Answers,
  AskedQuestion,
} from "../../../core/socle/questionnaire-engine";
import { Placement } from "./placement.vo";

/** La page ouverte, et ce qu'elle affiche. */
type OpenedPage = {
  readonly page: { readonly id: string };
  readonly questions: readonly AskedQuestion[];
};

/**
 * Le placement de la page ouverte. `remember` le garde pour un retour sur la
 * page : à appeler quand elle se valide. « Précédent » l'abandonne, avec le
 * brouillon.
 */
export function usePlacement(
  { page: { id: page }, questions }: OpenedPage,
  draft: Answers,
) {
  const remembered = useRef(new Map<string, Placement>());
  const [last, setLast] = useState<{ page: string; placement: Placement }>();
  const previous =
    last?.page === page
      ? last.placement
      : (remembered.current.get(page) ?? Placement.none());
  const placement = previous.after(questions, draft);
  if (last?.page !== page || !placement.equals(last.placement))
    setLast({ page, placement });
  return {
    placement,
    remember: () => {
      remembered.current.set(page, placement);
    },
  };
}
