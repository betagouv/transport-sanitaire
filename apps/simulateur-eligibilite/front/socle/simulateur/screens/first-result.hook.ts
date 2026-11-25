import { useEffect, useState } from "react";
import type { FirstResult } from "../../model";
import type { Loading } from "./first-result.service";

// Un état plutôt que `use()` : une suspension née dans un `act` synchrone, celui
// d'un clic sous les tests, ne reprend jamais.
export function useLoaded(result: Loading): FirstResult | null {
  const [loaded, setLoaded] = useState<{ from: Loading; value: FirstResult }>();
  useEffect(() => {
    if (!(result instanceof Promise)) return;
    let live = true;
    result.then((value) => live && setLoaded({ from: result, value }));
    return () => {
      live = false;
    };
  }, [result]);
  if (!(result instanceof Promise)) return result;
  return loaded?.from === result ? loaded.value : null;
}
