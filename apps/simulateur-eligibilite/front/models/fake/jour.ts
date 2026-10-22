// Les jours que le questionnaire de démonstration borne et que ses situations
// de référence remplissent, comptés depuis aujourd'hui.

/**
 * Le jour qu'il sera dans `days` jours, à l'heure locale, écrit comme la
 * réponse d'une date : `2026-10-12`.
 */
export function dayFromToday(days: number): string {
  const day = new Date();
  day.setDate(day.getDate() + days);
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  return `${day.getFullYear()}-${month}-${date}`;
}
