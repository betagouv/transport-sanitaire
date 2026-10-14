// Les messages d'un champ en erreur, une ligne chacun.

export function ErrorLines({ errors }: { errors: readonly string[] }) {
  return errors.map((error) => (
    <span key={error} style={{ display: "block" }}>
      {error}
    </span>
  ));
}
