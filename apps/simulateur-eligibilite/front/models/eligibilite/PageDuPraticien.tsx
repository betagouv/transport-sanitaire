// La page du praticien : ce que la caisse, l'établissement, la permission, la
// convocation et le transport à l'étranger montrent à la place d'une fiche
// patient (D-112). Elle range un `TexteDuPraticien` sous le titre et
// l'introduction que le socle place ; elle n'écrit que ses intertitres, ceux
// des gabarits de l'éditeur.

import { NumberedCards, Panel } from "../../socle";
import type { ElementDuPourquoi, TexteDuPraticien } from "./texte-du-praticien";

export function PageDuPraticien({ texte }: { texte: TexteDuPraticien }) {
  return (
    <>
      {texte.pourquoi && <Pourquoi pourquoi={texte.pourquoi} />}
      <Questions questions={texte.questions} />
      <NumberedCards title="Que faire maintenant ?" items={texte.actions} />
      {texte.avertissement && <p className="fr-mt-4w">{texte.avertissement}</p>}
    </>
  );
}

// ---- implémentation ----

type PourquoiProps = { pourquoi: NonNullable<TexteDuPraticien["pourquoi"]> };

function Pourquoi({ pourquoi }: PourquoiProps) {
  return (
    <Panel variant="grey" title={pourquoi.titre} divided>
      {pourquoi.elements.map((element) => (
        <Element key={element.texte} element={element} />
      ))}
    </Panel>
  );
}

function Element({ element }: { element: ElementDuPourquoi }) {
  return (
    <div>
      {element.titre && (
        <h3 className="fr-text--md fr-text--bold fr-mb-1v">{element.titre}</h3>
      )}
      <p className="fr-mb-0">{element.texte}</p>
    </div>
  );
}

// Sans question, l'encadré n'a rien à dire : il ne s'affiche pas.
function Questions({ questions }: { questions: readonly string[] }) {
  if (questions.length === 0) return null;
  return (
    <Panel variant="blue" title="Questions à transmettre à la caisse">
      <p className="fr-text--sm">
        Ces questions reprennent les points non tranchés. La caisse pourra
        préciser le document, le circuit et le financeur applicables.
      </p>
      <ul>
        {questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>
    </Panel>
  );
}
