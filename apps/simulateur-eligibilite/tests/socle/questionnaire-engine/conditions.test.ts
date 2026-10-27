// Les conditions du socle : une valeur qui sait ce qu'elle lit. Dans un fait,
// `answer()` lit la réponse validée. Une date illisible donne « non » à toute
// comparaison. Leur lecture dans une garde a ses propres tests
// (`conditions-dans-une-garde.test.ts`).

import { describe, expect, it } from "vitest";
import type { Cible, Fait } from "../../../core/socle";
import { givenOf, page, questionsOf } from "../../../core/socle";
import { validatedReading } from "../../../core/socle/questionnaire-engine/answer-readings";
import type { Reading } from "../../../core/socle/questionnaire-engine/condition";
import { LocalDateTime } from "../../../core/socle/questionnaire-engine/local-date-time";
import type {
  Answers,
  Page,
} from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";

type Questions = {
  boisson: "the" | "cafe" | "eau";
  taille: "petit" | "grand";
  livraison: string;
};
type Faits = { readonly chaude: Fait };
type Cibles = { readonly cible_sucre: Cible<boolean> };

const given = givenOf<Questions, Faits, Cibles>();

const question = questionsOf<Questions>({
  options: {
    boisson: { the: "Un thé", cafe: "Un café", eau: "De l'eau" },
    taille: { petit: "Petit", grand: "Grand" },
  },
});

const chaude = given.question("boisson").answer().isOneOf("the", "cafe");
const grand = given.question("taille").answer().is("grand");
const livree = given.question("livraison").answer().toDate();

// La lecture d'un fait sur ces pages : les questions validées, le 27 octobre.
function lecture(pages: readonly Page[], answers: Answers): Reading {
  const { validated } = new Questionnaire(pages).readWith(answers);
  return {
    answer: validatedReading(validated),
    fait: () => undefined,
    cible: () => undefined,
    cibleAssuming: () => undefined,
    today: () => LocalDateTime.parse("2026-10-27"),
  };
}

describe("ce que lit une condition", () => {
  it("une réponse lit sa question", () => {
    expect(chaude.reads).toEqual({
      questions: ["boisson"],
      faits: [],
      cibles: [],
    });
  });

  it("une composition lit ce que lisent ses parties, chaque chose une fois", () => {
    const composee = chaude
      .and(grand.or(given.fait("chaude").isOui()))
      .not()
      .or(given.cible("cible_sucre").isInconnue().and(chaude));
    expect(composee.reads).toEqual({
      questions: ["boisson", "taille"],
      faits: ["chaude"],
      cibles: ["cible_sucre"],
    });
  });

  it("une date et une valeur calculée lisent ce qu'elles reprennent", () => {
    const bientot = livree.isBefore(given.today().plusDays(2));
    const longue = given
      .question("livraison")
      .answer()
      .compute(({ value }) => String(value ?? "").length > 10);
    expect(bientot.reads.questions).toEqual(["livraison"]);
    expect(longue.reads.questions).toEqual(["livraison"]);
  });

  it("une valeur calculée sur deux autres lit les deux", () => {
    const meme = given
      .question("boisson")
      .answer()
      .computeWith(
        given.question("taille").answer(),
        (boisson, taille) => boisson.value === taille.value,
      );
    expect(meme.reads.questions).toEqual(["boisson", "taille"]);
  });
});

describe("answer() dans un fait", () => {
  const COMMANDE = [
    page(
      "commande",
      question.singleChoice("taille", "Quelle taille ?"),
      question.singleChoice("boisson", "Quelle boisson ?"),
    ),
  ] as Page[];

  it("lit la réponse validée", () => {
    const validees = lecture(COMMANDE, { taille: "petit", boisson: "the" });
    expect(chaude.in(validees)).toBe(true);
    expect(chaude.and(grand).in(validees)).toBe(false);
    expect(chaude.and(grand.not()).in(validees)).toBe(true);
  });

  it("ne lit pas une réponse après une question qui attend la sienne", () => {
    expect(chaude.in(lecture(COMMANDE, { boisson: "the" }))).toBe(false);
  });
});

describe("les dates", () => {
  const LIVRAISON = [
    page("livraison", question.date("livraison", "Quand livrer ?")),
  ] as Page[];
  const le = (livraison: string) => lecture(LIVRAISON, { livraison });

  it("se comparent au jour, décalé ou non", () => {
    expect(livree.isAfter(given.today()).in(le("2026-10-28"))).toBe(true);
    expect(livree.isBefore(given.today()).in(le("2026-10-28"))).toBe(false);
    const demain = given.today().plusDays(1);
    expect(livree.isAtOrBefore(demain).in(le("2026-10-28"))).toBe(true);
    expect(livree.isAtOrBefore(demain).in(le("2026-10-29"))).toBe(false);
  });

  it("illisibles, donnent « non » à toute comparaison", () => {
    for (const illisible of [lecture(LIVRAISON, {}), le("28/10/2026")]) {
      expect(livree.isAfter(given.today()).in(illisible)).toBe(false);
      expect(livree.isBefore(given.today()).in(illisible)).toBe(false);
      expect(livree.isAtOrBefore(given.today()).in(illisible)).toBe(false);
      expect(given.today().isBefore(livree).in(illisible)).toBe(false);
    }
  });
});
