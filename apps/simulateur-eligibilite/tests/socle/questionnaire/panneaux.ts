// Ce que les tests des panneaux partagent : retrouver la réponse sous laquelle
// une question s'affiche.

/**
 * Le champ de la réponse qui ouvre le panneau où s'affiche cet élément : le
 * premier qui précède le panneau. Hors panneau : rien.
 */
export function declencheurDe(element: Element): Element | undefined {
  const panneau = element.closest(".socle-conditional-panel");
  for (
    let avant = panneau?.previousElementSibling;
    avant;
    avant = avant.previousElementSibling
  ) {
    const champ = avant.matches("input, select")
      ? avant
      : avant.querySelector("input, select");
    if (champ) return champ;
  }
  return undefined;
}
