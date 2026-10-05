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

  /** Indica si el bloque está libre y alcanza para el tamaño pedido. */
  puedeContener(tamanoRequerido: number): boolean {
    return this.estaLibre() && this._tamano >= tamanoRequerido;
  }

  ocupar(pidProceso: number): BloqueMemoria {
    BloqueMemoria.exigir(this.estaLibre(), "El bloque ya está ocupado");
    return new BloqueMemoria(this._inicio, this._tamano, pidProceso);
  }

  liberar(): BloqueMemoria {
    BloqueMemoria.exigir(!this.estaLibre(), "El bloque ya está libre");
    return new BloqueMemoria(this._inicio, this._tamano);
  }

  /**
   * Divide un bloque libre en dos bloques libres contiguos.
   * El primero tiene el tamaño pedido y el segundo el resto (nunca de tamaño cero).
   */
  separar(tamanoPrimero: number): [BloqueMemoria, BloqueMemoria] {
    BloqueMemoria.exigir(this.estaLibre(), "Solo se puede separar un bloque libre");
    BloqueMemoria.exigir(
      Number.isInteger(tamanoPrimero) && tamanoPrimero > 0 && tamanoPrimero < this._tamano,
      "El tamaño debe ser un entero positivo menor al del bloque",
    );
    return [
      new BloqueMemoria(this._inicio, tamanoPrimero),
      new BloqueMemoria(this._inicio + tamanoPrimero, this._tamano - tamanoPrimero),
    ];
  }
}
