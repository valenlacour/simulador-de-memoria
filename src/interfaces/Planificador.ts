import type { ResultadoEjecucion } from "../modelos/ResultadoEjecucion";
import type { VistaProceso } from "../modelos/VistaProceso";
import type { Proceso } from "../modelos/Proceso";

/** Contrato de un planificador de CPU: administra la cola de Listos y el proceso en CPU. */
export interface Planificador {
  obtenerQuantum(): number;
  encolar(proceso: Proceso): void;
  ejecutarTick(): ResultadoEjecucion;
  obtenerProcesoEnCpu(): VistaProceso | null;
  obtenerColaListos(): readonly VistaProceso[];
}