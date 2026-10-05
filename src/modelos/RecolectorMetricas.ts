import type { GestorMemoria } from "../interfaces/GestorMemoria";
import { MetricasSimulacion } from "./MetricasSimulacion";

/**
 * Lleva los contadores de la simulación (ticks, uso de CPU, cambios de contexto)
 * y combina esos datos con los de la memoria en un MetricasSimulacion inmutable.
 */
export class RecolectorMetricas {
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
}