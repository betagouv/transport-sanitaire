// Une version du document R3 (ADR-0046) : `d1`, `d2`… dans une simulation. Ce
// que le PDF montre, la taille de ses textes imprimés (ADR-0048), et la
// révision du document dont il vient, en font l'empreinte : une empreinte
// nouvelle ouvre la version suivante. Un rendu qui change sans que le DTO
// change en ouvre donc une aussi, sous la même révision du document.

import type { DocumentRevision } from "./document-revision.entity";

/**
 * Ce que le document montre : le nom de son fichier daté, son DTO, et la
 * taille de ses textes imprimés.
 */
export type DocumentContent = {
  readonly file: string;
  readonly dto: unknown;
  readonly typography: Typography;
};

/**
 * La taille de chaque texte imprimé, en points, par identifiant fermé, et les
 * identifiants des textes imprimés dont la taille ne s'est pas lue (ADR-0048).
 */
export type Typography = {
  readonly sizes: Readonly<Record<string, number>>;
  readonly unmeasured: readonly string[];
};

/** Une version du document, telle que le journal la nomme. */
export type ShownDocument = Pick<DocumentVersion, "id" | "revisionId">;

export class DocumentVersion {
  readonly id: string;
  /** La révision du document dont elle vient. */
  readonly revisionId: string;
  readonly #rank: number;
  readonly #revision: DocumentRevision;
  readonly #fingerprint: string;

  private constructor(
    rank: number,
    revision: DocumentRevision,
    content: DocumentContent,
  ) {
    this.#rank = rank;
    this.#revision = revision;
    this.#fingerprint = fingerprintOf(revision, content);
    this.id = `d${rank}`;
    this.revisionId = revision.id;
  }

  /** La première version d'une simulation. */
  static first(
    revision: DocumentRevision,
    content: DocumentContent,
  ): DocumentVersion {
    return new DocumentVersion(1, revision, content);
  }

  /** La version vient de cette révision du document. */
  of(revision: DocumentRevision): boolean {
    return this.#revision === revision;
  }

  /** Ce contenu, de cette révision du document, est celui de la version. */
  shows(revision: DocumentRevision, content: DocumentContent): boolean {
    return this.#fingerprint === fingerprintOf(revision, content);
  }

  /** La version qui la remplace. */
  next(revision: DocumentRevision, content: DocumentContent): DocumentVersion {
    return new DocumentVersion(this.#rank + 1, revision, content);
  }
}

// ---- implémentation ----

// Les clés triées : deux DTO égaux donnent la même empreinte, dans quelque
// ordre qu'ils aient été remplis.
function fingerprintOf(
  revision: DocumentRevision,
  content: DocumentContent,
): string {
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
