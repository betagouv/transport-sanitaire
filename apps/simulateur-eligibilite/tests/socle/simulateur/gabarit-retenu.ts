// Le gabarit du cerfa du modèle de test, retenu ou remplacé : pour voir le
// second résultat pendant que son PDF se génère.

import type { Model } from "../../../front/socle/model";
import { modeleDeTest } from "../modele-de-test";

type Gabarit = () => Promise<ArrayBuffer | Uint8Array>;

// Le modèle de test, dont le gabarit se charge par `charge`, qui reçoit le
// chargement réel.
export function auGabarit(
  charge: (reel: Gabarit) => ReturnType<Gabarit>,
): Model {
  const { cerfa } = modeleDeTest;
  return {
    ...modeleDeTest,
    cerfa: {
      ...cerfa,
      form: (cibles) => {
        const bound = cerfa.form(cibles);
        return (
          bound && {
            ...bound,
            cerfa: {
              ...bound.cerfa,
              template: () => charge(bound.cerfa.template),
            },
          }
        );
      },
    },
  };
}

// Un gabarit retenu jusqu'à `lache()`, qui peut échouer à son premier
// chargement. Les chargements d'après `lache()` passent aussitôt.
export function gabaritRetenu({ echoueDAbord = false } = {}) {
  let lache: () => void = () => {};
  const retenu = new Promise<void>((resolve) => {
    lache = resolve;
  });
  let chargements = 0;
  const charge = async (reel: Gabarit) => {
    chargements += 1;
    if (echoueDAbord && chargements === 1)
      throw new Error("Gabarit introuvable.");
    await retenu;
    return reel();
  };
  return { charge, lache: () => lache() };
}
