// Un rappel : ce qui est déjà connu, redit avant la question qu'il éclaire. Ce
// n'est pas un champ : il n'a rien à cocher ni à saisir.
//
// Une phrase se rend en mise en exergue du DSFR. Des valeurs avec leur
// intitulé se rendent en liste de définitions, dans un encadré.

type LabelledValue = { label: string; value: string };

type Props = { reminder?: string | readonly LabelledValue[] };

export function Reminder({ reminder }: Props) {
  if (!reminder || reminder.length === 0) return null;
  return typeof reminder === "string" ? (
    <Sentence text={reminder} />
  ) : (
    <LabelledValues values={reminder} />
  );
}

// ---- implémentation ----

function Sentence({ text }: { text: string }) {
  return (
    <div className="fr-highlight" style={{ margin: "0 0 1.5rem" }}>
      <p className="fr-text--sm">{text}</p>
    </div>
  );
}

function LabelledValues({ values }: { values: readonly LabelledValue[] }) {
  return (
    <dl
      className="fr-text--sm"
      // Un encadré discret, pour ne pas le confondre avec un champ. Propriétés
      // longues : une variable CSS absente n'invalide alors que sa ligne.
      style={{
        margin: "0 0 1rem",
        padding: "0.75rem 1rem",
        background: "var(--background-alt-grey)",
        borderLeftWidth: "2px",
        borderLeftStyle: "solid",
        borderLeftColor: "var(--border-default-grey)",
      }}
    >
      {values.map(({ label, value }) => (
        <div key={label} style={{ display: "flex", gap: "0.5rem" }}>
          <dt>{label} :</dt>
          <dd style={{ margin: 0, fontWeight: 700 }}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
