// Le client HTTP de l'API REST d'un doc Grist, préconfiguré à sa création :
// l'adresse du doc, la clé d'API, le JSON et les erreurs. Les adaptateurs qui
// parlent à Grist passent par lui, et ne voient que des tables et des lignes.
//
// Il détient la clé d'API : il reste côté serveur. Il ne connaît pas le
// métier. Les noms de tables et de colonnes lui sont passés.

import type { AccesGrist } from "../configuration.ts";

export type GristRow = { id: number; fields: Record<string, unknown> };

/** Le filtre de Grist : `{ colonne: [valeurs acceptées] }`. */
export type GristFilter = Record<string, Array<string | number>>;

export class GristApiClient {
  readonly #base: string;
  readonly #apiKey: string;

  constructor({ docUrl, cleApi }: AccesGrist) {
    this.#base = docUrl.replace(/\/$/, "");
    this.#apiKey = cleApi;
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
