import { EstadoProceso } from "./EstadoProceso";
import type { Proceso } from "./Proceso";
import type { VistaProceso } from "./VistaProceso";

/**
 * Procesos bloqueados por E/S, en el orden en que se bloquearon.
 * Guarda los procesos reales y hacia afuera solo entrega vistas de solo lectura.
 */
export class ColaBloqueados {
  private readonly _bloqueados: Proceso[] = [];

  agregar(proceso: Proceso): void {
    if (proceso.obtenerEstado() !== EstadoProceso.BLOQUEADO) {
      throw new Error(`Solo se puede agregar un proceso BLOQUEADO (pid ${proceso.obtenerPid()})`);
    }
    if (this.contiene(proceso.obtenerPid())) {
      throw new Error(`El proceso ${proceso.obtenerPid()} ya está en la cola de bloqueados`);
    }
    this._bloqueados.push(proceso);
  }

  contiene(pid: number): boolean {
    return this._bloqueados.some((proceso) => proceso.obtenerPid() === pid);
  }

  obtenerBloqueados(): readonly VistaProceso[] {
    return this._bloqueados.map((proceso) => proceso.crearVista());
  }
}