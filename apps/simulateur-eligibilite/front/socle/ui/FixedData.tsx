// Des données fixées : des valeurs déjà décidées, montrées près du champ
// qu'elles concernent. Une liste de définitions, sans rien à saisir.

type Props = { data: ReadonlyArray<{ label: string; value: string }> };

export function FixedData({ data }: Props) {
  if (data.length === 0) return null;
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
      {data.map(({ label, value }) => (
        <div key={label} style={{ display: "flex", gap: "0.5rem" }}>
          <dt>{label} :</dt>
          <dd style={{ margin: 0, fontWeight: 700 }}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
