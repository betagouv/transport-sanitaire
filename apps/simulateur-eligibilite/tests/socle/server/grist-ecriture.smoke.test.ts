// @vitest-environment node
//
// Smoke test d'écriture contre le vrai Grist, sans mock. Il crée de vraies
// lignes dans le référentiel : il ne tourne que sur demande explicite. Les lignes
// portent `Origine=formulaire` et un suffixe horodaté. Elles se purgent à la main.
//
//   GRIST_ECRITURE_TEST=1 GRIST_API_KEY=$(grep -E '^GRIST_API_KEY=' .env | cut -d= -f2-) \
//     pnpm test grist-ecriture
//
// Vérifie l'idempotence : deux enrichissements identiques créent une seule ligne.
// Prérequis : la colonne `Origine` sur `Etablissements` comme sur `Services_Unites`.

import { describe, expect, it } from "vitest";
import { lireConfiguration } from "../../../server/configuration.ts";
import { choisirReferentiel } from "../../../server/rattachement/referentiel-source.ts";

const actif =
  process.env.GRIST_ECRITURE_TEST === "1" &&
  !!process.env.GRIST_API_KEY?.trim();

describe.skipIf(!actif)(
  "écriture Grist depuis une saisie libre (smoke)",
  () => {
    const ref = choisirReferentiel(lireConfiguration().grist);

    it("service « Autre » : crée le vrai service, puis le déduplique", async () => {
      const marqueur = `TEST-SVC-${Date.now()}`;
      // Établissement « Libéral / CNAM / CPAM / Autre » (Id2=11), service « Autre ».
      // Le service saisi (`serviceLibre`) est créé sous l'établissement.
      const sel = {
        etabId: "11",
        serviceId: "0", // id « Autre » non utilisé par la branche serviceEstAutre
        serviceEstAutre: true as const,
        serviceLibre: marqueur,
      };

      await ref.enrichirDepuisSaisie!(sel);
      await ref.enrichirDepuisSaisie!(sel);

      // Le vrai service apparaît, une seule fois, dans les services de l'établissement.
      const services = await ref.listerServices("11");
      const svc = services.filter((s) => s.libelle === marqueur);
      expect(svc).toHaveLength(1);
    });

    it("établissement saisi : le crée avec son service, puis les déduplique", async () => {
      const marqueur = `TEST-ETAB-${Date.now()}`;
      const sel = {
        etabId: "",
        etabEstAutre: true as const,
        etabLibre: marqueur,
        serviceLibre: `${marqueur}-SVC`,
      };

      await ref.enrichirDepuisSaisie!(sel);
      await ref.enrichirDepuisSaisie!(sel);

      const etabs = (await ref.listerEtablissements()).filter(
        (e) => e.libelle === marqueur,
      );
      expect(etabs).toHaveLength(1);
      const services = await ref.listerServices(etabs[0]!.id);
      expect(
        services.filter((s) => s.libelle === `${marqueur}-SVC`),
      ).toHaveLength(1);
    });
  },
);
