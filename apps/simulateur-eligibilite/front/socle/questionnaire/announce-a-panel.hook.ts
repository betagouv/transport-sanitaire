// L'annonce discrète d'une question qui apparaît dans un panneau, pour un
// lecteur d'écran (NAV-PANNEAUX-20261116) : le focus ne bouge pas, et l'écran
// ne défile pas. Une question qui change seulement de panneau ne s'annonce
// pas, ni celles d'une page qu'on ouvre.

import { useState } from "react";
import type { AskedQuestion } from "../../../core/socle/questionnaire-engine";

/** Le texte à annoncer, vide tant que rien n'est apparu sur la page. */
export function usePanelAnnouncement(
  page: string,
  nested: readonly AskedQuestion[],
): string {
  const ids = nested.map(({ id }) => id).join("\n");
  const [seen, setSeen] = useState({ page, ids, text: "" });
  if (seen.page !== page) {
    setSeen({ page, ids, text: "" });
    return "";
  }
  if (seen.ids !== ids) {
    const before = seen.ids.split("\n");
    const appeared = nested.filter(({ id }) => !before.includes(id));
    const text = appeared.length > 0 ? announced(appeared) : seen.text;
    setSeen({ page, ids, text });
    return text;
  }
  return seen.text;
}

// ---- implémentation ----

function announced(appeared: readonly AskedQuestion[]): string {
  const labels = appeared.map(({ label }) => label).join(" ");
  return appeared.length > 1
    ? `Nouvelles questions : ${labels}`
    : `Nouvelle question : ${labels}`;
}
