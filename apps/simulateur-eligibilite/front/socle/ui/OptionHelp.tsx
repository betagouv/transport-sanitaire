// L'aide des options d'un choix : pour chaque option qui en a une, un
// accordéon du DSFR, replié. Il s'ouvre au clavier, et l'ouvrir ne répond à
// rien.

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";

export type Help = { label: string; items: readonly string[] };

type Props = {
  options: ReadonlyArray<{ value: string; help?: Help }>;
};

export function OptionHelp({ options }: Props) {
  const helps = options.flatMap(({ value, help }) =>
    help ? [{ value, help }] : [],
  );
  if (helps.length === 0) return null;
  return (
    <div className="fr-accordions-group" style={{ marginBottom: "1.5rem" }}>
      {helps.map(({ value, help }) => (
        <Accordion key={value} label={help.label} titleAs="h2">
          <ul>
            {help.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Accordion>
      ))}
    </div>
  );
}
