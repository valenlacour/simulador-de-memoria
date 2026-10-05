import type { ColectorMetricas } from "../interfaces/ColectorMetricas";
import type { GestorBloqueados } from "../interfaces/GestorBloqueados";
import type { GestorMemoria } from "../interfaces/GestorMemoria";
import type { Planificador } from "../interfaces/Planificador";
import { FabricaPoliticas } from "../politicas/FabricaPoliticas";
import { AgendaES } from "./AgendaES";
import type { BloqueMemoria } from "./BloqueMemoria";
import { ColaBloqueados } from "./ColaBloqueados";
import type { ConfiguracionSimulador } from "./ConfiguracionSimulador";
import { Memoria } from "./Memoria";
import type { MetricasSimulacion } from "./MetricasSimulacion";
import { PlanificadorRoundRobin } from "./PlanificadorRoundRobin";
import { Proceso } from "./Proceso";
import { RecolectorMetricas } from "./RecolectorMetricas";
import type { VistaProceso } from "./VistaProceso";

/**
 * Motor de la simulación: coordina las fases de cada tick entre la memoria, el
 * planificador, los bloqueados y las métricas. No contiene lógica de esas partes;
 * trabaja siempre a través de sus interfaces y solo expone vistas de solo lectura.
 */
export class Simulador {
  private readonly _configuracion: ConfiguracionSimulador;
  private readonly _memoria: GestorMemoria;
  private readonly _agenda: AgendaES;
  private readonly _planificador: Planificador;
  private readonly _bloqueados: GestorBloqueados;
  private readonly _metricas: ColectorMetricas;
  private readonly _procesos: Map<number, Proceso> = new Map();
  private _tick: number = 0;

  constructor(configuracion: ConfiguracionSimulador) {
    this._configuracion = configuracion;
    this._memoria = new Memoria(
      configuracion.obtenerMemoriaTotal(),
      FabricaPoliticas.crear(configuracion.obtenerPolitica()),
    );
    this._agenda = new AgendaES();
    this._planificador = new PlanificadorRoundRobin(configuracion.obtenerQuantum(), this._agenda);
    this._bloqueados = new ColaBloqueados();
    this._metricas = new RecolectorMetricas(this._memoria);
  }

  obtenerConfiguracion(): ConfiguracionSimulador {
    return this._configuracion;
  }

  obtenerTickActual(): number {
    return this._tick;
  }

  obtenerNombrePolitica(): string {
    return this._memoria.obtenerNombrePolitica();
  }

  /** Copia del mapa de memoria; los bloques son inmutables. */
  obtenerMapaMemoria(): readonly BloqueMemoria[] {
    return this._memoria.obtenerMapa();
  }

  obtenerMetricas(): MetricasSimulacion {
    return this._metricas.obtenerMetricas();
  }

  obtenerProcesoEnCpu(): VistaProceso | null {
    return this._planificador.obtenerProcesoEnCpu();
  }

  /** Cola de Listos en orden FIFO. */
  obtenerColaListos(): readonly VistaProceso[] {
    return this._planificador.obtenerColaListos();
  }

  obtenerBloqueados(): readonly VistaProceso[] {
    return this._bloqueados.obtenerBloqueados();
  }

  /**
   * Registra un proceso nuevo (estado NUEVO). Rechaza datos inválidos, PID duplicados
   * y pedidos mayores a la memoria total, sin dejar estados parciales.
   */
  registrarProceso(pid: number, memoriaRequerida: number, cpuTotal: number): void {
    const proceso = new Proceso(pid, memoriaRequerida, cpuTotal);
    if (this._procesos.has(pid)) {
      throw new Error(`Ya existe un proceso con PID ${pid}`);
    }
    if (memoriaRequerida > this._configuracion.obtenerMemoriaTotal()) {
      throw new Error(`El proceso ${pid} pide ${memoriaRequerida} KB y la memoria total es menor`);
    }
    this._procesos.set(pid, proceso);
  }

  obtenerProceso(pid: number): VistaProceso {
    return this.buscar(pid).crearVista();
  }

  /** Vistas de todos los procesos, en orden de registro. */
  obtenerProcesos(): readonly VistaProceso[] {
    return [...this._procesos.values()].map((proceso) => proceso.crearVista());
  }

  private buscar(pid: number): Proceso {
    const proceso = this._procesos.get(pid);
    if (proceso === undefined) {
      throw new Error(`No existe el proceso ${pid}`);
    }
    return proceso;
  }
}
