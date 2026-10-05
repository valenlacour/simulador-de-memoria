import type { GestorBloqueados } from "../interfaces/GestorBloqueados";
import { EstadoProceso } from "./EstadoProceso";
import type { Proceso } from "./Proceso";
import type { VistaProceso } from "./VistaProceso";

/**
 * Procesos bloqueados por E/S, en el orden en que se bloquearon.
 * Guarda los procesos reales y hacia afuera solo entrega vistas de solo lectura.
 */
export class ColaBloqueados implements GestorBloqueados {
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

  /**
   * Fase de actualización de bloqueados: reduce el temporizador de cada proceso.
   * Los que llegan a cero pasan a Listo y se devuelven (por pid) en el orden en que
   * se bloquearon, para que el planificador los encole al final de la cola de Listos.
   */
  avanzar(): number[] {
    const liberados: Proceso[] = [];
    this._bloqueados.forEach((proceso) => {
      if (proceso.avanzarBloqueo()) {
        liberados.push(proceso);
      }
    });
    liberados.forEach((proceso) => this.liberar(proceso));
    return liberados.map((proceso) => proceso.obtenerPid());
  }

  private liberar(proceso: Proceso): void {
    proceso.desbloquear();
    this._bloqueados.splice(this._bloqueados.indexOf(proceso), 1);
  }
}
