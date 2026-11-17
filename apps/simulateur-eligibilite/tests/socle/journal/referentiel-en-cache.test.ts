// Le référentiel que la collecte garde en cache : il le relit quand un id lui
// manque, ou quand sa copie a vieilli, et garde sa copie si le référentiel ne
// répond plus. L'horloge est celle du test.

import { describe, expect, it } from "vitest";
import { CachedReferentiel } from "../../../server/journal/cached-referentiel.adapter.ts";
import {
  type Etablissement,
  type Referentiel,
  snapshotReferentiel,
} from "../../../shared/referentiel.ts";

describe("le référentiel en cache de la collecte", () => {
  it("relit le référentiel quand sa copie a dix minutes", async () => {
    const { referentiel, etablissements } = await referentielModifiable();
    const horloge = new Horloge();
    const cache = new CachedReferentiel(referentiel, horloge);
    expect(await cache.hasEstablishment("e_ch_chambery")).toBe(true);

    // L'admin retire l'établissement du référentiel.
    etablissements.splice(1, 1);
    expect(await cache.hasEstablishment("e_ch_chambery")).toBe(true);
    horloge.avancer(DIX_MINUTES);

    expect(await cache.hasEstablishment("e_ch_chambery")).toBe(false);
  });

  it("garde sa copie, même vieille, si le référentiel ne répond plus", async () => {
    const { referentiel, muet } = await referentielModifiable();
    const horloge = new Horloge();
    const cache = new CachedReferentiel(referentiel, horloge);
    await cache.hasEstablishment("e_chu_grenoble");
    await cache.hasService("e_chu_grenoble", "s_grenoble_cardio");

    muet();
    horloge.avancer(DIX_MINUTES);

    expect(await cache.hasEstablishment("e_chu_grenoble")).toBe(true);
    expect(await cache.hasService("e_chu_grenoble", "s_grenoble_cardio")).toBe(
      true,
    );
    await expect(cache.hasEstablishment("e_inconnu")).rejects.toThrow();
  });
});

// ---- implémentation ----

const DIX_MINUTES = 10 * 60 * 1000;

class Horloge {
  #maintenant = 0;

  readonly now = () => this.#maintenant;

  avancer(ms: number) {
    this.#maintenant += ms;
  }
}

// Le snapshot, dont on peut retirer un établissement, ou qu'on peut rendre muet.
async function referentielModifiable() {
  const etablissements: Etablissement[] = [
    ...(await snapshotReferentiel.listerEtablissements()),
  ];
  let repond = true;
  const lire = <T>(lecture: () => Promise<T>) => {
    if (!repond) return Promise.reject(new Error("Grist ne répond pas"));
    return lecture();
  };
  const referentiel: Referentiel = {
    listerEtablissements: () => lire(async () => etablissements),
    listerServices: (etabId) =>
      lire(() => snapshotReferentiel.listerServices(etabId)),
  };
  return { referentiel, etablissements, muet: () => (repond = false) };
}
