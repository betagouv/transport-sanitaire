// Les messages d'un champ en erreur, une ligne chacun.
//
// Le message d'erreur du DSFR est une boîte flexible : l'icône, puis le texte.
// Les lignes vont donc dans une seule boîte, sinon elles se rangent en colonnes
// à côté de l'icône.

export function ErrorLines({ errors }: { errors: readonly string[] }) {
  return (
    <span style={{ display: "flex", flexDirection: "column" }}>
      {errors.map((error) => (
        <span key={error}>{error}</span>
      ))}
    </span>
  );
}
