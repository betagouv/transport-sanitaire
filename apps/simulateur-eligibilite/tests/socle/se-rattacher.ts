// Helpers pour franchir l'écran de rattachement dans les tests.
//
// Deux rattachements : un ordinaire, qui ouvre le simulateur dès le service
// choisi, et un sur le service n° 4 (« Transport Sanitaire »), le seul à
// déverrouiller les developer tools, qui garde un bouton.

import { screen, within } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";

type User = ReturnType<typeof userEvent.setup>;

async function choisir(user: User, label: RegExp, option: string) {
  const select = screen.getByRole("combobox", { name: label });
  await within(select).findByRole("option", { name: option });
  await user.selectOptions(select, option);
}

/** Remplit un rattachement ordinaire : le simulateur s'ouvre dès le service choisi. */
export async function remplirRattachement(user: User) {
  await choisir(user, /Établissement/, "CHU Grenoble Alpes");
  await choisir(user, /Nom du service/, "Cardiologie");
}

/** Remplit un rattachement sur le service n° 4, developer tools déverrouillés. */
export async function remplirRattachementProduit(user: User) {
  await choisir(user, /Établissement/, "Transport Sanitaire");
  await choisir(user, /Nom du service/, "Transport Sanitaire");
}

const acceder = (user: User) =>
  user.click(screen.getByRole("button", { name: "Accéder au simulateur" }));

/** Franchit l'écran de rattachement avec un rattachement ordinaire. */
export async function seRattacher(user: User) {
  await remplirRattachement(user);
}

/** Franchit l'écran de rattachement avec le service n° 4, puis entre dans le simulateur. */
export async function seRattacherProduit(user: User) {
  await remplirRattachementProduit(user);
  await acceder(user);
}
