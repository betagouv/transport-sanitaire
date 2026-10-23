// Mener P3 jusqu'à R3, à l'écran, comme un prescripteur pressé : chaque champ
// obligatoire reçoit la première réponse qui convient, « Non » ou « Aucun »
// quand la question les propose, puis la page se valide. Les tests de R3 n'y
// lisent pas les réponses : ils regardent la page où elles mènent.

import { screen, waitFor } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";

type User = ReturnType<typeof userEvent.setup>;

/** Remplit P3, page après page, jusqu'au texte de R3. */
export async function completerP3(user: User) {
  for (let geste = 0; geste < 60; geste++) {
    if (screen.queryByText(TEXTE_DE_R3)) return;
    const manque = premierChampVide();
    if (manque) await manque(user);
    else await valider(user);
  }
  throw new Error("P3 ne mène pas à R3.");
}

// ---- implémentation ----

const TEXTE_DE_R3 = /^Le document est prêt à être imprimé\./;

type Geste = (user: User) => Promise<void>;

/** Tous les champs obligatoires de la page ont leur réponse. */
type PageRemplie = undefined;

// Le premier champ obligatoire sans réponse, et ce qu'on y répond.
function premierChampVide(): Geste | PageRemplie {
  return (
    nombreVide() ?? listeVide() ?? texteVide() ?? choixVide() ?? casesVides()
  );
}

function nombreVide(): Geste | PageRemplie {
  const champ = screen
    .queryAllByRole("spinbutton")
    .find((element) => (element as HTMLInputElement).value === "");
  return champ && ((user) => user.type(champ, "1"));
}

// Un lieu se dit domicile s'il le peut : il n'a pas de nom à saisir.
function listeVide(): Geste | PageRemplie {
  const liste = screen
    .queryAllByRole("combobox")
    .find((element) => (element as HTMLSelectElement).value === "");
  if (!liste) return undefined;
  const options = [...(liste as HTMLSelectElement).options];
  const choisie =
    options.find((option) => option.text.startsWith("Domicile")) ??
    options.find((option) => option.value !== "");
  return choisie && ((user) => user.selectOptions(liste, choisie));
}

function texteVide(): Geste | PageRemplie {
  const champ = screen
    .queryAllByRole("textbox")
    .find(
      (element) =>
        (element as HTMLInputElement).value === "" &&
        !nomDe(element).includes("facultatif"),
    );
  return champ && ((user) => user.type(champ, saisiePour(nomDe(champ))));
}

function saisiePour(nom: string): string {
  if (nom.startsWith("Numéro et voie")) return voie();
  if (nom.startsWith("Code postal")) return "75001";
  if (nom.startsWith("Commune")) return "Paris";
  return "Précision";
}

// Un groupe de boutons radio sans réponse : « Non » s'il le propose.
function choixVide(): Geste | PageRemplie {
  const groupe = groupesDe("radio").find((radios) =>
    radios.every((radio) => !radio.checked),
  );
  const choisi =
    groupe?.find((radio) => nomDe(radio) === "Non") ??
    groupe?.find((radio) => !radio.disabled);
  return choisi && ((user) => user.click(choisi));
}

// Un groupe de cases sans case cochée, qui propose « Aucun… ».
function casesVides(): Geste | PageRemplie {
  const aucune = groupesDe("checkbox")
    .filter((cases) => cases.every((boite) => !boite.checked))
    .flatMap((cases) => cases.filter((boite) => /^Aucun/.test(nomDe(boite))))
    .at(0);
  return aucune && ((user) => user.click(aucune));
}

// Une page à une seule question à choix avance seule : on attend la suivante.
async function valider(user: User) {
  const suite = boutonDeSuite();
  if (!suite) return await waitFor(pageSuivante);
  if (suite.disabled) {
    throw new Error(`La page de P3 ne se valide pas. ${texteDeLaPage()}`);
  }
  await user.click(suite);
}

/** La page n'a ni « Terminer » ni « Suivant ». */
type PageQuiAvanceSeule = undefined;

function boutonDeSuite(): HTMLButtonElement | PageQuiAvanceSeule {
  const bouton =
    screen.queryByRole("button", { name: "Terminer" }) ??
    screen.queryByRole("button", { name: "Suivant" });
  return (bouton as HTMLButtonElement | null) ?? undefined;
}

function pageSuivante() {
  if (!boutonDeSuite() && !screen.queryByText(TEXTE_DE_R3)) {
    throw new Error(`La page de P3 n'avance pas. ${texteDeLaPage()}`);
  }
}

function texteDeLaPage(): string {
  return document.querySelector("main")?.textContent?.slice(0, 600) ?? "";
}

// Le départ et l'arrivée n'ont pas la même adresse : le trajet n'existerait pas.
function voie(): string {
  const arrivee = screen.queryByText("Adresse du lieu d’arrivée");
  return arrivee ? "2 rue B" : "1 rue A";
}

function groupesDe(role: "radio" | "checkbox"): HTMLInputElement[][] {
  const groupes = new Map<string, HTMLInputElement[]>();
  for (const element of screen.queryAllByRole(role)) {
    const input = element as HTMLInputElement;
    groupes.set(input.name, [...(groupes.get(input.name) ?? []), input]);
  }
  return [...groupes.values()];
}

function nomDe(element: HTMLElement): string {
  const id = element.id;
  const label = id ? document.querySelector(`label[for="${id}"]`) : null;
  return (
    label?.textContent ??
    element.getAttribute("aria-label") ??
    ""
  ).trim();
}
