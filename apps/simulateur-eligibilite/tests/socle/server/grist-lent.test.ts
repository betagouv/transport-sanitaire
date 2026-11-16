// @vitest-environment node
//
// Un Grist qui ne répond pas : l'appel rend la main à son délai maximal, au
// lieu de laisser pendre la requête du simulateur.

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { GristApiClient } from "../../../server/grist/grist-api.client.ts";

let muet: Server;
afterEach(() => {
  muet.closeAllConnections();
  muet.close();
});

// Un serveur qui accepte la connexion et ne répond jamais.
async function gristMuet(): Promise<string> {
  muet = createServer(() => {});
  await new Promise<void>((resolve) => muet.listen(0, resolve));
  return `http://127.0.0.1:${(muet.address() as AddressInfo).port}`;
}

describe("un Grist qui ne répond pas", () => {
  it("une lecture échoue à son délai maximal", async () => {
    const grist = new GristApiClient(
      { docUrl: await gristMuet(), cleApi: "test" },
      { timeout: 50 },
    );

    await expect(grist.rows("Etablissements")).rejects.toThrow(/timeout/i);
  });

  it("une écriture aussi", async () => {
    const grist = new GristApiClient(
      { docUrl: await gristMuet(), cleApi: "test" },
      { timeout: 50 },
    );

    await expect(grist.addRow("Evenements", {})).rejects.toThrow(/timeout/i);
  });
});
