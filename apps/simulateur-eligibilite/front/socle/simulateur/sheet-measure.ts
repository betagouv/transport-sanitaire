// La mesure de la feuille sur sa mise en page d'impression, et non sur son
// aspect d'écran. Une copie de la feuille passe en papier (`data-paper`) hors
// de l'écran, à la largeur utile d'une A4 : ses hauteurs donnent la
// pagination (sheet-pagination.ts). La feuille affichée ne bouge pas. Le
// bouton « Imprimer » attend d'abord les polices et les dessins ; `beforeprint`
// ne peut rien attendre et mesure tout de suite. Le PDF pose la même copie,
// à la mise en page retenue, et la photographie.

import {
  type MeasuredIllustration,
  type NoDrawing,
  type NoFollowUp,
  type NotPrinting,
  type PrintLayout,
  printLayoutOf,
} from "./sheet-pagination";

/** La copie en papier, et où son bloc de suivi commence, en millimètres. */
export type PaperCopy = {
  copy: HTMLElement;
  height: number;
  followUpTop: number | NoFollowUp;
};

/** Les polices chargées et les dessins décodés, puis la mesure. */
export async function measureWhenStable(
  sheet: HTMLElement,
): Promise<PrintLayout> {
  await stable(sheet);
  return measureSheet(sheet);
}

/** La mesure, tout de suite : la copie se pose, se mesure et se retire. */
export function measureSheet(sheet: HTMLElement): PrintLayout {
  const host = paperHost(sheet, null);
  try {
    const copy = host.firstElementChild as HTMLElement;
    return printLayoutOf({
      ...heightsOf(copy),
      illustrations: illustrationsOf(copy, sheet),
    });
  } finally {
    host.remove();
  }
}

/**
 * La copie en papier à la mise en page `layout`, posée hors de l'écran le
 * temps de `use`, puis retirée.
 */
export async function onPaperCopy<T>(
  sheet: HTMLElement,
  layout: PrintLayout,
  use: (paper: PaperCopy) => Promise<T>,
): Promise<T> {
  const host = paperHost(sheet, layout);
  try {
    const copy = host.firstElementChild as HTMLElement;
    const { height, followUp } = heightsOf(copy);
    return await use({ copy, height, followUpTop: followUp?.top });
  } finally {
    host.remove();
  }
}

// ---- implémentation ----

// Les CSS fixent le millimètre à 96 / 25,4 pixels, quel que soit l'écran.
const PIXELS_PER_MM = 96 / 25.4;

// Un dessin qui ne se décode pas n'arrête pas l'impression.
const STABLE_AFTER_MS = 2000;

const ZONE = ".socle-illustrated-cards__media";

function millimetres(pixels: number): number {
  return pixels / PIXELS_PER_MM;
}

// La copie, à la mise en page `layout` et non à celle d'une impression en
// cours, dans un hôte hors de l'écran, à 190 mm de large, hors de la
// visionneuse : ce que l'écran étroit change à la feuille ne s'y applique pas.
// L'hôte reste visible, pour que la photo du PDF voie la copie : il est hors
// de l'écran, caché aux lecteurs d'écran et inerte.
function paperHost(
  sheet: HTMLElement,
  layout: PrintLayout | NotPrinting,
): HTMLElement {
  const copy = sheet.cloneNode(true) as HTMLElement;
  copy.removeAttribute("style");
  copy.removeAttribute("data-print-layout");
  copy.removeAttribute("data-print-pages");
  copy.setAttribute("data-paper", "");
  if (layout?.kind === "two-pages") {
    copy.style.setProperty(
      "--socle-sheet-illustration-zone",
      `${layout.illustrationZone}mm`,
    );
  }
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.inert = true;
  host.style.cssText =
    "position:absolute;top:0;left:-10000px;width:190mm;pointer-events:none";
  host.append(copy);
  document.body.append(host);
  return host;
}

// La hauteur de la copie, et la place de son bloc de suivi.
function heightsOf(copy: HTMLElement) {
  const followUp = copy.querySelector(".socle-sheet-follow-up");
  const { top, height } = copy.getBoundingClientRect();
  return {
    height: millimetres(height),
    followUp: followUp ? blockOf(followUp, top) : undefined,
  };
}

function blockOf(block: Element, sheetTop: number) {
  const { top, height } = block.getBoundingClientRect();
  return { top: millimetres(top - sheetTop), height: millimetres(height) };
}

// Les zones se mesurent sur la copie ; les dessins se lisent sur la feuille
// affichée, chargés, alors que ceux de la copie se chargent à nouveau.
function illustrationsOf(
  copy: HTMLElement,
  sheet: HTMLElement,
): MeasuredIllustration[] {
  const drawings = [...sheet.querySelectorAll(ZONE)].map((zone) =>
    zone.querySelector("img"),
  );
  return [...copy.querySelectorAll(ZONE)].map((zone, rang) => ({
    zoneWidth: millimetres(zone.clientWidth),
    zoneHeight: millimetres(zone.clientHeight),
    ratio: ratioOf(drawings[rang]),
  }));
}

function ratioOf(
  drawing: HTMLImageElement | null | undefined,
): number | NoDrawing {
  if (!drawing || drawing.hidden || drawing.naturalHeight === 0) return;
  return drawing.naturalWidth / drawing.naturalHeight;
}

async function stable(sheet: HTMLElement): Promise<void> {
  const drawings = [...sheet.querySelectorAll("img")].map((image) =>
    image.decode?.().catch(() => undefined),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise((resolve) => {
    timer = setTimeout(resolve, STABLE_AFTER_MS);
  });
  await Promise.race([Promise.all([document.fonts?.ready, ...drawings]), late]);
  clearTimeout(timer);
}
