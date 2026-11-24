// Ce que la collecte demande au référentiel : l'établissement et le service
// d'un événement y sont-ils ? Le référentiel en cache
// (`cached-referentiel.adapter.ts`) y répond.

export interface KnownRattachements {
  /** L'établissement est-il au référentiel ? */
  hasEstablishment(establishmentId: string): Promise<boolean>;
  /** Le service est-il au référentiel, sous cet établissement ? */
  hasService(establishmentId: string, serviceId: string): Promise<boolean>;
}
