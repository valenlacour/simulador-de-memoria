/**
 * Bloque contiguo de memoria, libre u ocupado por un proceso.
 * Es inmutable: las operaciones devuelven bloques nuevos.
 */
export class BloqueMemoria {
  private readonly _inicio: number;
  private readonly _tamano: number;
  private readonly _pidProceso: number | null;

  constructor(inicio: number, tamano: number, pidProceso: number | null = null) {
    BloqueMemoria.exigir(
      Number.isInteger(inicio) && inicio >= 0,
      "inicio debe ser un entero mayor o igual a 0",
    );
    BloqueMemoria.exigir(
      Number.isInteger(tamano) && tamano > 0,
      "tamano debe ser un entero positivo",
    );
    BloqueMemoria.exigir(
      pidProceso === null || (Number.isInteger(pidProceso) && pidProceso > 0),
      "pidProceso debe ser null o un entero positivo",
    );
    this._inicio = inicio;
    this._tamano = tamano;
    this._pidProceso = pidProceso;
  }

  obtenerInicio(): number {
    return this._inicio;
  }

  obtenerTamano(): number {
    return this._tamano;
  }

  /** Primera dirección posterior al bloque (límite exclusivo). */
  obtenerFin(): number {
    return this._inicio + this._tamano;
  }

  obtenerPidProceso(): number | null {
    return this._pidProceso;
  }

  estaLibre(): boolean {
    return this._pidProceso === null;
  }

  private static exigir(condicion: boolean, mensaje: string): void {
    if (!condicion) {
      throw new Error(mensaje);
    }
  }
}