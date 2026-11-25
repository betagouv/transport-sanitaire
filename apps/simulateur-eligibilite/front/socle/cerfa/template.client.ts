// Le chargement d'un gabarit de cerfa servi comme asset de l'app.

/**
 * Le chargeur d'un gabarit servi comme asset de l'app. Un modèle en obtient
 * l'URL par `import url from "./gabarit.pdf?url"`.
 */
export function templateAt(url: string): () => Promise<ArrayBuffer> {
  return async () => {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Gabarit indisponible (HTTP ${response.status}).`);
    return response.arrayBuffer();
  };
}
