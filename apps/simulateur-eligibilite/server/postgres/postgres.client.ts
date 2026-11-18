// Le client PostgreSQL du serveur : un pool de connexions à la base que
// Scalingo fournit, et le seul fichier qui importe le pilote `pg`. Le journal
// des parcours y écrit (ADR-0043).
//
// Ce que les adaptateurs en attendent tient dans `Sql` : une requête, des
// paramètres, des lignes. PGlite, la base des tests, en a la même forme.

import pg from "pg";

/** Ce qu'un adaptateur demande à la base : une requête paramétrée. */
export interface Sql {
  query<Row>(text: string, params?: unknown[]): Promise<{ rows: Row[] }>;
}

export class PostgresClient implements Sql {
  readonly #pool: pg.Pool;

  constructor(url: string) {
    this.#pool = new pg.Pool({ connectionString: withLibpqSslModes(url) });
    // Une connexion au repos qui tombe ne doit pas arrêter le serveur : la
    // requête suivante en ouvre une autre.
    this.#pool.on("error", (err) => {
      console.error("[simulateur] connexion PostgreSQL perdue:", err);
    });
  }

  async query<Row>(text: string, params?: unknown[]) {
    const { rows } = await this.#pool.query(text, params);
    return { rows: rows as Row[] };
  }

  async close(): Promise<void> {
    await this.#pool.end();
  }
}

// ---- implémentation ----

// Scalingo pose `sslmode=prefer` dans l'URL. `pg` 8 lit `prefer` et `require`
// comme `verify-full`, et refuserait un certificat que ne signe pas une
// autorité publique. Le sens que leur donne libpq, et `psql` : la connexion est
// chiffrée, sans vérifier le certificat, à l'intérieur du réseau de Scalingo.
function withLibpqSslModes(url: string): string {
  const parsed = new URL(url);
  if (
    parsed.searchParams.has("sslmode") &&
    !parsed.searchParams.has("uselibpqcompat")
  ) {
    parsed.searchParams.set("uselibpqcompat", "true");
  }
  return parsed.toString();
}
