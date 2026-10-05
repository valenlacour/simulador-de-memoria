import type { Planificador } from "../interfaces/Planificador";
import type { ProveedorEventosES } from "../interfaces/ProveedorEventosES";
import { EstadoProceso } from "./EstadoProceso";
import type { Proceso } from "./Proceso";
import { ResultadoCpu, ResultadoEjecucion } from "./ResultadoEjecucion";
import type { VistaProceso } from "./VistaProceso";

/**
 * Planificador Round-Robin: administra la CPU y la cola FIFO de procesos Listos.
 * Solo guarda procesos reales internamente; hacia afuera devuelve vistas de solo lectura.
 */
export class PlanificadorRoundRobin implements Planificador {
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

  /**
   * Avanza la CPU un tick: si está libre despacha al primero de la cola,
   * ejecuta una unidad y resuelve lo ocurrido. Como máximo un proceso consume CPU.
   */
  ejecutarTick(): ResultadoEjecucion {
    this.despacharSiLibre();
    if (this._procesoEnCpu === null) {
      return new ResultadoEjecucion(ResultadoCpu.SIN_PROCESO, null);
    }
    const proceso = this._procesoEnCpu;
    proceso.ejecutarTick();
    return this.resolverTick(proceso);
  }

  private despacharSiLibre(): void {
    if (this._procesoEnCpu === null && this._colaListos.length > 0) {
      const siguiente = this._colaListos.shift() as Proceso;
      siguiente.despachar();
      this._procesoEnCpu = siguiente;
    }
  }

  private resolverTick(proceso: Proceso): ResultadoEjecucion {
    return this.continuar(proceso);
  }

  private continuar(proceso: Proceso): ResultadoEjecucion {
    return new ResultadoEjecucion(ResultadoCpu.CONTINUA, proceso.obtenerPid());
  }
}
