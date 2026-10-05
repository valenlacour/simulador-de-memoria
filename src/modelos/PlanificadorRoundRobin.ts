import type { ProveedorEventosES } from "../interfaces/ProveedorEventosES";
import { EstadoProceso } from "./EstadoProceso";
import type { Proceso } from "./Proceso";
import type { VistaProceso } from "./VistaProceso";

/**
 * Planificador Round-Robin: administra la CPU y la cola FIFO de procesos Listos.
 * Solo guarda procesos reales internamente; hacia afuera devuelve vistas de solo lectura.
 */
export class PlanificadorRoundRobin {
  private readonly _quantum: number;
  private readonly _eventos: ProveedorEventosES;
  private readonly _colaListos: Proceso[] = [];
  private _procesoEnCpu: Proceso | null = null;

  constructor(quantum: number, eventos: ProveedorEventosES) {
    if (!Number.isInteger(quantum) || quantum <= 0) {
      throw new Error("quantum debe ser un entero positivo");
    }
    this._quantum = quantum;
    this._eventos = eventos;
  }

  obtenerQuantum(): number {
    return this._quantum;
  }

  /** Agrega un proceso Listo al final de la cola. */
  encolar(proceso: Proceso): void {
    if (proceso.obtenerEstado() !== EstadoProceso.LISTO) {
      throw new Error(`Solo se puede encolar un proceso LISTO (pid ${proceso.obtenerPid()})`);
    }
    if (this.estaEnLaCola(proceso.obtenerPid())) {
      throw new Error(`El proceso ${proceso.obtenerPid()} ya está en la cola de Listos`);
    }
    this._colaListos.push(proceso);
  }

  obtenerProcesoEnCpu(): VistaProceso | null {
    return this._procesoEnCpu?.crearVista() ?? null;
  }

  /** Copia de la cola en orden FIFO; modificarla no altera el planificador. */
  obtenerColaListos(): readonly VistaProceso[] {
    return this._colaListos.map((proceso) => proceso.crearVista());
  }

  private estaEnLaCola(pid: number): boolean {
    return this._colaListos.some((proceso) => proceso.obtenerPid() === pid);
  }
}