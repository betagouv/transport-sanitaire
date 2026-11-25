// Le client HTTP de l'API REST d'un doc Grist, préconfiguré à sa création :
// l'adresse du doc, la clé d'API, le JSON et les erreurs. Les adaptateurs qui
// parlent à Grist passent par lui, et ne voient que des tables et des lignes.
//
// Il détient la clé d'API : il reste côté serveur. Il ne connaît pas le
// métier. Les noms de tables et de colonnes lui sont passés.
//
// Un appel a un délai maximal. Un Grist lent, sans être en panne, laisserait
// sinon chaque requête du simulateur pendre avec lui.

/** Ce que le client exige du doc : son adresse et la clé d'API. */
export type AccesGrist = { docUrl: string; cleApi: string };

export type GristRow = { id: number; fields: Record<string, unknown> };

/** Le filtre de Grist : `{ colonne: [valeurs acceptées] }`. */
export type GristFilter = Record<string, Array<string | number>>;

export class GristApiClient {
  readonly #base: string;
  readonly #apiKey: string;
  readonly #timeout: number;

  constructor(
    { docUrl, cleApi }: AccesGrist,
    // Le délai maximal d'un appel, en millisecondes.
    { timeout = TIMEOUT }: { timeout?: number } = {},
  ) {
    this.#base = docUrl.replace(/\/$/, "");
    this.#apiKey = cleApi;
    this.#timeout = timeout;
  }

  async rows(table: string, filter?: GristFilter): Promise<GristRow[]> {
    const query = filter
      ? `?filter=${encodeURIComponent(JSON.stringify(filter))}`
      : "";
    const body = await this.#request<{ records?: GristRow[] }>(
      `/tables/${table}/records${query}`,
    );
    return body.records ?? [];
  }

  /** Crée une ligne et renvoie son rowId interne. */
  async addRow(
    table: string,
    fields: Record<string, unknown>,
  ): Promise<number> {
    const body = await this.#request<{ records?: Array<{ id: number }> }>(
      `/tables/${table}/records`,
      { method: "POST", body: JSON.stringify({ records: [{ fields }] }) },
    );
    const id = body.records?.[0]?.id;
    if (id == null) throw new Error(`Grist ${table} POST : aucun id renvoyé`);
    return id;
  }

  async #request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.#base}${path}`, {
      ...init,
      signal: AbortSignal.timeout(this.#timeout),
      headers: {
        Authorization: `Bearer ${this.#apiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Grist ${init.method ?? "GET"} ${path} → HTTP ${response.status}`,
      );
    }
    return (await response.json()) as T;
  }
}

/**
 * La valeur d'une cellule, en texte. Grist renvoie des nombres ou des chaînes
 * selon le type de colonne.
 */
export function cellText(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : value == null
      ? ""
      : String(value);
}

// ---- implémentation ----

// Grist répond d'ordinaire en moins d'une seconde. Dix laissent passer un
// document chargé, et rendent la main avant que le navigateur n'abandonne.
const TIMEOUT = 10_000;
