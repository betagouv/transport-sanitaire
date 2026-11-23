import { defineConfig } from "vite";

export default defineConfig({
  preview: {
    allowedHosts: [
      ".osc-secnum-fr1.scalingo.io",
      "data.transportsanitaire.beta.gouv.fr",
    ],
  },
});
