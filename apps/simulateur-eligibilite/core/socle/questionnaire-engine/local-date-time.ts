// Une date répondue, lue une fois : `AAAA-MM-JJ`, ou `AAAA-MM-JJTHH:mm` avec
// l'heure, comme une question de date ou de date et heure la reçoit. Les heures
// sont celles du patient, sans fuseau : on les compte comme un instant UTC,
// pour qu'un changement d'heure ne décale rien.
//
// Une date est un objet valeur. Une saisie qui n'a pas ce format est illisible
// : elle n'est comparée à rien, et toute comparaison avec elle vaut « non ».

/** La saisie manque ou est mal écrite : la date est illisible. */
type Unreadable = undefined;

/** Une date, avec ou sans heure, sans fuseau. */
export class LocalDateTime {
  // L'instant UTC de cette heure locale.
  private readonly epoch: number | Unreadable;

  private constructor(epoch: number | Unreadable) {
    this.epoch = epoch;
    Object.freeze(this);
  }

  /** La date de cette saisie. Absente ou mal écrite, elle est illisible. */
  static parse(saisie: string | undefined): LocalDateTime {
    return new LocalDateTime(epochOf(saisie));
  }

  /** Elle vient avant cette autre date. */
  isBefore(autre: LocalDateTime): boolean {
    return this.compare(autre, (ecart) => ecart < 0);
  }

  /** Elle vient après cette autre date. */
  isAfter(autre: LocalDateTime): boolean {
    return this.compare(autre, (ecart) => ecart > 0);
  }

  /** Elle vient avant cette autre date, ou en même temps. */
  isAtOrBefore(autre: LocalDateTime): boolean {
    return this.compare(autre, (ecart) => ecart <= 0);
  }

  /** La même date, tant de jours plus tard. */
  plusDays(jours: number): LocalDateTime {
    return this.plusHours(jours * HEURES_PAR_JOUR);
  }

  /** La même date, tant d'heures plus tard. */
  plusHours(heures: number): LocalDateTime {
    return new LocalDateTime(
      this.epoch === undefined ? undefined : this.epoch + heures * MS_PAR_HEURE,
    );
  }

  /** Son jour, à minuit : l'heure n'y compte plus. */
  startOfDay(): LocalDateTime {
    return new LocalDateTime(
      this.epoch === undefined
        ? undefined
        : this.epoch - (this.epoch % (HEURES_PAR_JOUR * MS_PAR_HEURE)),
    );
  }

  /** Elle tombe au même instant. Une date illisible n'égale rien. */
  equals(autre: LocalDateTime): boolean {
    return this.compare(autre, (ecart) => ecart === 0);
  }

  // Deux dates lisibles, comparées par l'écart de leurs instants.
  private compare(
    autre: LocalDateTime,
    retenu: (ecart: number) => boolean,
  ): boolean {
    return (
      this.epoch !== undefined &&
      autre.epoch !== undefined &&
      retenu(this.epoch - autre.epoch)
    );
  }
}

// ---- implémentation ----

const MS_PAR_HEURE = 3_600_000;
const HEURES_PAR_JOUR = 24;
const FORMAT = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

// L'instant UTC d'une saisie, avec ou sans heure.
function epochOf(saisie: string | undefined): number | Unreadable {
  const lue = saisie === undefined ? null : FORMAT.exec(saisie);
  if (!lue) return undefined;
  const [annee, mois, jour, heure = 0, minute = 0] = lue
    .slice(1)
    .map((partie) => Number(partie ?? 0));
  const instant = Date.UTC(
    annee ?? 0,
    (mois ?? 1) - 1,
    jour ?? 1,
    heure,
    minute,
  );
  return Number.isNaN(instant) ? undefined : instant;
}
