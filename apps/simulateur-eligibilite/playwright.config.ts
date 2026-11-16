// Les parcours en navigateur réel (`pnpm test:navigateur`) : le simulateur construit,
// servi par son serveur, embarqué en iframe dans une page d'une autre origine,
// sous Chromium et WebKit.
//
// Vitest et happy-dom éprouvent la logique à l'écran. Ils ne disent rien de ce
// qu'un vrai navigateur refuse à une iframe : c'est ce que ces parcours
// vérifient, et rien d'autre.

import { defineConfig, devices } from "@playwright/test";
import { ORIGINE_HOTE, PORT_HOTE } from "./navigateur/page-hote.ts";
import {
  ORIGINE_SIMULATEUR,
  PORT_SIMULATEUR,
} from "./navigateur/simulateur.ts";

export default defineConfig({
  testDir: "navigateur",
  testMatch: "**/*.e2e.ts",
  outputDir: "navigateur/resultats",
  // Un parcours qui échoue une fois sur deux est un défaut : pas de reprise.
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: ORIGINE_HOTE, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      // Le front construit : `pnpm test:navigateur` le construit avant.
      command: "node server/server.ts",
      env: { PORT: String(PORT_SIMULATEUR) },
      url: `${ORIGINE_SIMULATEUR}/robots.txt`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "node navigateur/page-hote.ts",
      url: ORIGINE_HOTE,
      env: { PORT: String(PORT_HOTE) },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
