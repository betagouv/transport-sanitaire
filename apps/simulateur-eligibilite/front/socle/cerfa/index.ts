// Ce que le cerfa promet au reste de l'écran et au modèle : décrire un
// formulaire, le relier aux réponses, le générer, et les boutons qui le
// téléchargent.

export { CerfaDocument } from "./CerfaDocument";
export {
  at,
  box,
  type Cerfa,
  type CerfaDto,
  date,
  drawnBox,
  type StrictOptions,
  strictDrawing,
  strictText,
  templateAt,
  text,
} from "./cerfa";
export {
  type BoundCerfa,
  bindCerfa,
  type CerfaMapping,
  cerfaValue,
  dtoFrom,
} from "./generate-the-cerfa/compute-the-dto";
export {
  type GeneratedCerfa,
  generateCerfa,
  type Overflowing,
} from "./generate-the-cerfa/generate-the-cerfa";
export { download, fileNameOf } from "./pdf/download-a-pdf";
export {
  PdfActionButton,
  type PdfSignals,
  useShown,
} from "./pdf/PdfActionButton";
export type { StrictTextEdits } from "./StrictTexts";
export { useTextCounters } from "./text-counters.hook";
