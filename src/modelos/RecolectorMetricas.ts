import type { ColectorMetricas } from "../interfaces/ColectorMetricas";
import type { GestorMemoria } from "../interfaces/GestorMemoria";
import { MetricasSimulacion } from "./MetricasSimulacion";
import { ResultadoCpu } from "./ResultadoEjecucion";

/**
 * Lleva los contadores de la simulación (ticks, uso de CPU, cambios de contexto)
 * y combina esos datos con los de la memoria en un MetricasSimulacion inmutable.
 */
export class RecolectorMetricas implements ColectorMetricas {
  private readonly _memoria: GestorMemoria;
  private _ticksTranscurridos: number = 0;
  private _ticksCpuOcupada: number = 0;
  private _cambiosContexto: number = 0;
  private _metricas: MetricasSimulacion;

  constructor(memoria: GestorMemoria) {
    this._memoria = memoria;
    this._metricas = this.calcular();
  }

  /** Últimas métricas calculadas (al finalizar el último tick). */
  obtenerMetricas(): MetricasSimulacion {
    return this._metricas;
  }

  private calcular(): MetricasSimulacion {
    return new MetricasSimulacion(
      this._memoria.obtenerOcupacion(),
      this.calcularUtilizacionCpu(),
      this._cambiosContexto,
      this._memoria.obtenerMemoriaLibreTotal(),
      this._memoria.obtenerMayorBloqueLibre(),
      this._memoria.obtenerFragmentacionExterna(),
    );
  }

  private calcularUtilizacionCpu(): number {
    return this._ticksTranscurridos === 0
      ? 0
      : (100 * this._ticksCpuOcupada) / this._ticksTranscurridos;
  }

  /** Fin de un tick: actualiza los contadores y recalcula las métricas. */
  registrarTick(resultado: ResultadoCpu): void {
    this._ticksTranscurridos++;
    this._ticksCpuOcupada += resultado === ResultadoCpu.SIN_PROCESO ? 0 : 1;
    this._cambiosContexto += RecolectorMetricas.CAMBIAN_CONTEXTO.has(resultado) ? 1 : 0;
    this._metricas = this.calcular();
  }

  /**
   * Convención del RF09: solo cuentan la expulsión por quantum con otros Listos y el
   * bloqueo por E/S. No cuentan el despacho inicial, la finalización ni la renovación
   * de quantum sin otros Listos.
   */
  private static readonly CAMBIAN_CONTEXTO: ReadonlySet<ResultadoCpu> = new Set([
    ResultadoCpu.EXPULSION,
    ResultadoCpu.BLOQUEO,
  ]);
}
