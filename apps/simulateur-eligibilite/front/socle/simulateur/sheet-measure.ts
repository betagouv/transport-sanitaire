// La mesure de la feuille sur sa mise en page d'impression, et non sur son
// aspect d'écran. Une copie de la feuille passe en papier (`data-paper`) hors
// de l'écran, à la largeur utile d'une A4 : ses hauteurs donnent la
// pagination (sheet-pagination.ts). La feuille affichée ne bouge pas. Le
// bouton « Imprimer » attend d'abord les polices et les dessins ; `beforeprint`
// ne peut rien attendre et mesure tout de suite. Le PDF (#129) la reprendra.

import {
  type MeasuredIllustration,
  type NoDrawing,
  type PrintLayout,
  printLayoutOf,
} from "./sheet-pagination";

/** Les polices chargées et les dessins décodés, puis la mesure. */
export async function measureWhenStable(
  sheet: HTMLElement,
): Promise<PrintLayout> {
  await stable(sheet);
  return measureSheet(sheet);
}

/** La mesure, tout de suite : la copie se pose, se mesure et se retire. */
export function measureSheet(sheet: HTMLElement): PrintLayout {
  const host = paperHost(sheet);
  try {
    const copy = host.firstElementChild as HTMLElement;
    const followUp = copy.querySelector(".socle-sheet-follow-up");
    const top = copy.getBoundingClientRect().top;
    return printLayoutOf({
      height: millimetres(copy.getBoundingClientRect().height),
      followUp: followUp ? blockOf(followUp, top) : undefined,
      illustrations: illustrationsOf(copy, sheet),
    });
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

// La copie, sans la mise en page d'une impression en cours, dans un hôte
// invisible, à 190 mm de large, hors de la visionneuse : ce que l'écran étroit
// change à la feuille ne s'y applique pas.
function paperHost(sheet: HTMLElement): HTMLElement {
  const copy = sheet.cloneNode(true) as HTMLElement;
  copy.removeAttribute("style");
  copy.removeAttribute("data-print-layout");
  copy.removeAttribute("data-print-pages");
  copy.setAttribute("data-paper", "");
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:absolute;top:0;left:-10000px;width:190mm;visibility:hidden;pointer-events:none";
  host.append(copy);
  document.body.append(host);
  return host;
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
