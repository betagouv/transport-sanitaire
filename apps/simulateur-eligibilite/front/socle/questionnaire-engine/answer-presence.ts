// Une réponse est-elle là ? Sans réponse, la question attend encore la
// validation de sa page, ou ne se pose pas. Ce n'est pas `isAnswered`, qui dit
// si une réponse suffit à quitter sa page.

/** La question a reçu sa réponse. */
export function answerPresent<Answer>(
  answer: Answer | undefined,
): answer is Answer {
  return answer !== undefined;
}

/** La question n'a pas reçu de réponse. */
export function answerAbsent<Answer>(
  answer: Answer | undefined,
): answer is undefined {
  return answer === undefined;
}
