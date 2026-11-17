// Le référentiel, tel que la collecte le lit : en cache, pour ne pas le relire
// à chaque événement. Il garde les ids des établissements, et ceux des services
// de chaque établissement déjà vu.
//
// Une copie de moins de dix minutes qui connaît l'id répond seule. Sinon, il
// relit le référentiel : un id créé à l'instant, même par un autre conteneur,
// n'est jamais refusé sur une copie périmée. Si le référentiel ne répond pas,
// la vieille copie répond pour un id qu'elle connaît ; pour un autre, la
// lecture échoue, et la collecte répond 503 : le navigateur réessaiera.

import type { Referentiel } from "../../shared/referentiel.ts";
import type { KnownRattachements } from "./known-rattachements.port.ts";

/** L'horloge, en millisecondes : `Date.now`, sauf en test. */
export type Clock = { now: () => number };

export class CachedReferentiel implements KnownRattachements {
  readonly #referentiel: Referentiel;
  readonly #clock: Clock;
  readonly #establishments: CachedIds;
  readonly #services = new Map<string, CachedIds>();

  constructor(referentiel: Referentiel, clock: Clock = { now: Date.now }) {
    this.#referentiel = referentiel;
    this.#clock = clock;
    this.#establishments = new CachedIds(
      async () => idsOf(await referentiel.listerEtablissements()),
      clock,
    );
  }

  hasEstablishment(establishmentId: string): Promise<boolean> {
    return this.#establishments.has(establishmentId);
  }

  hasService(establishmentId: string, serviceId: string): Promise<boolean> {
    return this.#servicesOf(establishmentId).has(serviceId);
  }

  #servicesOf(establishmentId: string): CachedIds {
    let services = this.#services.get(establishmentId);
    if (!services) {
      services = new CachedIds(
        async () =>
          idsOf(await this.#referentiel.listerServices(establishmentId)),
        this.#clock,
      );
      this.#services.set(establishmentId, services);
    }
    return services;
  }
}

// ---- implémentation ----

// Dix minutes : un id retiré du référentiel cesse d'être reconnu au plus tard
// après elles.
const MAX_AGE = 10 * 60 * 1000;

// Les ids d'une liste du référentiel, et l'instant où on l'a lue. Deux
// événements qui la relisent en même temps partagent la même lecture.
class CachedIds {
  readonly #read: () => Promise<Set<string>>;
  readonly #clock: Clock;
  #ids: Set<string> | undefined;
  #readAt = 0;
  #reading: Promise<Set<string>> | undefined;

  constructor(read: () => Promise<Set<string>>, clock: Clock) {
    this.#read = read;
    this.#clock = clock;
  }

  async has(id: string): Promise<boolean> {
    if (this.#ids?.has(id) && this.#age() < MAX_AGE) return true;
    try {
      return (await this.#reread()).has(id);
    } catch (error) {
      if (this.#ids?.has(id)) return true;
      throw error;
    }
  }

  #age(): number {
    return this.#clock.now() - this.#readAt;
  }

  #reread(): Promise<Set<string>> {
    this.#reading ??= this.#read()
      .then((ids) => {
        this.#ids = ids;
        this.#readAt = this.#clock.now();
        return ids;
      })
      .finally(() => {
        this.#reading = undefined;
      });
    return this.#reading;
  }
}

function idsOf(list: { id: string }[]): Set<string> {
  return new Set(list.map(({ id }) => id));
}
