// Une date répondue, en objet valeur : ses deux formats, une saisie mal écrite
// qui n'est comparée à rien, et un changement d'heure qui ne décale rien.

import { describe, expect, it } from "vitest";
import { LocalDateTime } from "../../../core/socle/questionnaire-engine/local-date-time";

const date = LocalDateTime.parse;

describe("une date lisible", () => {
  it("se lit avec ou sans heure : sans heure, c'est minuit", () => {
    expect(date("2026-10-14").equals(date("2026-10-14T00:00"))).toBe(true);
    expect(date("2026-10-14").isBefore(date("2026-10-14T00:01"))).toBe(true);
  });

  it("se compare à une autre", () => {
    const neuf = date("2026-10-14T09:00");
    const dix = date("2026-10-14T10:00");
    expect([neuf.isBefore(dix), neuf.isAfter(dix)]).toEqual([true, false]);
    expect([neuf.isAtOrBefore(dix), neuf.isAtOrBefore(neuf)]).toEqual([
      true,
      true,
    ]);
    expect(dix.isAtOrBefore(neuf)).toBe(false);
  });

  it("avance de jours ou d'heures, mois et année compris", () => {
    expect(date("2026-12-31").plusDays(1).equals(date("2027-01-01"))).toBe(
      true,
    );
    expect(
      date("2026-10-14T23:00").plusHours(2).equals(date("2026-10-15T01:00")),
    ).toBe(true);
  });

  it("ne voit pas le changement d'heure du 25 octobre 2026", () => {
    expect(
      date("2026-10-24T09:00").plusHours(48).equals(date("2026-10-26T09:00")),
    ).toBe(true);
  });

  it("garde son jour, à minuit, sans l'heure", () => {
    expect(
      date("2026-10-14T23:59").startOfDay().equals(date("2026-10-14")),
    ).toBe(true);
  });
});

describe("une saisie mal écrite", () => {
  it.each([
    undefined,
    "",
    "2026-10",
    "14/10/2026",
    "2026-10-14T9h",
    "2026-10-14 09:00",
  ])("%j n'est comparée à rien, et n'égale rien", (saisie) => {
    const illisible = date(saisie);
    const lisible = date("2026-10-14");
    expect([
      illisible.isBefore(lisible),
      illisible.isAfter(lisible),
      illisible.isAtOrBefore(lisible),
      lisible.isAtOrBefore(illisible),
      illisible.equals(illisible),
      illisible.plusDays(1).startOfDay().equals(lisible),
    ]).toEqual([false, false, false, false, false, false]);
  });
});

describe("le jour de Paris", () => {
  it("est celui de Paris, et non celui du fuseau du poste", () => {
    const jour = (instant: string) =>
      LocalDateTime.dayInParis(new Date(instant)).day();
    expect(jour("2026-10-18T22:30:00Z")).toBe("2026-10-19");
    expect(jour("2026-12-31T22:59:00Z")).toBe("2026-12-31");
  });
});
