// Une déclaration du questionnaire qui ne tient pas : une question à deux
// places sur une page, une garde qui lit une question d'après elle, une option
// qui a l'air d'un entier… Elle s'arrête au chargement, ou à la première
// lecture, avant qu'un prescripteur ne la voie.

/** Le questionnaire est mal déclaré : le message dit où, et comment le corriger. */
export class QuestionnaireDeclarationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestionnaireDeclarationError";
  }
}
