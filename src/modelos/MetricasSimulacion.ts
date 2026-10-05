/** Conjunto de métricas de un instante de la simulación. Es inmutable. */
export class MetricasSimulacion {
  constructor(
    private readonly _ocupacionMemoria: number,
    private readonly _utilizacionCpu: number,
    private readonly _cambiosContexto: number,
    private readonly _memoriaLibreTotal: number,
    private readonly _mayorBloqueLibre: number,
    private readonly _fragmentacionExterna: number,
  ) {}

  /** 100 × memoria ocupada / memoria total. */
  obtenerOcupacionMemoria(): number {
    return this._ocupacionMemoria;
  }

  /** 100 × ticks con CPU ocupada / ticks transcurridos (0 en el tick 0). */
  obtenerUtilizacionCpu(): number {
    return this._utilizacionCpu;
  }

  obtenerCambiosContexto(): number {
    return this._cambiosContexto;
  }

  obtenerMemoriaLibreTotal(): number {
    return this._memoriaLibreTotal;
  }

  obtenerMayorBloqueLibre(): number {
    return this._mayorBloqueLibre;
  }

  /** 100 × (1 − mayor bloque libre / memoria libre total); 0 si no hay memoria libre. */
  obtenerFragmentacionExterna(): number {
    return this._fragmentacionExterna;
  }
}