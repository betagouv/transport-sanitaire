// Le script du CMS (Sites Conformes) pour le simulateur qu'il embarque en
// iframe : l'opt-out de la mesure d'audience, et le thème de la page.
//
// L'opt-out est dans le pied de page du CMS. Ce script y ajoute le bouton, garde
// le choix sur le domaine du CMS et le transmet au simulateur par `postMessage`,
// quand celui-ci le demande puis à chaque changement. Le protocole est celui de
// `front/socle/analytics/consent.ts`. Voir docs/knowledge/adr/analytics.md,
// ADR-5.
//
// Le thème est celui que le DSFR du CMS a résolu, clair ou sombre, d'après le
// choix du lecteur : `data-fr-theme` sur `<html>`. Le simulateur le demande et
// le reçoit de même, puis à chaque changement (#342). Le protocole est celui de
// `front/socle/theme/host-theme.ts`.
//
// À coller dans Sites Conformes : Paramètres → Scripts personnalisés → « Scripts
// dans la section <body> », entre `<script type="module">` et `</script>`. En
// module, il a sa propre portée (rien ne fuit dans la page du CMS) et s'exécute
// une fois la page analysée, pied de page compris.

// L'origine du simulateur embarqué : seul lui reçoit le choix.
const ORIGINE_SIMULATEUR = "https://simulateur.example";
const CLE = "statistiques-simulateur-refusees";
const LIBELLES = {
  suivi: "Désactiver la mesure d'audience du simulateur",
  refus: "Réactiver la mesure d'audience du simulateur",
};

// Le choix vit en mémoire, et dans le stockage du CMS quand il est disponible.
let refus = lireRefus();
// Les simulateurs qui ont demandé le choix, à prévenir s'il change.
const abonnes = [];
// Ceux qui ont demandé le thème, à prévenir de même.
const abonnesAuTheme = [];

window.addEventListener("message", (e) => {
  if (e.origin !== ORIGINE_SIMULATEUR) return;
  if (e.data?.type === "statistiques-simulateur:demande") {
    abonner(abonnes, e.source);
    prevenir(e.source);
  }
  if (e.data?.type === "theme-simulateur:demande") {
    abonner(abonnesAuTheme, e.source);
    envoyerLeTheme(e.source);
  }
});

ajouterAuPiedDePage();
suivreLeTheme();

function abonner(liste, simulateur) {
  if (!liste.includes(simulateur)) liste.push(simulateur);
}

function ajouterAuPiedDePage() {
  const liste = document.querySelector(".fr-footer__bottom-list");
  if (!liste) return;
  const item = document.createElement("li");
  item.className = "fr-footer__bottom-item";
  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = "fr-footer__bottom-link";
  bouton.textContent = libelle();
  bouton.addEventListener("click", () => {
    basculer();
    bouton.textContent = libelle();
  });
  item.appendChild(bouton);
  liste.appendChild(item);
}

function basculer() {
  refus = !refus;
  try {
    if (refus) localStorage.setItem(CLE, "1");
    else localStorage.removeItem(CLE);
  } catch {
    // Stockage indisponible : le choix vaut pour la page en cours.
  }
  abonnes.forEach(prevenir);
}

function prevenir(simulateur) {
  simulateur.postMessage(
    { type: "statistiques-simulateur:choix", suivi: !refus },
    ORIGINE_SIMULATEUR,
  );
}

function libelle() {
  return refus ? LIBELLES.refus : LIBELLES.suivi;
}

// Le DSFR change `data-fr-theme` quand le lecteur choisit un thème, ou que
// celui du système change.
function suivreLeTheme() {
  new MutationObserver(() => abonnesAuTheme.forEach(envoyerLeTheme)).observe(
    document.documentElement,
    { attributes: true, attributeFilter: ["data-fr-theme"] },
  );
}

function envoyerLeTheme(simulateur) {
  simulateur.postMessage(
    { type: "theme-simulateur:choix", theme: theme() },
    ORIGINE_SIMULATEUR,
  );
}

// Clair tant que le DSFR n'a rien résolu.
function theme() {
  const resolu = document.documentElement.getAttribute("data-fr-theme");
  return resolu === "dark" ? "dark" : "light";
}

function lireRefus() {
  try {
    return localStorage.getItem(CLE) === "1";
  } catch {
    return false;
  }
}
