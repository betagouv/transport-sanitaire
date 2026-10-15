// La trace de debug du simulateur : la page affichée, les pages parcourues, les
// questions validées et les réponses. Sous le questionnaire, elle ajoute les
// questions de la page, répondues ou non, et le brouillon de la page. Sous un
// résultat, les faits et les cibles de la préconisation. Elle s'exporte en un
// fichier, pour la recette.
//
// C'est un developer tool, réservé au service qui les déverrouille (`unlock.ts`).
// Le simulateur ne l'importe pas : `App` la lui passe.

import { SHA_COMMIT, VERSION_APP } from "../app/deployed-version";
import type { DebugTraceProps } from "../questionnaire-engine/QuestionnaireForm";
import type { Validated } from "../questionnaire-engine/question";

export function DebugTrace(props: DebugTraceProps) {
  return (
    <details style={{ marginTop: "2.5rem", fontSize: "0.8rem", color: "#555" }}>
      <summary style={{ cursor: "pointer" }}>Debug — {props.title}</summary>
      <div style={{ marginTop: "0.75rem" }}>
        <ExportLink trace={props} />
        <ShownPage {...props} />
        <strong>Pages (◀ = page courante) :</strong>
        <PageList pages={props.pages} currentPage={props.currentPage} />
        {props.draft && (
          <ValueList title="Brouillon de la page" values={props.draft} />
        )}
        <ValueList title="Réponses validées" values={props.answers} />
        {props.validated && <ValidatedList validated={props.validated} />}
        {props.faits && <ValueList title="Faits" values={props.faits} />}
        {props.cibles && <ValueList title="Cibles" values={props.cibles} />}
      </div>
    </details>
  );
}

// ---- implémentation ----

// Ce qu'une cible indéfinie vaut à l'écran et dans l'export. JSON n'a pas de
// valeur pour elle, et `null` veut déjà dire « sans objet ».
const UNDEFINED = "indéfinie";

// Le fichier se fabrique dans le lien : rien ne quitte le navigateur. Il dit
// aussi quel code tournait, pour rapprocher une trace d'un déploiement.
function ExportLink({ trace }: { trace: DebugTraceProps }) {
  const { pages, cibles, ...rest } = trace;
  const content = {
    app: { version: VERSION_APP, commit: SHA_COMMIT },
    ...rest,
    pages: pages.map((page) => page.id),
    ...(cibles && { cibles: withUndefinedNamed(cibles) }),
  };
  const file = encodeURIComponent(JSON.stringify(content, null, 2));
  return (
    <p style={{ margin: "0 0 1rem", fontSize: "inherit" }}>
      <a
        download="trace-de-debug.json"
        href={`data:application/json;charset=utf-8,${file}`}
      >
        Exporter la trace
      </a>
    </p>
  );
}

function withUndefinedNamed(cibles: Readonly<Record<string, unknown>>) {
  return Object.fromEntries(
    Object.entries(cibles).map(([id, value]) => [
      id,
      value === undefined ? UNDEFINED : value,
    ]),
  );
}

// La page affichée, toujours nommée : son identifiant sous le questionnaire, le
// titre de l'écran sous un résultat. Puis chacune de ses questions affichées,
// avec ce qu'en dit le brouillon, même sans réponse.
function ShownPage({ title, currentPage, questions, draft }: DebugTraceProps) {
  return (
    <>
      <strong>Page affichée :</strong> <code>{currentPage ?? title}</code>
      {questions && (
        <ul style={{ margin: "0.25rem 0 1rem" }}>
          {questions.map(({ id, label }) => (
            <li key={id}>
              <code>{id}</code> {label}{" "}
              <Value value={draft?.[id]} absent="sans réponse" />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function PageList({
  pages,
  currentPage,
}: Pick<DebugTraceProps, "pages" | "currentPage">) {
  return (
    <ol style={{ margin: "0.25rem 0 1rem" }}>
      {pages.map((page) => (
        <li
          key={page.id}
          style={{ fontWeight: page.id === currentPage ? 700 : 400 }}
        >
          <code>{page.id}</code>
          {page.id === currentPage ? " ◀" : ""}
        </li>
      ))}
    </ol>
  );
}

// Chaque question validée : sa réponse, et ce qui s'y proposait. C'est ce qui
// distingue une option refusée d'une option jamais montrée.
function ValidatedList({ validated }: { validated: Validated }) {
  const entries = Object.entries(validated);
  return (
    <>
      <strong>Questions validées :</strong>
      <ul style={{ margin: "0.25rem 0 1rem" }}>
        {entries.length === 0 && <li>(aucune)</li>}
        {entries.map(([id, question]) => (
          <li key={id}>
            <code>{id}</code>{" "}
            <Value value={question?.answer} absent="sans réponse" />
            {question?.offered && (
              <>
                , proposées : <code>{question.offered.join(", ")}</code>
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function ValueList({
  title,
  values,
}: {
  title: string;
  values: Readonly<Record<string, unknown>>;
}) {
  const entries = Object.entries(values);
  return (
    <>
      <strong>{title} :</strong>
      <ul style={{ margin: "0.25rem 0 1rem" }}>
        {entries.length === 0 && <li>(aucune)</li>}
        {entries.map(([id, value]) => (
          <li key={id}>
            <code>{id}</code> <Value value={value} absent={UNDEFINED} />
          </li>
        ))}
      </ul>
    </>
  );
}

// Une valeur telle qu'elle est écrite dans le code, ou ce qui se dit quand il
// n'y en a pas.
function Value({ value, absent }: { value: unknown; absent: string }) {
  if (value === undefined)
    return (
      <>
        : <em>{absent}</em>
      </>
    );
  return (
    <>
      = <code>{JSON.stringify(value)}</code>
    </>
  );
}
