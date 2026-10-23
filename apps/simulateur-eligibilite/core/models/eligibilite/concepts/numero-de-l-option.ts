// Le numéro d'une option au catalogue de l'éditeur. Son slug le porte en tête
// (D-75) : « 8_BRANCARDAGE » est l'option 8. Les textes de R2 le lisent, pour
// les critères de Q1.2 et le motif de Q2.1.

/** Le slug d'une option : son numéro au catalogue, puis ce qu'elle veut dire. */
type Slug = `${number}_${string}`;

/** Le numéro au catalogue de cette option. */
export function numeroDeLOption(option: Slug): number {
  return Number.parseInt(option, 10);
}
