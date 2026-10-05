/**
 * Informa si un proceso debe bloquearse por E/S al alcanzar cierta cantidad
 * de CPU consumida. El planificador solo conoce este contrato mínimo.
 */
export interface ProveedorEventosES {
  /** Duración del bloqueo si hay un evento en ese punto; null si no hay. */
  buscarDuracionBloqueo(pid: number, cpuConsumida: number): number | null;
}