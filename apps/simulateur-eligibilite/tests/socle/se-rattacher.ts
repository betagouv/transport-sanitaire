// Helpers pour franchir l'écran de rattachement dans les tests : un
// rattachement ordinaire, qui ouvre le simulateur dès le service choisi.

import { screen, within } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";

type User = ReturnType<typeof userEvent.setup>;

async function choisir(user: User, label: RegExp, option: string) {
  const select = screen.getByRole("combobox", { name: label });
  await within(select).findByRole("option", { name: option });
  await user.selectOptions(select, option);
}

/** Franchit l'écran de rattachement : le simulateur s'ouvre dès le service choisi. */
export async function seRattacher(user: User) {
  await choisir(user, /Établissement/, "CHU Grenoble Alpes");
  await choisir(user, /Nom du service/, "Cardiologie");
}
