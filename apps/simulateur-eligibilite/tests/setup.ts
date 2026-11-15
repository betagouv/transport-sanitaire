import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

// Un `findBy` ou un `waitFor` attend 1 s par défaut : trop court pour un écran
// qui prépare un document quand la machine est chargée.
configure({ asyncUtilTimeout: 10_000 });
