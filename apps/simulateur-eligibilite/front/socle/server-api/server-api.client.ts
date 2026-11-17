// Le client HTTP du backend, préconfiguré : la même origine, sous `/api`, en
// JSON. Une réponse en erreur lève une `ServerApiError`, qui garde son statut :
// l'appelant décide s'il réessaie.

export class ServerApiError extends Error {
  readonly status: number;

  constructor(path: string, status: number) {
    super(`API ${path} → HTTP ${status}`);
    this.status = status;
  }
}

export class ServerApiClient {
  readonly #base: string;

  constructor(base = "/api") {
    this.#base = base;
  }

  async get<T>(path: string, query: Record<string, string> = {}): Promise<T> {
    const search = new URLSearchParams(query).toString();
    const response = await this.#request(search ? `${path}?${search}` : path);
    return (await response.json()) as T;
  }

  /** `keepalive` : l'envoi survit à la fermeture de l'onglet. */
  async post(
    path: string,
    body: unknown,
    { keepalive = false }: { keepalive?: boolean } = {},
  ): Promise<void> {
    await this.#request(path, {
      method: "POST",
      keepalive,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  /** Envoie `body`, et lit la réponse. `timeout`, en ms, l'abandonne. */
  async postAndRead<T>(
    path: string,
    body: unknown,
    { timeout }: { timeout: number },
  ): Promise<T> {
    const response = await this.#request(path, {
      method: "POST",
      signal: AbortSignal.timeout(timeout),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json()) as T;
  }

  async #request(path: string, init?: RequestInit): Promise<Response> {
    const response = await fetch(`${this.#base}${path}`, init);
    if (!response.ok) throw new ServerApiError(path, response.status);
    return response;
  }
}
