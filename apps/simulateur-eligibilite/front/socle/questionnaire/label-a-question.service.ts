// Le libellé d'une question, ou d'un champ, tel qu'il s'affiche : facultatif,
// il le dit.

export class LabelAQuestionService {
  static displayedLabel(label: string, optional?: boolean): string {
    return optional ? `${label} (facultatif)` : label;
  }
}
