// Le numéro d'une option, lu en tête de son slug (D-75).

import { describe, expect, it } from "vitest";
import { numeroDeLOption } from "../../../../core/models/eligibilite/concepts/numero-de-l-option";

describe("le numéro d'une option", () => {
  it.each([
    ["8_BRANCARDAGE", 8],
    ["11_PERMISSION", 11],
    ["1_SEUL", 1],
  ] as const)("%s : %i", (option, attendu) => {
    expect(numeroDeLOption(option)).toBe(attendu);
  });
});
