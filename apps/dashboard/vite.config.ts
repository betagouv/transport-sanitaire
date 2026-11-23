import { defineConfig } from "vite";

export default defineConfig({
  preview: {
    allowedHosts: [
      ".osc-secnum-fr1.scalingo.io",
      ".transportsanitaire.beta.gouv.fr",
    ],
  },
});
