// L'écran du simulateur : le simulateur, et le pied de page en bas.
//
// À l'écran, la page fait au moins la hauteur de la fenêtre. Le pied de page
// reste donc en bas, même quand le contenu est court. À l'impression, non : la
// feuille ne laisse pas de page blanche derrière elle (simulateur-screen.css).

import type { ComponentProps } from "react";
import { Container } from "../app/Container";
import { Footer } from "../app/Footer";
import { Simulateur } from "./Simulateur";
import "./simulateur-screen.css";

export function SimulateurScreen(props: ComponentProps<typeof Simulateur>) {
  return (
    <div className="socle-screen">
      <Container>
        <Simulateur {...props} />
      </Container>
      <Footer />
    </div>
  );
}
