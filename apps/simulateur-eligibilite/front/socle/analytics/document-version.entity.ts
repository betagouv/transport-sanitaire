// Une version du document R3 (ADR-10) : `d1`, `d2`… dans une simulation. Ce
// que le PDF montre, et la révision du R2 dont il vient, en font l'empreinte :
// une empreinte nouvelle ouvre la version suivante.

import type { Revision } from "./revision.entity";

/** Ce que le document montre : le nom de son fichier daté, et son DTO. */
export type DocumentContent = {
  readonly file: string;
  readonly dto: unknown;
};

export class DocumentVersion {
  readonly id: string;
  readonly #rank: number;
  readonly #fingerprint: string;

  private constructor(rank: number, fingerprint: string) {
    this.#rank = rank;
    this.#fingerprint = fingerprint;
    this.id = `d${rank}`;
  }

  /** La première version d'une simulation. */
  static first(revision: Revision, content: DocumentContent): DocumentVersion {
    return new DocumentVersion(1, fingerprintOf(revision, content));
  }

  /** Ce contenu, de cette révision, est celui de la version. */
  shows(revision: Revision, content: DocumentContent): boolean {
    return this.#fingerprint === fingerprintOf(revision, content);
  }

  /** La version qui la remplace. */
  next(revision: Revision, content: DocumentContent): DocumentVersion {
    return new DocumentVersion(
      this.#rank + 1,
      fingerprintOf(revision, content),
    );
  }
}

// ---- implémentation ----

// Les clés triées : deux DTO égaux donnent la même empreinte, dans quelque
// ordre qu'ils aient été remplis.
function fingerprintOf(revision: Revision, content: DocumentContent): string {
  return JSON.stringify(
    { revision: revision.id, ...content },
    (_key, value: unknown) =>
      isRecord(value)
        ? Object.fromEntries(
            Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
          )
        : value,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
