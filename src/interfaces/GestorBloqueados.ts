import type { Proceso } from "../modelos/Proceso";
import type { VistaProceso } from "../modelos/VistaProceso";

/** Contrato de la cola de procesos bloqueados por E/S. */
export interface GestorBloqueados {
  agregar(proceso: Proceso): void;
  /** Reduce los temporizadores y devuelve los pids que pasaron a Listo, en orden de bloqueo. */
  avanzar(): readonly number[];
  contiene(pid: number): boolean;
  obtenerBloqueados(): readonly VistaProceso[];
}