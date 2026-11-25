// L'assemblage des use cases de la mesure d'audience et du journal : un par geste
// de l'écran, branché sur l'audience et le journal que le conteneur du
// navigateur choisit.

import { AnswerAQuestion } from "./answer-a-question.usecase";
import type { Audience } from "./audience.port";
import { CloseASimulation } from "./close-a-simulation.usecase";
import { CompleteAQuestionnaire } from "./complete-a-questionnaire.usecase";
import { CorrectAnAnswer } from "./correct-an-answer.usecase";
import { DeliverADownload } from "./deliver-a-download.usecase";
import { DisplayADocument } from "./display-a-document.usecase";
import { DisplayAResult } from "./display-a-result.usecase";
import { FailADocument } from "./fail-a-document.usecase";
import type { Journal } from "./journal.port";
import { LaunchADocument } from "./launch-a-document.usecase";
import { LeaveAQuestionnaire } from "./leave-a-questionnaire.usecase";
import { OpenAPage } from "./open-a-page.usecase";
import { OpenAResultScreen } from "./open-a-result-screen.usecase";
import { PassAStep } from "./pass-a-step.usecase";
import { PressAButton } from "./press-a-button.usecase";
import { ReachAnAldResult } from "./reach-an-ald-result.usecase";
import { RevealQuestions } from "./reveal-questions.usecase";
import { SelectAnIntent } from "./select-an-intent.usecase";
import { StartAQuestionnaire } from "./start-a-questionnaire.usecase";
import { type Build, StartASimulation } from "./start-a-simulation.usecase";
import { WithdrawADocument } from "./withdraw-a-document.usecase";

/** Un use case par geste de l'écran, qui parle à l'audience, au journal, ou aux deux. */
export type AnalyticsUseCases = ReturnType<typeof analyticsUseCases>;

export function analyticsUseCases(
  audience: Audience,
  journal: Journal,
  build: Build,
) {
  return {
    startASimulation: new StartASimulation(journal, build),
    selectAnIntent: new SelectAnIntent(journal),
    closeASimulation: new CloseASimulation(journal),
    startAQuestionnaire: new StartAQuestionnaire(audience),
    openAPage: new OpenAPage(journal),
    revealQuestions: new RevealQuestions(journal),
    answerAQuestion: new AnswerAQuestion(journal),
    passAStep: new PassAStep(audience, journal),
    correctAnAnswer: new CorrectAnAnswer(journal),
    completeAQuestionnaire: new CompleteAQuestionnaire(audience, journal),
    openAResultScreen: new OpenAResultScreen(),
    displayAResult: new DisplayAResult(journal),
    displayADocument: new DisplayADocument(journal),
    failADocument: new FailADocument(journal),
    withdrawADocument: new WithdrawADocument(),
    pressAButton: new PressAButton(journal),
    launchADocument: new LaunchADocument(journal),
    deliverADownload: new DeliverADownload(journal),
    leaveAQuestionnaire: new LeaveAQuestionnaire(audience),
    reachAnAldResult: new ReachAnAldResult(audience),
  };
}
