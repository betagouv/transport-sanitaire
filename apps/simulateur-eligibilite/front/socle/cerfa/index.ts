// Ce que le cerfa promet au reste de l'écran et au modèle : décrire un
// formulaire, le relier aux réponses, le générer, et les boutons qui le
// téléchargent.

export { CerfaDocument } from "./CerfaDocument";
export { CerfaFactory } from "./cerfa.factory";
export type {
  BoundCerfa,
  Cerfa,
  StrictOptions,
} from "./cerfa.types";
export { CerfaUseCasesProvider } from "./cerfa-use-cases-in-the-tree.hook";
export { type CerfaUseCases, cerfaUseCases } from "./container";
export {
  type GeneratedCerfa,
  GenerateTheCerfa,
  type Overflowing,
} from "./generate-the-cerfa.usecase";
export { DownloadAPdfService } from "./pdf/download-a-pdf.service";
export {
  PdfActionButton,
  type PdfSignals,
  useShown,
} from "./pdf/PdfActionButton";
export { PdfFileName } from "./pdf/pdf-file-name.vo";
export { PdfLibCerfaAdapter } from "./pdf-lib/pdf-lib-cerfa.adapter";
export type { StrictTextEdits } from "./StrictTexts";
export { templateAt } from "./template.client";
export { useTextCounters } from "./text-counters.hook";
