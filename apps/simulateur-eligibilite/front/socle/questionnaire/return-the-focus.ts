// Le focus d'un champ de panneau qui disparaît (NAV-PANNEAUX-20261116). Un
// champ qui change seulement de panneau le garde, à sa nouvelle place. Un
// champ retiré le rend à la réponse qui ouvrait son panneau, si elle est encore
// là. Sans ça, le focus tomberait sur la page entière, et le clavier
// repartirait de son début. Rien ne bouge quand un panneau apparaît.

import { type FocusEvent, useLayoutEffect, useRef } from "react";

/** Le champ du panneau qui a le focus, et la réponse qui ouvre ce panneau. */
type Focused = { readonly field: Element; readonly trigger: HTMLElement };

/**
 * À brancher sur `onFocus` du formulaire : il suit le champ focalisé, et rend
 * le focus après chaque rendu qui l'a retiré.
 */
export function useFocusReturn(): (event: FocusEvent<HTMLElement>) => void {
  const focused = useRef<Focused>(undefined);
  useLayoutEffect(() => {
    const last = focused.current;
    if (!last || last.field.isConnected) return;
    focused.current = undefined;
    const moved = last.field.id && document.getElementById(last.field.id);
    if (moved instanceof HTMLElement) moved.focus();
    else if (last.trigger.isConnected) last.trigger.focus();
  });
  return (event) => {
    focused.current = focusedIn(event.target);
  };
}

// ---- implémentation ----

function focusedIn(field: Element): Focused | undefined {
  const panel = field.closest(".socle-conditional-panel");
  const trigger = panel && triggerOf(panel);
  return trigger ? { field, trigger } : undefined;
}

// La réponse qui ouvre un panneau : le premier champ qui le précède, dans
// l'option, la case ou la liste qu'il suit. L'aide d'une option, entre les
// deux, n'a pas de champ.
function triggerOf(panel: Element): HTMLElement | undefined {
  for (
    let sibling = panel.previousElementSibling;
    sibling !== null;
    sibling = sibling.previousElementSibling
  ) {
    const control = sibling.matches("input, select")
      ? sibling
      : sibling.querySelector("input, select");
    if (control instanceof HTMLElement) return control;
  }
  return undefined;
}
