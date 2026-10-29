// Les blocs des consignes des fiches patient : un paragraphe, ou une liste à
// puces. Le catalogue les écrit en texte à balisage léger, `<br>` pour les
// lignes, « • » pour une puce, `[badges]` pour les besoins que la trace
// établit. Une fonction pure, sans React ; elle n'écrit aucun mot.

/** Une puce de liste ; avec des badges, c'est la légende qui les introduit. */
export type Puce = {
  readonly texte: string;
  readonly badges?: readonly string[];
};

/** Un bloc d'une étape : un paragraphe, ou une liste à puces. */
export type BlocDeConsigne =
  | { readonly type: "paragraphe"; readonly texte: string }
  | { readonly type: "liste"; readonly puces: readonly Puce[] };

/**
 * Les blocs d'un texte du catalogue à sauts et à puces, sans étape : un
 * paragraphe par ligne, une liste par suite de puces.
 */
export function blocsDuTexte(texte: string): BlocDeConsigne[] {
  const lignes = texte.split("<br>").filter((ligne) => ligne.trim() !== "");
  return blocsDesLignes(lignes, []);
}

/**
 * Les blocs de ces lignes : celles qui se suivent avec une puce font une
 * liste ; les autres, chacune un paragraphe. La puce du repère `[badges]`
 * prend ces badges, et disparaît sans eux.
 */
export function blocsDesLignes(
  lignes: readonly string[],
  badges: readonly string[],
): BlocDeConsigne[] {
  const blocs: BlocDeConsigne[] = [];
  for (const ligne of lignes) {
    const dernier = blocs.at(-1);
    if (!PUCE.test(ligne)) {
      blocs.push({ type: "paragraphe", texte: ligne.trim() });
      continue;
    }
    const puce = puceDe(ligne.replace(PUCE, "").trim(), badges);
    if (!puce) continue;
    if (dernier?.type === "liste") {
      blocs[blocs.length - 1] = { ...dernier, puces: [...dernier.puces, puce] };
    } else blocs.push({ type: "liste", puces: [puce] });
  }
  return blocs;
}

// ---- implémentation ----

const BADGES = "[badges]";
const PUCE = /^\s*•\s*/;

// « et les besoins particuliers suivants : [badges]. » devient sa légende et
// ses badges. Sans badge, la puce disparaît.
function puceDe(texte: string, badges: readonly string[]): Puce | null {
  if (!texte.includes(BADGES)) return { texte };
  if (badges.length === 0) return null;
  return { texte: texte.split(BADGES)[0]?.trim() ?? "", badges };
}
