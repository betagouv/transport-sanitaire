// L'aide d'une option : un lien qui déplie une liste, juste sous l'option. Il
// s'ouvre au clavier, et l'ouvrir ne répond à rien.

import { useId, useState } from "react";

export type Help = { label: string; items: readonly string[] };

type Props = { help: Help };

export function OptionHelp({ help }: Props) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  return (
    <div style={{ margin: "0 0 1rem" }}>
      <button
        type="button"
        className="fr-link fr-link--sm"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
      >
        {help.label}
      </button>
      <ul id={listId} hidden={!open} className="fr-text--sm fr-mt-1v fr-mb-0">
        {help.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
