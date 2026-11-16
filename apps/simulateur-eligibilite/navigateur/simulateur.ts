// Où le simulateur est servi pendant les parcours en navigateur.
//
// `127.0.0.1` pour lui, `localhost` pour la page hôte : deux sites distincts
// pour le navigateur, comme le simulateur et le CMS en production.

export const PORT_SIMULATEUR = 4173;
export const ORIGINE_SIMULATEUR = `http://127.0.0.1:${PORT_SIMULATEUR}`;
