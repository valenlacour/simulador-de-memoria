import type { MetricasSimulacion } from "../modelos/MetricasSimulacion";
import type { ResultadoCpu } from "../modelos/ResultadoEjecucion";

/** Contrato de quien lleva las métricas de la simulación. */
export interface ColectorMetricas {
  /** Se invoca al finalizar cada tick con lo que ocurrió en la CPU. */
  registrarTick(resultado: ResultadoCpu): void;
  obtenerMetricas(): MetricasSimulacion;
}