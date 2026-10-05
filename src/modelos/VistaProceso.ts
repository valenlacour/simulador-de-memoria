import type { EstadoProceso } from "./EstadoProceso";

/**
 * Copia inmutable del estado de un proceso en un instante.
 * Permite consultar sin exponer el proceso original ni sus transiciones.
 */
export class VistaProceso {
  constructor(
    private readonly _pid: number,
    private readonly _memoriaRequerida: number,
    private readonly _cpuTotal: number,
    private readonly _cpuRestante: number,
    private readonly _estado: EstadoProceso,
    private readonly _quantumConsumido: number,
    private readonly _bloqueoRestante: number,
  ) {}

  obtenerPid(): number {
    return this._pid;
  }

  obtenerMemoriaRequerida(): number {
    return this._memoriaRequerida;
  }

  obtenerCpuTotal(): number {
    return this._cpuTotal;
  }

  obtenerCpuRestante(): number {
    return this._cpuRestante;
  }

  obtenerEstado(): EstadoProceso {
    return this._estado;
  }

  obtenerQuantumConsumido(): number {
    return this._quantumConsumido;
  }

  obtenerBloqueoRestante(): number {
    return this._bloqueoRestante;
  }
}