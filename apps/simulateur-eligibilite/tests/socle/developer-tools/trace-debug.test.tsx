import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DebugTrace } from "../../../front/socle/developer-tools/DebugTrace";
import {
  allerAuResultat,
  BOISSON,
  ouvrirLeSimulateur,
  question,
} from "../simulateur/questionnaire";

// La trace de debug est un developer tool. Elle s'ouvre sur tous les
// environnements, pour le seul service n° 4. Elle montre le chemin parcouru,
// les questions validées et leurs réponses, puis les faits et les cibles de la
// préconisation.
//
// Les tests passent par `App` : ils gardent le câblage, du service choisi au
// rattachement jusqu'au `DebugTrace` des écrans.

const TRACE_PARCOURS = /^Debug — chemin parcouru/;
const TRACE_RESULTAT = /^Debug — résultat/;

// Ce que le lien d'export donne à télécharger, relu comme un fichier.
function traceExportee() {
  const lien = screen.getByRole("link", { name: "Exporter la trace" });
  const [, contenu = ""] = (lien.getAttribute("href") ?? "").split(",");
  return { lien, trace: JSON.parse(decodeURIComponent(contenu)) };
}

describe("traces de debug", () => {
  it("restent fermées à un service ordinaire", async () => {
    const user = await ouvrirLeSimulateur();
    await question(BOISSON);
    expect(screen.queryByText(TRACE_PARCOURS)).toBeNull();

    await allerAuResultat(user);
    expect(screen.queryByText(TRACE_RESULTAT)).toBeNull();
  });

  it("s'ouvrent au service n° 4, sous le questionnaire puis sous le résultat", async () => {
    const user = await ouvrirLeSimulateur({ produit: true });
    await question(BOISSON);
    expect(screen.getByText(TRACE_PARCOURS)).toBeInTheDocument();

    await allerAuResultat(user);

    expect(screen.getByText(TRACE_RESULTAT)).toBeInTheDocument();
    expect(screen.getByText('"thé, lait"')).toBeInTheDocument();
    expect(screen.getByText("Faits :")).toBeInTheDocument();
    expect(screen.getByText('"thé"')).toBeInTheDocument();
  });

  it("montrent les questions validées, avec ce qui s'y proposait", async () => {
    const user = await ouvrirLeSimulateur({ produit: true });
    await allerAuResultat(user);

    expect(screen.getByText("Questions validées :")).toBeInTheDocument();
    expect(screen.getByText("the, cafe, rien")).toBeInTheDocument();
    expect(screen.getByText("lait, sucre, aucun")).toBeInTheDocument();
  });

  it("s'exportent en un fichier, pour la recette", async () => {
    const user = await ouvrirLeSimulateur({ produit: true });
    await allerAuResultat(user);

    const { lien, trace } = traceExportee();

    expect(lien).toHaveAttribute("download", "trace-de-debug.json");
    expect(trace).toMatchObject({
      title: "résultat",
      pages: ["boisson", "accompagnements"],
      answers: { boisson: "the", accompagnements: ["lait"] },
      validated: {
        boisson: { offered: ["the", "cafe", "rien"], answer: "the" },
      },
      faits: { boisson: "thé" },
      cibles: { commande: "thé, lait" },
    });
    expect(trace.app).toEqual({
      version: expect.any(String),
      commit: expect.any(String),
    });
  });
});

// Un fait a trois états, et une cible peut rester indéfinie. La trace le dit :
// le modèle factice n'a ni l'un ni l'autre, la trace est donc rendue ici.
describe("trace d'une préconisation incomplète", () => {
  const PRECONISATION = {
    title: "résultat",
    pages: [],
    answers: {},
    validated: { allergies: { offered: ["gluten"] } },
    faits: {
      fait_gluten: { value: false, provenance: "Proposé, pas coché." },
      fait_arachide: { provenance: "L'option ne s'est pas proposée." },
    },
    cibles: { cible_menu: undefined, cible_table: "GRANDE" },
  };

  it("dit d'une question validée qu'elle est restée sans réponse", () => {
    render(<DebugTrace {...PRECONISATION} />);
    expect(screen.getByText("sans réponse")).toBeInTheDocument();
  });

  it("donne la provenance d'un fait, établi ou absent", () => {
    render(<DebugTrace {...PRECONISATION} />);
    expect(screen.getByText(/Proposé, pas coché\./)).toBeInTheDocument();
    expect(
      screen.getByText(/L'option ne s'est pas proposée\./),
    ).toBeInTheDocument();
  });

  it("dit d'une cible qu'elle est indéfinie, à l'écran et dans l'export", () => {
    render(<DebugTrace {...PRECONISATION} />);

    expect(screen.getByText("indéfinie")).toBeInTheDocument();
    expect(traceExportee().trace.cibles).toEqual({
      cible_menu: "indéfinie",
      cible_table: "GRANDE",
    });
  });
});
