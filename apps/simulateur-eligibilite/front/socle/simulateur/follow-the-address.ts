// L'adresse de la page suit la simulation (ADR-30). Chaque nouvelle position
// s'y inscrit dans l'historique : le bouton Retour du navigateur y revient. Une
// adresse que l'historique rouvre passe par la simulation, qui l'accepte ou la
// refuse ; refusée, l'adresse revient à la position courante. Au montage,
// l'adresse prend la position de départ : après un rechargement, les réponses
// sont perdues et l'on recommence.
//
// Rien ne part vers la page parente, ni vers la mesure d'audience : Matomo ne
// compte qu'une page vue, au démarrage du traceur (`analytics/matomo.ts`).

import { type RefObject, useEffect, useRef } from "react";
import type { Simulation } from "../../../core/socle/simulation";
import { hashOf, positionIn } from "../questionnaire";

export function useFollowTheAddress(
  simulation: Simulation,
  onChange: (simulation: Simulation) => void,
): void {
  const current = useRef({ simulation, onChange });
  current.current = { simulation, onChange };
  const mounted = useRef(false);

  useEffect(() => {
    const hash = hashOf(simulation.position);
    const first = !mounted.current;
    mounted.current = true;
    if (window.location.hash === hash) return;
    if (first) window.history.replaceState(null, "", hash);
    else window.history.pushState(null, "", hash);
  }, [simulation]);

  // L'historique rouvre une entrée (`popstate`), ou l'adresse change à la main
  // (`hashchange`) : un navigateur peut émettre les deux pour un même geste.
  useEffect(() => {
    const onMove = () => followTheHistory(current);
    window.addEventListener("popstate", onMove);
    window.addEventListener("hashchange", onMove);
    return () => {
      window.removeEventListener("popstate", onMove);
      window.removeEventListener("hashchange", onMove);
    };
  }, []);
}

// ---- implémentation ----

type Current = {
  simulation: Simulation;
  onChange: (simulation: Simulation) => void;
};

// La simulation va à la position de l'adresse, si elle l'accepte. Sinon
// l'adresse revient à la sienne. Une adresse déjà suivie ne change rien : c'est
// le second évènement d'un même geste.
function followTheHistory(current: RefObject<Current>) {
  const { simulation, onChange } = current.current;
  const { hash } = window.location;
  if (hash === hashOf(simulation.position)) return;
  const position = positionIn(hash);
  const moved = position && simulation.moveTo(position);
  if (moved) onChange(moved);
  else window.history.replaceState(null, "", hashOf(simulation.position));
}
