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
import { EstadoProceso } from "./EstadoProceso";
import { ResultadoCpu, type ResultadoEjecucion } from "./ResultadoEjecucion";
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

  /**
   * Avanza la simulación exactamente un tick. Fases, en orden: 1) admisión e intento de
   * asignación, 2) actualización de bloqueados, 3) despacho y ejecución Round-Robin,
   * 4) actualización del reloj y de las métricas.
   */
  avanzarTick(): void {
    this.admitirProcesos();
    this.cerrarTick(this.ejecutarCpu());
  }

  /** Procesos esperando memoria, en orden de registro. */
  obtenerProcesosEsperandoMemoria(): readonly VistaProceso[] {
    return [...this._procesos.values()]
      .filter((proceso) => proceso.obtenerEstado() === EstadoProceso.ESPERANDO_MEMORIA)
      .map((proceso) => proceso.crearVista());
  }

  /** Procesos terminados, en el orden en que terminaron. */
  obtenerTerminados(): readonly VistaProceso[] {
    return this._terminados.map((pid) => this.buscar(pid).crearVista());
  }

  private readonly _terminados: number[] = [];

  private static readonly SIN_ACCION = (): void => undefined;

  private static readonly ESTADOS_PENDIENTES: ReadonlySet<EstadoProceso> = new Set([
    EstadoProceso.NUEVO,
    EstadoProceso.ESPERANDO_MEMORIA,
  ]);

  /** Qué hace el simulador según lo ocurrido en la CPU (tabla de despacho, sin condicionales por tipo). */
  private readonly _reacciones: Record<ResultadoCpu, (pid: number) => void> = {
    [ResultadoCpu.SIN_PROCESO]: Simulador.SIN_ACCION,
    [ResultadoCpu.CONTINUA]: Simulador.SIN_ACCION,
    [ResultadoCpu.RENOVACION_QUANTUM]: Simulador.SIN_ACCION,
    [ResultadoCpu.EXPULSION]: Simulador.SIN_ACCION,
    [ResultadoCpu.BLOQUEO]: Simulador.SIN_ACCION,
    [ResultadoCpu.FINALIZO]: (pid) => this.finalizar(pid),
  };

  // Fase 1: reintenta la asignación de todos los procesos pendientes, en orden de registro.
  private admitirProcesos(): void {
    [...this._procesos.values()]
      .filter((proceso) => Simulador.ESTADOS_PENDIENTES.has(proceso.obtenerEstado()))
      .forEach((proceso) => this.intentarAdmitir(proceso));
  }

  private intentarAdmitir(proceso: Proceso): void {
    if (this._memoria.asignar(proceso.obtenerPid(), proceso.obtenerMemoriaRequerida())) {
      proceso.admitir();
      this._planificador.encolar(proceso);
    } else if (proceso.obtenerEstado() === EstadoProceso.NUEVO) {
      proceso.esperarMemoria();
    }
  }

  // Fase 3: despacho y ejecución Round-Robin.
  private ejecutarCpu(): ResultadoEjecucion {
    const resultado = this._planificador.ejecutarTick();
    this.reaccionarA(resultado);
    return resultado;
  }

  private reaccionarA(resultado: ResultadoEjecucion): void {
    const pid = resultado.obtenerPid();
    if (pid !== null) {
      this._reacciones[resultado.obtenerResultado()](pid);
    }
  }

  /** Al terminar un proceso se libera su memoria en ese mismo tick. */
  private finalizar(pid: number): void {
    this._memoria.liberar(pid);
    this._terminados.push(pid);
  }

  // Fase 4: actualización del reloj y de las métricas.
  private cerrarTick(resultado: ResultadoEjecucion): void {
    this._tick++;
    this._metricas.registrarTick(resultado.obtenerResultado());
  }
}
