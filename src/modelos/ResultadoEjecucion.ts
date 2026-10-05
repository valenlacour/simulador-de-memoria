export enum ResultadoCpu {
  SIN_PROCESO = "SIN_PROCESO",
  CONTINUA = "CONTINUA",
  RENOVACION_QUANTUM = "RENOVACION_QUANTUM",
  EXPULSION = "EXPULSION",
  BLOQUEO = "BLOQUEO",
  FINALIZO = "FINALIZO",
}

/** Qué ocurrió en la CPU durante un tick y a qué proceso le ocurrió. Es inmutable. */
export class ResultadoEjecucion {
  private readonly _resultado: ResultadoCpu;
  private readonly _pid: number | null;

  constructor(resultado: ResultadoCpu, pid: number | null) {
    this._resultado = resultado;
    this._pid = pid;
  }

  obtenerResultado(): ResultadoCpu {
    return this._resultado;
  }

  obtenerPid(): number | null {
    return this._pid;
  }
}