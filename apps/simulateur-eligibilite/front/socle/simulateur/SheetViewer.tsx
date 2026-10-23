// La feuille à remettre au patient, dans sa visionneuse : une A4 blanche sur un
// fond gris, sous une barre qui l'imprime. Les logos du Ministère et de
// l'Assurance Maladie sont en tête : ils ne changent pas avec le modèle. À
// l'impression, la feuille passe en papier et sort seule, sur une ou deux A4
// selon sa mesure (paper-print.ts). Les gabarits de l'éditeur en font foi.

import { useRef, useState } from "react";
import type { Sheet } from "../model";
import assuranceMaladie from "./logos/assurance-maladie.svg";
import ministere from "./logos/ministere-de-la-sante.svg";
import { usePaperPrint } from "./paper-print";
import { paperAttributes } from "./sheet-pagination";
import "./sheet-viewer.css";
import "./sheet-numbered-steps.css";
import "./sheet-paper.css";
import "./sheet-viewer-print.css";

export function SheetViewer({ sheet }: { sheet: Sheet }) {
  const article = useRef<HTMLElement>(null);
  const { layout, print } = usePaperPrint(article);
  return (
    <section aria-label="Aperçu de la fiche patient" className="socle-viewer">
      <div className="socle-viewer__actions fr-no-print">
        <button type="button" className="socle-viewer__button" onClick={print}>
          <PrintIcon />
          Imprimer
        </button>
      </div>
      <div className="socle-viewer__host">
        <article
          aria-label="Fiche explicative patient"
          className="socle-sheet"
          ref={article}
          {...paperAttributes(layout)}
        >
          <header className="socle-sheet__logos">
            {LOGOS.map((logo) => (
              <Logo key={logo.name} {...logo} />
            ))}
          </header>
          <h2 className="socle-sheet__title">{sheet.title}</h2>
          {sheet.intro && <p className="socle-sheet__intro">{sheet.intro}</p>}
          {sheet.body}
        </article>
      </div>
    </section>
  );
}

// ---- implémentation ----

type LogoProps = { name: string; src: string; className: string };

const LOGOS: readonly LogoProps[] = [
  {
    name: "Ministère de la Santé, des Familles, de l’Autonomie et des Personnes handicapées",
    src: ministere,
    className: "socle-sheet__logo",
  },
  {
    name: "L’Assurance Maladie",
    src: assuranceMaladie,
    className: "socle-sheet__logo socle-sheet__logo--ameli",
  },
];

// Un logo qui ne se charge pas laisse son nom à sa place.
function Logo({ name, src, className }: LogoProps) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={className}>
      {failed ? (
        <span className="socle-sheet__logo-fallback">{name}</span>
      ) : (
        <img alt={name} src={src} onError={() => setFailed(true)} />
      )}
    </div>
  );
}

// L'imprimante des gabarits.
function PrintIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6zM17 11h1" />
    </svg>
  );
}
