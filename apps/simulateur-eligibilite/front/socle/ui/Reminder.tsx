// Un rappel : un fait déjà connu, redit en clair avant la question qu'il aide
// à comprendre. C'est la mise en exergue du DSFR. Ce n'est pas un champ : il
// n'a rien à cocher ni à saisir.

type Props = { text: string };

export function Reminder({ text }: Props) {
  return (
    <div className="fr-highlight" style={{ margin: "0 0 1.5rem" }}>
      <p className="fr-text--sm">{text}</p>
    </div>
  );
}
